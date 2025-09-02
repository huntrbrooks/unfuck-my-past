'use client'

import React, { useEffect, useState } from 'react'
import { Button } from '@/components/ui/button'
import { useTheme } from './ThemeProvider'
import { Moon, Sun } from 'lucide-react'

interface ThemeToggleProps {
  size?: 'sm' | 'md' | 'lg'
  variant?: 'outline' | 'ghost'
  className?: string
}

export default function ThemeToggle({ 
  size = 'sm', 
  variant = 'ghost',
  className = ''
}: ThemeToggleProps) {
  const [mounted, setMounted] = useState(false)
  const { theme, toggleTheme } = useTheme()

  useEffect(() => {
    setMounted(true)
  }, [])

  // Prevent hydration mismatch
  if (!mounted) {
    return <div className="w-9 h-9" />
  }

  const getIcon = () => {
    return theme === 'light' ? <Moon className="h-4 w-4" /> : <Sun className="h-4 w-4" />
  }

  const getLabel = () => {
    return theme === 'light' ? 'Dark Mode' : 'Light Mode'
  }

  // Map size to Button size
  const buttonSize = size === 'md' ? 'default' : size

  return (
    <Button
      variant={variant}
      size={buttonSize as any}
      onClick={toggleTheme}
      className={className}
      title={getLabel()}
    >
      {getIcon()}
      <span className="sr-only">{getLabel()}</span>
    </Button>
  )
}
