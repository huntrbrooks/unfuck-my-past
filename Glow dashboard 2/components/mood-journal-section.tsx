"use client"

import { BarChart3, BookOpen, ArrowRight } from "lucide-react"
import { Button } from "@/components/ui/button"

export function MoodJournalSection() {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
      {/* Daily Mood Tracker */}
      <div className="bg-white dark:bg-black border border-gray-200 dark:border-gray-800 rounded-xl p-6 shadow-sm">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-8 h-8 bg-orange-100 dark:bg-orange-900/30 rounded-lg flex items-center justify-center">
            <BarChart3 className="h-4 w-4 text-orange-600 dark:text-orange-400" />
          </div>
          <div>
            <h3 className="font-semibold text-black dark:text-white">Daily Mood Tracker</h3>
            <p className="text-sm text-gray-600 dark:text-gray-400">Track your emotional journey</p>
          </div>
        </div>

        <div className="space-y-3">
          <div className="flex justify-between items-center">
            <span className="text-sm text-gray-600 dark:text-gray-400">Today's Mood</span>
            <div className="flex items-center gap-2">
              <span className="text-lg">😐</span>
              <span className="font-medium text-black dark:text-white">6/10</span>
            </div>
          </div>

          <div className="text-center py-2">
            <span className="text-lg font-medium text-black dark:text-white">Neutral</span>
            <p className="text-xs text-gray-500 dark:text-gray-400">Last updated: 03:31 AM</p>
          </div>

          <Button variant="outline" className="w-full border-gray-300 dark:border-gray-600 bg-transparent">
            Update Mood
            <ArrowRight className="ml-2 h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Daily Journal */}
      <div className="bg-white dark:bg-black border border-gray-200 dark:border-gray-800 rounded-xl p-6 shadow-sm">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-8 h-8 bg-green-100 dark:bg-green-900/30 rounded-lg flex items-center justify-center">
            <BookOpen className="h-4 w-4 text-green-600 dark:text-green-400" />
          </div>
          <div>
            <h3 className="font-semibold text-black dark:text-white">Daily Journal</h3>
            <p className="text-sm text-gray-600 dark:text-gray-400">Reflect and grow through writing</p>
          </div>
        </div>

        <div className="space-y-3">
          <div className="flex justify-between items-center">
            <span className="text-sm text-gray-600 dark:text-gray-400">Today's Entry</span>
            <span className="text-sm px-2 py-1 bg-gray-100 dark:bg-gray-800 rounded text-gray-600 dark:text-gray-400">
              Not started
            </span>
          </div>

          <p className="text-sm text-gray-600 dark:text-gray-400 py-2">Start your reflection for today</p>

          <Button className="w-full bg-gray-900 dark:bg-white text-white dark:text-black hover:bg-gray-800 dark:hover:bg-gray-100">
            Write Today's Entry
            <ArrowRight className="ml-2 h-4 w-4" />
          </Button>
        </div>
      </div>
    </div>
  )
}
