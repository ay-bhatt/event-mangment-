import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'
import QRCode from 'qrcode'
import {
  assignStableIds,
  type IdRegistry,
} from '../src/lib/id-registry.ts'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const root = path.resolve(__dirname, '..')
const volunteerDataPath = path.join(root, 'src/data/example.json')
const activitySources = [
  {
    name: 'adventure',
    path: path.join(root, 'src/data/activity.json'),
    prefix: '-ADV',
  },
  {
    name: 'cultural',
    path: path.join(root, 'src/data/cultural.json'),
    prefix: '-CUL',
  },
  {
    name: 'workshop',
    path: path.join(root, 'src/data/workshop.json'),
    prefix: '-WSH',
  },
]
const registryPath = path.join(root, 'src/data/id-registry.json')
const outDir = path.join(root, 'src/generatedQRCodes')

type VolunteerInput = {
  name: string
  email: string
  phone: string
  team: string
  role: string
}

type PassEntry = {
  id: string
  name: string
  email: string
  phone: string
  team: string
  role: string
}

function loadRegistry(): IdRegistry {
  if (!fs.existsSync(registryPath)) {
    return { nextSeq: 1, assignments: {} }
  }
  return JSON.parse(fs.readFileSync(registryPath, 'utf-8')) as IdRegistry
}

function saveRegistry(registry: IdRegistry): void {
  fs.writeFileSync(registryPath, `${JSON.stringify(registry, null, 2)}\n`)
}

function loadJsonArray(filePath: string): VolunteerInput[] {
  const raw = fs.readFileSync(filePath, 'utf-8')
  const parsed = JSON.parse(raw)
  if (!Array.isArray(parsed)) {
    throw new Error(`${filePath} must be a JSON array`)
  }
  return parsed as VolunteerInput[]
}

export async function generateAllQrs(): Promise<void> {
  const PREFIX = process.env.QR_PREFIX || 'JATRA-VOL'
  const BASE_URL = process.env.VITE_APP_BASE_URL || 'http://localhost:5173'

  const volunteers = loadJsonArray(volunteerDataPath)

  const activityEntries: PassEntry[] = activitySources.flatMap((source) =>
    loadJsonArray(source.path).map((entry, index) => ({
      ...entry,
      id: `${source.prefix}-${String(index + 1).padStart(3, '0')}`,
    })),
  )

  fs.mkdirSync(outDir, { recursive: true })

  const registry = loadRegistry()
  const { volunteers: assigned, registry: updated } = assignStableIds(
    volunteers,
    registry,
    PREFIX,
  )
  saveRegistry(updated)

  const activeIds = new Set<string>()
  let generated = 0
  let skipped = 0

  const allPasses = [
    ...assigned,
    ...activityEntries,
  ]

  for (const pass of allPasses) {
    activeIds.add(pass.id)
    const payload = `${BASE_URL.replace(/\/$/, '')}/verify/${encodeURIComponent(pass.id)}`
    const file = `${pass.id}.png`
    const outPath = path.join(outDir, file)

    if (fs.existsSync(outPath)) {
      skipped += 1
      continue
    }

    await QRCode.toFile(outPath, payload, { width: 400, margin: 1 })
    console.log(`✓ ${file}`)
    generated += 1
  }

  const existing = fs.readdirSync(outDir).filter((f) => f.endsWith('.png'))
  for (const file of existing) {
    const id = file.replace('.png', '')
    if (!activeIds.has(id)) {
      fs.unlinkSync(path.join(outDir, file))
      console.log(`✗ removed orphan ${file}`)
    }
  }

  console.log(
    `\nDone: ${assigned.length} volunteer(s), ${activityEntries.length} activity pass(es), ${generated} new QR(s), ${skipped} already existed.`,
  )
  console.log(`IDs saved to src/data/id-registry.json`)
}
