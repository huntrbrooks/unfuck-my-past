"use client"

import { User } from "lucide-react"

export function WelcomeSection() {
  return (
    <div className="flex items-center gap-4 mb-8">
      <div className="w-12 h-12 bg-gray-200 dark:bg-gray-700 rounded-full flex items-center justify-center">
        <User className="h-6 w-6 text-gray-600 dark:text-gray-300" />
      </div>
      <div>
        <h1 className="text-2xl font-bold text-[#8bc34a] dark:text-[#ccff00] drop-shadow-[0_0_8px_rgba(139,195,74,0.6)] dark:drop-shadow-[0_0_8px_rgba(204,255,0,0.6)] [text-shadow:_1px_1px_2px_rgb(0_0_0_/_40%)]">
          Welcome back, Gerard!
        </h1>
        <p className="text-gray-600 dark:text-gray-400">Ready to continue your healing journey?</p>
      </div>
    </div>
  )
}
