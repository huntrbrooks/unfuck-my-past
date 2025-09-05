"use client"

import type * as React from "react"
import { motion } from "framer-motion"
import { TrendingUp, Activity, Heart } from "lucide-react"

interface MetricCard {
  icon: React.ReactNode
  label: string
  value: string | number
  badge: {
    text: string
    color: string
  }
  iconBg: string
  iconColor: string
}

const metrics: MetricCard[] = [
  {
    icon: <TrendingUp className="h-3 w-3" />,
    label: "Day Streak",
    value: 7,
    badge: { text: "Active", color: "text-black dark:text-white font-bold" },
    iconBg: "bg-[#FF6600]/20",
    iconColor: "text-[#FF6600]",
  },
  {
    icon: <Activity className="h-3 w-3" />,
    label: "Sessions Completed",
    value: 1,
    badge: { text: "Total", color: "text-black dark:text-white font-bold" },
    iconBg: "bg-[#00ffff]/20",
    iconColor: "text-[#00ffff]",
  },
  {
    icon: <Heart className="h-3 w-3" />,
    label: "Mood Rating",
    value: 7,
    badge: { text: "Average", color: "text-black dark:text-white font-bold" },
    iconBg: "bg-[#9d00ff]/20",
    iconColor: "text-[#9d00ff]",
  },
]

const cardVariants = {
  initial: {
    scale: 1,
    rotateY: 0,
    boxShadow: "0 1px 3px 0 rgb(0 0 0 / 0.1), 0 1px 2px -1px rgb(0 0 0 / 0.1)",
  },
  hover: {
    scale: 1.05,
    rotateY: 10,
    boxShadow: "0 20px 25px -5px rgb(0 0 0 / 0.1), 0 10px 10px -5px rgb(0 0 0 / 0.04)",
    transition: {
      type: "spring",
      stiffness: 300,
      damping: 20,
    },
  },
}

const iconVariants = {
  initial: {
    rotate: 0,
    scale: 1,
    filter: "brightness(1)",
  },
  hover: {
    rotate: 15,
    scale: 1.1,
    filter: "brightness(1.3) drop-shadow(0 0 8px currentColor)",
    transition: {
      type: "spring",
      stiffness: 400,
      damping: 15,
    },
  },
}

const glowVariants = {
  initial: { opacity: 0 },
  hover: {
    opacity: 1,
    transition: {
      duration: 0.3,
    },
  },
}

export function DashboardMetrics() {
  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-2 w-full max-w-md">
      {metrics.map((metric, index) => (
        <motion.div
          key={metric.label}
          className="relative group cursor-pointer"
          variants={cardVariants}
          initial="initial"
          whileHover="hover"
          style={{ perspective: "1000px" }}
        >
          <motion.div
            className="absolute inset-0 rounded-lg opacity-0 blur-sm"
            variants={glowVariants}
            style={{
              background: `linear-gradient(45deg, ${metric.iconColor.replace("text-", "").replace("[", "").replace("]", "")}, transparent)`,
              transform: "scale(1.1)",
            }}
          />

          <div className="relative aspect-square p-2 rounded-lg border border-[#3d3d3d] dark:border-[#3d3d3d] bg-white dark:bg-black shadow-sm hover:shadow-md transition-all duration-300 hover:border-opacity-50 hover:bg-opacity-90">
            <div className="absolute top-2 left-2">
              <div
                className={`w-6 h-6 rounded-lg flex items-center justify-center ${metric.iconBg} transition-all duration-300 group-hover:shadow-lg`}
              >
                <motion.div variants={iconVariants} className={metric.iconColor}>
                  {metric.icon}
                </motion.div>
              </div>
            </div>

            <div className="absolute top-2 right-2">
              <span
                className={`text-[10px] ${metric.badge.color} transition-all duration-300 group-hover:scale-105`}
                style={{
                  filter: `drop-shadow(0 0 4px ${metric.iconColor.replace("text-", "").replace("[", "").replace("]", "")})`,
                }}
              >
                {metric.badge.text}
              </span>
            </div>

            <div className="absolute inset-0 flex items-center justify-center">
              <span
                className="text-6xl font-bold text-black dark:text-white transition-all duration-300 group-hover:text-shadow-lg group-hover:scale-105 font-[family-name:var(--font-fredoka)]"
                style={{
                  filter: `drop-shadow(0 0 8px ${metric.iconColor.replace("text-", "").replace("[", "").replace("]", "")})`,
                }}
              >
                {metric.value}
              </span>
            </div>

            <div className="absolute bottom-2 left-2 right-2">
              <p
                className="text-xs text-gray-700 dark:text-gray-300 font-medium text-center transition-all duration-300 group-hover:text-opacity-80"
                style={{
                  filter: `drop-shadow(0 0 3px ${metric.iconColor.replace("text-", "").replace("[", "").replace("]", "")})`,
                }}
              >
                {metric.label}
              </p>
            </div>
          </div>
        </motion.div>
      ))}
    </div>
  )
}
