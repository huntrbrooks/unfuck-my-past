"use client";
import React from 'react'
import { ResponsiveContainer, BarChart, Bar, CartesianGrid, XAxis, YAxis, Tooltip, Cell, LabelList } from 'recharts'
import type { TooltipProps } from 'recharts'

export const AVOIDANCE_NEON_COLORS = ['#00e5ff', '#ff1aff', '#ff9900', '#a855f7', '#3b82f6', '#14b8a6', '#ef4444'] as const

interface Props {
  data: Array<{ name: string; severity: number }>
  color: string
}

export default function AvoidanceBarImpl({ data, color }: Props) {
  const neonColors = AVOIDANCE_NEON_COLORS as readonly string[]

  const CustomTooltip = ({ active, payload, label }: TooltipProps<number, string>) => {
    if (!active || !payload || !payload.length) return null
    const val = payload[0]?.value as number | undefined
    return (
      <div className="px-2 py-1 bg-transparent text-xs font-bold text-foreground">
        <div>{label}</div>
        {typeof val === 'number' ? <div>Severity {val}/5</div> : null}
      </div>
    )
  }
  return (
    <div className="w-full h-80">
      <ResponsiveContainer>
        <BarChart data={data} barCategoryGap="66%">
          <defs>
            {neonColors.map((c, i) => (
              <filter key={i} id={`glow-${i}`} x="-50%" y="-50%" width="200%" height="200%" colorInterpolationFilters="sRGB">
                <feDropShadow dx="0" dy="0" stdDeviation="2.5" floodColor={c} floodOpacity="0.7" />
                <feDropShadow dx="0" dy="0" stdDeviation="5.5" floodColor={c} floodOpacity="0.35" />
              </filter>
            ))}
          </defs>
          <CartesianGrid strokeDasharray="3 3" />
          {/* show the labels below each bar for clarity */}
          <XAxis dataKey="name" tick={{ fill: 'var(--foreground)' }} tickMargin={12} interval={0} angle={0} height={48} />
          <YAxis domain={[0, 5]} />
          <Tooltip content={<CustomTooltip />} wrapperStyle={{ background: 'transparent', border: 'none', boxShadow: 'none' }} />
          <Bar dataKey="severity" radius={[6, 6, 0, 0]}>
            {data.map((_, i) => (
              <Cell key={`cell-${i}`} fill={neonColors[i % neonColors.length]} filter={`url(#glow-${i % neonColors.length})`} />
            ))}
            {/* add value labels on bars */}
            <LabelList dataKey="severity" position="top" formatter={(v: any) => `${v}/5`} style={{ fill: 'var(--foreground)', fontWeight: 700, fontSize: 12 }} />
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  )
}


