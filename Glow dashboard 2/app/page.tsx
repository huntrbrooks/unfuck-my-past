import { MenuBar } from "@/components/menu-bar"
import { DashboardMetrics } from "@/components/dashboard-metrics"
import { WelcomeSection } from "@/components/welcome-section"
import { HealingProgram } from "@/components/healing-program"
import { DiagnosticsSection } from "@/components/diagnostics-section"
import { MoodJournalSection } from "@/components/mood-journal-section"
import { AchievementsExport } from "@/components/achievements-export"

export default function Page() {
  return (
    <div className="min-h-screen bg-background flex flex-col">
      <header className="w-full p-4 border-b border-border/20 flex justify-center">
        <MenuBar />
      </header>

      <main className="flex-1 p-6 max-w-7xl mx-auto w-full">
        <WelcomeSection />

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
          <div className="lg:col-span-2">
            <DashboardMetrics />
          </div>
          <div>
            <DiagnosticsSection />
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
          <div className="lg:col-span-2">
            <HealingProgram />
          </div>
        </div>

        <div className="mb-8">
          <MoodJournalSection />
        </div>

        <AchievementsExport />
      </main>
    </div>
  )
}
