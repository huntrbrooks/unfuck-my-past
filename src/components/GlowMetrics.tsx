'use client'

import React from 'react'
import { motion, type Variants, type Transition } from 'framer-motion'
import { TrendingUp, Activity, Heart, Star } from 'lucide-react'

interface MetricCard {
  icon: React.ReactNode
  label: string
  value: string | number
  badge: { text: string; color: string }
}

const springTransition: Transition = { type: 'spring', stiffness: 300, damping: 20 }

const cardVariants: Variants = {
  initial: { scale: 1, rotateY: 0, boxShadow: '0 1px 3px 0 rgb(0 0 0 / 0.1), 0 1px 2px -1px rgb(0 0 0 / 0.1)' },
  hover: { scale: 1.05, rotateY: 10, boxShadow: '0 20px 25px -5px rgb(0 0 0 / 0.1), 0 10px 10px -5px rgb(0 0 0 / 0.04)', transition: springTransition }
}

const iconVariants: Variants = {
  initial: { rotate: 0, scale: 1 },
  hover: { rotate: 15, scale: 1.1, transition: { ...springTransition, stiffness: 400, damping: 15 } }
}

const glowVariants: Variants = { initial: { opacity: 0 }, hover: { opacity: 1, transition: { duration: 0.3 } } }

const NEON_COLORS = ['#ccff00', '#00e5ff', '#ff1aff', '#ff6600'] as const

function pickNeonColor(key: string): string {
  let hash = 0
  for (let i = 0; i < key.length; i++) hash = (hash << 5) - hash + key.charCodeAt(i)
  const idx = Math.abs(hash) % NEON_COLORS.length
  return NEON_COLORS[idx]
}

export default function GlowMetrics({
  streak,
  sessions,
  moodAvg
}: {
  streak: number | string
  sessions: number | string
  moodAvg: number | string
}) {
  // Additional derived metrics
  const weekly = typeof sessions === 'number' ? Math.min(7, Number(sessions)) : sessions
  const consistency = typeof streak === 'number' ? Math.min(100, Math.round((Number(streak) / 30) * 100)) : streak
  const monthCount = typeof sessions === 'number' ? Math.min(30, Number(sessions)) : sessions

  const metrics: MetricCard[] = [
    { icon: <TrendingUp className="h-4 w-4" />, label: 'Day Streak', value: streak, badge: { text: 'Active', color: 'text-black dark:text-white font-bold' } },
    { icon: <Activity className="h-4 w-4" />, label: 'Sessions', value: sessions, badge: { text: 'Total', color: 'text-black dark:text-white font-bold' } },
    { icon: <Heart className="h-4 w-4" />, label: 'Mood', value: moodAvg, badge: { text: 'Average', color: 'text-black dark:text-white font-bold' } },
    { icon: <Activity className="h-4 w-4" />, label: 'This Week', value: weekly, badge: { text: '7d', color: 'text-black dark:text-white font-bold' } },
    { icon: <TrendingUp className="h-4 w-4" />, label: 'Consistency', value: typeof consistency === 'number' ? `${consistency}%` : consistency, badge: { text: '30d', color: 'text-black dark:text-white font-bold' } },
    { icon: <Star className="h-4 w-4" />, label: 'This Month', value: monthCount, badge: { text: '30d', color: 'text-black dark:text-white font-bold' } }
  ]

  return (
    <div className="grid grid-cols-3 md:grid-cols-6 gap-3">
      {metrics.map((metric) => {
        const neon = pickNeonColor(metric.label)
        return (
          <motion.div key={metric.label} className="relative group cursor-pointer rounded-2xl border border-[#3d3d3d] dark:border-[#3d3d3d] bg-background/40 shadow-sm p-3 aspect-square flex flex-col items-center justify-center text-center" variants={cardVariants} initial="initial" whileHover="hover" style={{ perspective: '1000px' }}>
            <motion.div className="absolute inset-0 rounded-2xl opacity-0 blur-md" variants={glowVariants} style={{ background: `radial-gradient(80% 80% at 50% 50%, ${neon}22, transparent)` }} />
            <div className="w-12 h-12 rounded-xl flex items-center justify-center mb-2">
              <motion.div variants={iconVariants} className="text-black dark:text-white" style={{ filter: `drop-shadow(0 0 10px ${neon})` }}>
                {metric.icon}
              </motion.div>
            </div>
            <div className="text-5xl edgy-font font-bold text-foreground leading-none mb-1">{metric.value}</div>
            <div className="text-xs text-muted-foreground tracking-wide uppercase">{metric.label}</div>
            <span className={`absolute top-2 right-2 text-[10px] ${metric.badge.color}`}>{metric.badge.text}</span>
          </motion.div>
        )
      })}
    </div>
  )
}


