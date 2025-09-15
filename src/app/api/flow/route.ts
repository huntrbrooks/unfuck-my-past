import { NextRequest, NextResponse } from 'next/server'
import OpenAI from 'openai'
import { FlowGraph } from '@/lib/flowSchema'

const client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY })

function buildLocalFlowFromSeed(seed: any) {
  const palette = ['#22c55e', '#06b6d4', '#f59e0b', '#ef4444', '#6366f1']
  const topic = String(seed?.topic || 'Healing Roadmap')
  const stages: string[] = Array.isArray(seed?.stages) && seed.stages.length
    ? seed.stages.map((s: any) => String(s))
    : ['Today', 'This Week', 'This Month', '3 Months', '1 Year']

  // Build in forward order, then reverse for UI (end-to-beginning)
  const forwardNodes = stages.map((label, i) => ({
    id: `n${i + 1}`,
    label: label.slice(0, 24),
    type: i === 0 ? 'input' : 'default',
    color: palette[i % palette.length]
  }))
  const forwardEdges = forwardNodes.slice(0, forwardNodes.length - 1).map((_, i) => ({
    id: `e${i + 1}`,
    source: forwardNodes[i].id,
    target: forwardNodes[i + 1].id
  }))

  // Reverse to display end → beginning
  const nodes = [...forwardNodes].reverse()
  const edges = nodes.slice(0, nodes.length - 1).map((_, i) => ({
    id: `e${i + 1}`,
    source: nodes[i].id,
    target: nodes[i + 1].id
  }))

  return { title: topic, nodes, edges }
}

function repairModelFlow(raw: any, seed: any) {
  const topic = String(raw?.title || seed?.topic || 'Healing Roadmap')
  const palette = ['#22c55e', '#06b6d4', '#f59e0b', '#ef4444', '#6366f1']
  const inputNodes: any[] = Array.isArray(raw?.nodes) ? raw.nodes : []
  let nodes = inputNodes.map((n, i) => ({
    id: String(n?.id ?? `n${i + 1}`),
    label: String(n?.label ?? `Step ${i + 1}`).slice(0, 24),
    type: (['input', 'default', 'output'] as const).includes(n?.type) ? n.type : 'default',
    group: typeof n?.group === 'string' ? n.group : undefined,
    color: typeof n?.color === 'string' ? n.color : palette[i % palette.length],
    x: typeof n?.x === 'number' ? n.x : undefined,
    y: typeof n?.y === 'number' ? n.y : undefined
  }))
  if (!nodes.length) {
    // Build nodes from seed if model omitted
    return buildLocalFlowFromSeed(seed)
  }
  // Ensure first/last types
  nodes = nodes.map((n, i) => ({
    ...n,
    type: i === 0 ? 'input' : 'default'
  }))

  const inputEdges: any[] = Array.isArray(raw?.edges) ? raw.edges : []
  const validEdges = inputEdges
    .map((e, i) => ({ id: String(e?.id ?? `e${i + 1}`), source: String(e?.source ?? ''), target: String(e?.target ?? ''), label: typeof e?.label === 'string' ? e.label : undefined, animated: Boolean(e?.animated) }))
    .filter(e => e.id && e.source && e.target)

  // Reverse node order for end → beginning display
  nodes = nodes.reverse()
  const edges = validEdges.length
    ? validEdges
    : nodes.slice(0, nodes.length - 1).map((_, i) => ({ id: `e${i + 1}`, source: nodes[i].id, target: nodes[i + 1].id }))

  return { title: topic, nodes, edges }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()

    const sys = `You are a flow designer. Produce a directed flow that is easy to read.
Rules:
1) Output JSON only that matches the provided JSON schema.
2) Use short labels. Max 24 chars per node, 18 chars preferred.
3) Color code groups. Keep a consistent palette.
4) Make 3 to 7 primary nodes unless complexity requires more.
5) Include edges for the logical path.`

    const user = {
      role: 'user',
      content: [
        {
          type: 'text',
          text: `Convert the following data into a flow.

Data:
${JSON.stringify(body, null, 2)}

Constraints:
- Return a FlowGraph JSON with fields: title, nodes, edges.
- Use "input" for the start node.
- Use colors like "#22c55e", "#06b6d4", "#f59e0b", "#ef4444", "#6366f1".
- Place high level milestones first, then branch if needed.`
        }
      ]
    } as const

    // If no key, return a local flow from seed
    if (!process.env.OPENAI_API_KEY) {
      const localFlow = buildLocalFlowFromSeed(body)
      const validated = FlowGraph.parse(localFlow)
      return NextResponse.json(validated)
    }

    const resp = await client.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [
        { role: 'system', content: sys },
        user as any
      ],
      response_format: { type: 'json_object' },
      temperature: 0.3
    })

    const raw = resp.choices?.[0]?.message?.content ?? '{}'
    let json: any
    try { json = JSON.parse(raw) } catch { json = {} }
    const repaired = repairModelFlow(json, body)
    const parsed = FlowGraph.parse(repaired)

    return NextResponse.json(parsed)
  } catch (err: any) {
    return NextResponse.json(
      { error: err?.message ?? 'Failed to build flow' },
      { status: 400 }
    )
  }
}


