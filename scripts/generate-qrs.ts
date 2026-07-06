import { generateAllQrs } from './generate-qrs-core.ts'

generateAllQrs().catch((err) => {
  console.error(err)
  process.exit(1)
})
