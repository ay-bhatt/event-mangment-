import path from 'path'
import type { Plugin } from 'vite'
import { generateAllQrs } from './scripts/generate-qrs-core'

const EXAMPLE_JSON = path.normalize('src/data/example.json')

let running = false
let queued = false

async function queueGenerate() {
  if (running) {
    queued = true
    return
  }
  running = true
  try {
    await generateAllQrs()
  } catch (err) {
    console.error('[auto-qrs]', err)
  } finally {
    running = false
    if (queued) {
      queued = false
      await queueGenerate()
    }
  }
}

export function autoQrsPlugin(): Plugin {
  return {
    name: 'auto-qrs',
    configureServer(server) {
      void queueGenerate()

      server.watcher.on('change', (file) => {
        const normalized = path.normalize(file)
        if (normalized.endsWith(EXAMPLE_JSON)) {
          void queueGenerate().then(() => {
            server.ws.send({ type: 'full-reload' })
          })
        }
      })
    },
  }
}
