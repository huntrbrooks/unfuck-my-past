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

  // Build a local fallback flow so the UI still renders if the API request fails (e.g., Safari "Load failed")
  const buildLocalFallbackFromSeed = (rawSeed: any): FlowGraphT => {
    const palette = ['#22c55e', '#06b6d4', '#f59e0b', '#ef4444', '#6366f1']
    const topic = String(rawSeed?.topic || 'Healing Roadmap')
    const stages: string[] = Array.isArray(rawSeed?.stages) && rawSeed.stages.length
      ? rawSeed.stages.map((s: any) => String(s))
      : ['Today', 'This Week', 'This Month', '3 Months', '1 Year']

    // Forward order first, then reverse so the end appears at the top (matching the server)
    const forwardNodes = stages.map((label, i) => ({
      id: `n${i + 1}`,
      label: label.slice(0, 24),
      type: i === 0 ? 'input' : 'default',
      color: palette[i % palette.length]
    }))
    const reversed = [...forwardNodes].reverse()
    const edges = reversed.slice(0, reversed.length - 1).map((_, i) => ({
      id: `e${i + 1}`,
      source: reversed[i].id,
      target: reversed[i + 1].id
    }))
    return { title: topic, nodes: reversed as any, edges }
  }

  useEffect(() => {
    const run = async () => {
      setError("")
      try {
        // Add a timeout and disable caching to avoid stuck requests in some browsers
        const controller = new AbortController()
        const timeoutId = setTimeout(() => controller.abort(), 10000)
        const res = await fetch('/api/flow', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(seed),
          cache: 'no-store',
          signal: controller.signal
        })
        clearTimeout(timeoutId)

        // Safely parse JSON (in case of an HTML error page)
        const text = await res.text()
        let data: any = null
        try { data = text ? JSON.parse(text) : null } catch { /* ignore */ }

        if (!res.ok || !data || !Array.isArray(data?.nodes)) {
          // Fallback to local graph if the API failed or returned unexpected data
          const fallback = buildLocalFallbackFromSeed(seed)
          setGraph(fallback)
          return
        }
        setGraph(data as FlowGraphT)
      } catch (e: any) {
        // Network error (e.g., Safari "Load failed"): render local fallback instead of showing an error
        try {
          const fallback = buildLocalFallbackFromSeed(seed)
          setGraph(fallback)
          setError('')
        } catch {
          setError(e?.message || 'Failed to load flow')
        }
      }
    }
    run()
  }, [seed])

  const initialNodes = useMemo(() => {
    if (!graph) return []
    const verticalGap = 96
    // Reverse order so the final step appears at the top and the start last
    const ordered = [...graph.nodes].reverse()
    return ordered.map((n, idx) => ({
      id: n.id,
      data: { label: n.label },
      // Force non-output nodes to avoid default library labels like "Output"
      type: (n as any).type === 'output' ? 'default' : ((n as any).type ?? 'default'),
      // Explicitly lay out nodes vertically to enforce the reversed order
      position: { x: 0, y: idx * verticalGap },
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

  // Only show an error if we also failed to construct a fallback graph
  if (error && !graph) {
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


