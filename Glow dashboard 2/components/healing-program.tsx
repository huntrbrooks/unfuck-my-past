"use client"

import { Calendar, ArrowRight } from "lucide-react"
import { Button } from "@/components/ui/button"

export function HealingProgram() {
  return (
    <div className="bg-white dark:bg-black border border-gray-200 dark:border-gray-800 rounded-xl p-6 shadow-sm">
      <div className="flex items-start gap-4 mb-4">
        <div className="w-10 h-10 bg-gray-100 dark:bg-gray-800 rounded-lg flex items-center justify-center">
          <Calendar className="h-5 w-5 text-gray-600 dark:text-gray-400" />
        </div>
        <div className="flex-1">
          <h3 className="text-lg font-semibold text-[#8bc34a] dark:text-[#ccff00] drop-shadow-[0_0_6px_rgba(139,195,74,0.5)] dark:drop-shadow-[0_0_6px_rgba(204,255,0,0.5)] [text-shadow:_1px_1px_2px_rgb(0_0_0_/_40%)] mb-1">
            30-Day Healing Program
          </h3>
          <p className="text-gray-600 dark:text-gray-400 text-sm">Continue your personalized healing journey</p>
        </div>
      </div>

      <div className="flex justify-between items-center mb-4">
        <span className="text-sm text-gray-600 dark:text-gray-400">Progress</span>
        <span className="text-sm font-medium text-black dark:text-white">Day 7 of 30</span>
      </div>

      <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2 mb-6">
        <div className="bg-[#8bc34a] dark:bg-[#ccff00] h-2 rounded-full w-[23%]"></div>
      </div>

      <Button className="w-full bg-[#8bc34a] hover:bg-[#7cb342] dark:bg-[#ccff00] dark:hover:bg-[#b8e600] text-white dark:text-black font-medium rounded-lg py-3 transition-all duration-200 hover:shadow-lg hover:shadow-[#8bc34a]/20 dark:hover:shadow-[#ccff00]/20">
        Continue Program
        <ArrowRight className="ml-2 h-4 w-4" />
      </Button>
    </div>
  )
}
