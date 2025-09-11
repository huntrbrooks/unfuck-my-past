"use client";
import React from 'react'
import { ResponsiveContainer, RadarChart, Radar, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Legend, Tooltip } from 'recharts'
import type { TooltipProps } from 'recharts'

interface Props {
  data: Array<{ metric: string; score: number }>
  color: string
}

export default function ScoresRadarImpl({ data, color }: Props) {
  const CustomTooltip = ({ active, payload, label }: TooltipProps<number, string>) => {
    if (!active || !payload || !payload.length) return null
    const val = payload[0]?.value as number | undefined
    return (
      <div className="px-2 py-1 bg-transparent text-xs font-bold text-foreground">
        <div>{label}</div>
        {typeof val === 'number' ? <div>{val.toFixed(1)}/10</div> : null}
      </div>
    )
  }
  return (
    <div className="w-full h-80">
      <ResponsiveContainer>
        <RadarChart data={data}>
          <PolarGrid />
          <PolarAngleAxis dataKey="metric" />
          <PolarRadiusAxis angle={30} domain={[0, 10]} />
          <Radar name="You" dataKey="score" fill={color} fillOpacity={0.35} stroke={color} />
          <Legend />
          <Tooltip content={<CustomTooltip />} wrapperStyle={{ background: 'transparent', border: 'none', boxShadow: 'none' }} />
        </RadarChart>
      </ResponsiveContainer>
    </div>
  )
}


