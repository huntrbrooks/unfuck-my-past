import React from 'react'

type Loop = {
  name: string
  trigger: string
  cycle: string[]
  impact: string
  breakPoint: {
    fromState: string
    action: string
  }
}

type Props = {
  loops: Loop[]
  palette?: {
    danger?: string
    neutral?: string
    action?: string
    accent?: string
  }
}

const defaultPalette = {
  danger: '#fb7185',   // rose-400
  neutral: '#94a3b8',  // slate-400
  action: '#22c55e',   // green-500
  accent: '#6366f1',   // indigo-500
}

function polar(cx: number, cy: number, r: number, angleDeg: number) {
  const a = (angleDeg * Math.PI) / 180
  return { x: cx + r * Math.cos(a), y: cy + r * Math.sin(a) }
}

const BehavioralLoops: React.FC<Props> = ({ loops, palette }) => {
  const colors = { ...defaultPalette, ...(palette || {}) }
  const vbWidth = 1000
  const vbHeight = 520
  const centers = [300, 700]
  const cy = 260
  const radius = 110

  // Only render first two loops side-by-side for compactness
  const toRender = loops.slice(0, 2)

  return (
    <div className="w-full">
      <svg viewBox={`0 0 ${vbWidth} ${vbHeight}`} className="w-full h-auto">
        <defs>
          <marker id="arrow" markerWidth="10" markerHeight="10" refX="10" refY="5" orient="auto">
            <path d="M0,0 L10,5 L0,10 z" fill={colors.neutral} />
          </marker>
          <marker id="arrow-danger" markerWidth="10" markerHeight="10" refX="10" refY="5" orient="auto">
            <path d="M0,0 L10,5 L0,10 z" fill={colors.danger} />
          </marker>
          <marker id="arrow-action" markerWidth="10" markerHeight="10" refX="10" refY="5" orient="auto">
            <path d="M0,0 L10,5 L0,10 z" fill={colors.action} />
          </marker>
          <filter id="shadow" x="-20%" y="-20%" width="140%" height="140%">
            <feDropShadow dx="0" dy="2" stdDeviation="2" floodOpacity="0.2" />
          </filter>
        </defs>

        {toRender.map((loop, idx) => {
          const cx = centers[idx] ?? centers[0]

          // Compute nodes on a circle
          const n = Math.max(3, loop.cycle.length)
          const angles = Array.from({ length: n }, (_, i) => -90 + (360 / n) * i)
          const points = angles.map(a => polar(cx, cy, radius, a))
          const triggerPos = { x: cx, y: cy - radius - 60 }

          // Breakpoint position (left for first loop, right for second)
          const bpPos = idx === 0 ? { x: cx - radius - 150, y: cy } : { x: cx + radius + 150, y: cy }
          const fromIndex = loop.cycle.findIndex(s => s.toLowerCase() === loop.breakPoint.fromState.toLowerCase())
          const fromPoint = points[fromIndex >= 0 ? fromIndex : 0]

          return (
            <g key={idx}>
              {/* Titles */}
              <text x={cx} y={40} textAnchor="middle" fontSize="22" fontWeight={700} fill={colors.accent}>
                {loop.name}
              </text>
              {/* Trigger */}
              <rect x={triggerPos.x - 90} y={triggerPos.y - 22} width={180} height={44} rx={10} fill="#fff" stroke={colors.neutral} filter="url(#shadow)" />
              <text x={triggerPos.x} y={triggerPos.y + 4} textAnchor="middle" fontSize="12" fill="#111">
                {`${loop.trigger} (Trigger)`}
              </text>

              {/* Cycle nodes */}
              {loop.cycle.map((label, i) => (
                <g key={label}>
                  <rect x={points[i].x - 90} y={points[i].y - 22} width={180} height={44} rx={10} fill="#fff" stroke={colors.neutral} filter="url(#shadow)" />
                  <text x={points[i].x} y={points[i].y + 4} textAnchor="middle" fontSize="12" fill="#111">{label}</text>
                </g>
              ))}

              {/* Cycle arrows */}
              {loop.cycle.map((_, i) => {
                const a = points[i]
                const b = points[(i + 1) % n]
                return (
                  <line key={`e-${i}`} x1={a.x} y1={a.y} x2={b.x} y2={b.y} stroke={colors.danger} strokeWidth={2} markerEnd="url(#arrow-danger)" />
                )
              })}
              {/* Trigger to first node */}
              <line x1={triggerPos.x} y1={triggerPos.y + 22} x2={points[0].x} y2={points[0].y - 22} stroke={colors.neutral} strokeWidth={2} markerEnd="url(#arrow)" />

              {/* Break point and arrow */}
              <rect x={bpPos.x - 120} y={bpPos.y - 32} width={240} height={64} rx={12} fill="#fff" stroke={colors.action} />
              <text x={bpPos.x} y={bpPos.y - 6} textAnchor="middle" fontSize="12" fill="#111" fontWeight={600}>Break Point</text>
              <text x={bpPos.x} y={bpPos.y + 12} textAnchor="middle" fontSize="12" fill="#111">{loop.breakPoint.action}</text>
              <line x1={fromPoint.x} y1={fromPoint.y} x2={bpPos.x - (idx === 0 ? 120 : -120)} y2={bpPos.y}
                stroke={colors.action} strokeWidth={2} strokeDasharray="6 6" markerEnd="url(#arrow-action)" />

              {/* Impact */}
              <text x={cx} y={vbHeight - 40} textAnchor="middle" fontSize="12" fill={colors.neutral} fontStyle="italic">
                {`Impact: ${loop.impact}`}
              </text>
            </g>
          )
        })}

        {/* Optional legend */}
        <g transform={`translate(${vbWidth / 2 - 100}, ${vbHeight - 20})`}>
          <line x1={0} y1={0} x2={30} y2={0} stroke={colors.danger} strokeWidth={2} />
          <text x={36} y={4} fontSize={11} fill="#334155">Cycle</text>
          <line x1={80} y1={0} x2={110} y2={0} stroke={colors.action} strokeWidth={2} strokeDasharray="6 6" />
          <text x={116} y={4} fontSize={11} fill="#334155">Break Point</text>
        </g>
      </svg>
    </div>
  )
}

export default BehavioralLoops


