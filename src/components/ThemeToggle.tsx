'use client'

import { useTheme } from '@/components/ThemeProvider'
import { Button } from '@/components/ui/button'
import { Sun, Moon } from 'lucide-react'
import { useEffect, useState } from 'react'

export default function ThemeToggle() {
  const { theme, setTheme } = useTheme()
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  if (!mounted) {
    return (
      <Button variant="ghost" size="icon" className="w-10 h-10 rounded-xl">
        <div className="w-4 h-4 bg-muted-foreground/20 rounded animate-pulse" />
      </Button>
    )
  }

  return (
    <div className="relative group">
      <Button
        variant="ghost"
        size="icon"
        onClick={() => setTheme(theme === 'light' ? 'dark' : 'light')}
        className="w-10 h-10 rounded-xl hover:bg-accent/50 transition-all duration-300 group-hover:scale-105"
        aria-label="Toggle theme"
      >
        <Sun className="h-4 w-4 rotate-0 scale-100 transition-all duration-300 dark:-rotate-90 dark:scale-0" />
        <Moon className="absolute h-4 w-4 rotate-90 scale-0 transition-all duration-300 dark:rotate-0 dark:scale-100" />
        <span className="sr-only">Toggle theme</span>
      </Button>
      
      {/* Tooltip */}
      <div className="absolute bottom-full right-0 mb-2 px-2 py-1 text-xs text-muted-foreground bg-popover border border-border rounded-md opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none whitespace-nowrap">
        {theme === 'light' ? 'Switch to dark' : 'Switch to light'}
      </div>
    </div>
  )
}
