import { z } from 'zod'

export const FlowNode = z.object({
  id: z.string(),
  label: z.string(),
  type: z.enum(['input', 'default', 'output']).default('default'),
  group: z.string().optional(),
  color: z.string().optional(),
  x: z.number().optional(),
  y: z.number().optional()
})

export const FlowEdge = z.object({
  id: z.string(),
  source: z.string(),
  target: z.string(),
  label: z.string().optional(),
  animated: z.boolean().optional()
})

export const FlowGraph = z.object({
  title: z.string(),
  nodes: z.array(FlowNode).min(1),
  edges: z.array(FlowEdge)
})

export type FlowGraphT = z.infer<typeof FlowGraph>


