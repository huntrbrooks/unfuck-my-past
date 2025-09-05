"use client"

import { Trophy, Download, FileText, Database, FileSpreadsheet } from "lucide-react"
import { Button } from "@/components/ui/button"

export function AchievementsExport() {
  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      {/* Recent Achievements */}
      <div className="bg-white dark:bg-black border border-gray-200 dark:border-gray-800 rounded-xl p-6 shadow-sm">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-8 h-8 bg-purple-100 dark:bg-purple-900/30 rounded-lg flex items-center justify-center">
            <Trophy className="h-4 w-4 text-purple-600 dark:text-purple-400" />
          </div>
          <div>
            <h3 className="font-semibold text-black dark:text-white">Recent Achievements</h3>
            <p className="text-sm text-gray-600 dark:text-gray-400">Celebrate your progress</p>
          </div>
        </div>

        <div className="space-y-3">
          <div className="flex items-center gap-3 p-3 bg-green-50 dark:bg-green-950/20 rounded-lg">
            <div className="w-6 h-6 bg-green-500 rounded-full flex items-center justify-center">
              <span className="text-white text-xs">✓</span>
            </div>
            <div className="flex-1">
              <span className="text-sm font-medium text-black dark:text-white">Completed 7 consecutive days</span>
              <span className="ml-2 px-2 py-1 bg-green-500 text-white text-xs rounded-full">New!</span>
            </div>
          </div>

          <div className="flex items-center gap-3 p-3 bg-green-50 dark:bg-green-950/20 rounded-lg">
            <div className="w-6 h-6 bg-green-500 rounded-full flex items-center justify-center">
              <span className="text-white text-xs">✓</span>
            </div>
            <span className="text-sm font-medium text-black dark:text-white">First journal entry completed</span>
          </div>

          <div className="flex items-center gap-3 p-3 bg-green-50 dark:bg-green-950/20 rounded-lg">
            <div className="w-6 h-6 bg-green-500 rounded-full flex items-center justify-center">
              <span className="text-white text-xs">✓</span>
            </div>
            <span className="text-sm font-medium text-black dark:text-white">Mood tracking streak: 5 days</span>
          </div>
        </div>
      </div>

      {/* Export Your Data */}
      <div className="bg-white dark:bg-black border border-gray-200 dark:border-gray-800 rounded-xl p-6 shadow-sm">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-8 h-8 bg-green-100 dark:bg-green-900/30 rounded-lg flex items-center justify-center">
            <Download className="h-4 w-4 text-green-600 dark:text-green-400" />
          </div>
          <div>
            <h3 className="font-semibold text-black dark:text-white">Export Your Data</h3>
            <p className="text-sm text-gray-600 dark:text-gray-400">Download your progress</p>
          </div>
        </div>

        <div className="space-y-4">
          <div>
            <h4 className="font-medium text-black dark:text-white mb-3">General Data Export</h4>
            <div className="grid grid-cols-3 gap-2">
              <Button variant="outline" size="sm" className="border-gray-300 dark:border-gray-600 bg-transparent">
                <Database className="h-3 w-3 mr-1" />
                JSON
              </Button>
              <Button variant="outline" size="sm" className="border-gray-300 dark:border-gray-600 bg-transparent">
                <FileSpreadsheet className="h-3 w-3 mr-1" />
                CSV
              </Button>
              <Button variant="outline" size="sm" className="border-gray-300 dark:border-gray-600 bg-transparent">
                <FileText className="h-3 w-3 mr-1" />
                PDF
              </Button>
            </div>
          </div>

          <div>
            <h4 className="font-medium text-black dark:text-white mb-3">30-Day Program (TXT)</h4>
            <div className="grid grid-cols-2 gap-2">
              <Button variant="outline" size="sm" className="border-gray-300 dark:border-gray-600 bg-transparent">
                <FileText className="h-3 w-3 mr-1" />
                Overview
              </Button>
              <Button variant="outline" size="sm" className="border-gray-300 dark:border-gray-600 bg-transparent">
                <FileText className="h-3 w-3 mr-1" />
                Daily Content
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
