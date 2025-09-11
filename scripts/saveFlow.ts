import fs from 'fs'
import path from 'path'
import { FlowGraph } from '@/lib/flowSchema'

const out = path.join('/Users/gerardgrenville/Downloads/Chat GPT/flows', 'bounce_back.json')

const jsonStr = process.argv[2]
if (!jsonStr) {
  console.error('Usage: ts-node scripts/saveFlow.ts <json>')
  process.exit(1)
}

try {
  const parsed = FlowGraph.parse(JSON.parse(jsonStr))
  fs.mkdirSync(path.dirname(out), { recursive: true })
  fs.writeFileSync(out, JSON.stringify(parsed, null, 2))
  console.log('Saved', out)
} catch (e: any) {
  console.error('Failed to save flow:', e.message)
  process.exit(1)
}


