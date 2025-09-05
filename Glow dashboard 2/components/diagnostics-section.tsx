"use client"

import { Sparkles, Download, ChevronDown } from "lucide-react"
import { Button } from "@/components/ui/button"

export function DiagnosticsSection() {
  return (
    <div className="space-y-6">
      {/* Diagnostics Header */}
      <div className="bg-white dark:bg-black border border-gray-200 dark:border-gray-800 rounded-xl p-6 shadow-sm">
        <div className="flex items-center gap-3 mb-2">
          <div className="w-8 h-8 bg-blue-100 dark:bg-blue-900/30 rounded-lg flex items-center justify-center">
            <Sparkles className="h-4 w-4 text-blue-600 dark:text-blue-400" />
          </div>
          <h3 className="font-semibold text-black dark:text-white">Diagnostics</h3>
        </div>
        <p className="text-gray-600 dark:text-gray-400 text-sm mb-4">View your insights</p>

        <div className="flex justify-between items-center mb-4">
          <h4 className="font-medium text-black dark:text-white">Diagnostic Report</h4>
          <Button variant="outline" size="sm" className="border-gray-300 dark:border-gray-600 bg-transparent">
            <Download className="h-4 w-4 mr-2" />
            Export Report
          </Button>
        </div>

        <div className="space-y-3">
          <div className="flex justify-between items-center py-2 border-b border-gray-100 dark:border-gray-800">
            <span className="text-black dark:text-white">Question 1</span>
            <div className="flex items-center gap-2">
              <span className="text-sm text-gray-600 dark:text-gray-400">9/5/2025</span>
              <ChevronDown className="h-4 w-4 text-gray-400" />
            </div>
          </div>
          <div className="flex justify-between items-center py-2 border-b border-gray-100 dark:border-gray-800">
            <span className="text-black dark:text-white">Question 2</span>
            <div className="flex items-center gap-2">
              <span className="text-sm text-gray-600 dark:text-gray-400">9/5/2025</span>
              <ChevronDown className="h-4 w-4 text-gray-400" />
            </div>
          </div>
          <div className="flex justify-between items-center py-2">
            <span className="text-black dark:text-white">Question 3</span>
            <div className="flex items-center gap-2">
              <span className="text-sm text-gray-600 dark:text-gray-400">9/5/2025</span>
              <ChevronDown className="h-4 w-4 text-gray-400" />
            </div>
          </div>
        </div>
      </div>

      {/* Report Summary */}
      <div className="bg-blue-50 dark:bg-blue-950/20 border border-blue-200 dark:border-blue-800 rounded-xl p-4">
        <div className="flex items-center gap-2 mb-2">
          <Sparkles className="h-4 w-4 text-blue-600 dark:text-blue-400" />
          <h4 className="font-medium text-black dark:text-white">Report Summary</h4>
        </div>
        <p className="text-sm text-gray-600 dark:text-gray-400">
          This report contains 3 diagnostic responses with AI-generated insights. Each response has been analyzed to
          provide personalized recommendations for your healing journey.
        </p>
      </div>
    </div>
  )
}
