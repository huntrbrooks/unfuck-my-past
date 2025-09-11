"use client"

import React, { useEffect, useMemo, useState } from 'react'
import ReactFlow, { Background, Controls, MiniMap, useNodesState, useEdgesState } from 'reactflow'
import 'reactflow/dist/style.css'
import type { FlowGraphT } from '@/lib/flowSchema'

type Props = {
  seed: any
  height?: number
}

export default function AIFlow({ seed, height = 520 }: Props) {
  const [graph, setGraph] = useState<FlowGraphT | null>(null)
  const [error, setError] = useState<string>("")

  useEffect(() => {
    const run = async () => {
      setError("")
      try {
        const res = await fetch('/api/flow', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(seed)
        })
        const data = await res.json()
        if (!res.ok) throw new Error(data?.error ?? 'API error')
        setGraph(data)
      } catch (e: any) {
        setError(e.message)
      }
    }
    run()
  }, [seed])

  const initialNodes = useMemo(() => {
    if (!graph) return []
    return graph.nodes.map(n => ({
      id: n.id,
      data: { label: n.label },
      // Force non-output nodes to avoid default library labels like "Output"
      type: (n as any).type === 'output' ? 'default' : ((n as any).type ?? 'default'),
      position: { x: (n as any).x ?? 0, y: (n as any).y ?? 0 },
      style: {
        borderRadius: 14,
        padding: 10,
        border: '1px solid rgba(0,0,0,0.08)',
        boxShadow: '0 8px 24px rgba(0,0,0,0.08)',
        background: (n as any).color ?? '#ffffff',
        color: '#0f172a',
        fontSize: 12,
        fontWeight: 600,
        lineHeight: 1.2,
        textAlign: 'center' as const,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center'
      }
    }))
  }, [graph])

  const initialEdges = useMemo(() => {
    if (!graph) return []
    return graph.edges.map(e => ({
      id: e.id,
      source: e.source,
      target: e.target,
      label: (e as any).label,
      animated: (e as any).animated ?? false,
      style: { strokeWidth: 2 },
      labelStyle: { fontSize: 11, fontWeight: 600 }
    }))
  }, [graph])

  const [nodes, setNodes, onNodesChange] = useNodesState(initialNodes)
  const [edges, setEdges, onEdgesChange] = useEdgesState(initialEdges)

  useEffect(() => {
    setNodes(initialNodes)
    setEdges(initialEdges)
  }, [initialNodes, initialEdges, setNodes, setEdges])

  if (error) {
    return <div className="text-red-600 text-sm">Flow failed: {error}</div>
  }
  if (!graph) {
    return <div className="text-slate-500 text-sm">Generating flow...</div>
  }

  return (
    <div style={{ height, borderRadius: 16, overflow: 'hidden', border: '1px solid #e5e7eb' }}>
      <div className="px-3 py-2 text-sm font-semibold">{graph.title}</div>
      <ReactFlow
        nodes={nodes}
        edges={edges}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        fitView
      >
        <MiniMap pannable zoomable />
        <Controls />
        <Background gap={16} />
      </ReactFlow>
    </div>
  )
}


