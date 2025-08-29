'use client'

import React, { useEffect, useState } from 'react'
import { Button } from 'react-bootstrap'
import { useTheme } from './ThemeProvider'

interface ThemeToggleProps {
  size?: 'sm' | 'md' | 'lg'
  variant?: 'outline' | 'ghost'
  className?: string
}

export default function ThemeToggle({ 
  size = 'sm', 
  variant = 'outline',
  className = ''
}: ThemeToggleProps) {
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  // Prevent hydration mismatch
  if (!mounted) {
    return <div style={{ width: '60px', height: '32px' }}></div>
  }

  const { theme, toggleTheme } = useTheme()

  const getIcon = () => {
    return theme === 'light' ? '🌙' : '☀️'
  }

  const getLabel = () => {
    return theme === 'light' ? 'Dark Mode' : 'Light Mode'
  }

  // Map size to Bootstrap Button size
  const buttonSize = size === 'md' ? undefined : size

  return (
    <Button
      variant={variant === 'ghost' ? 'link' : `outline-${theme === 'light' ? 'dark' : 'light'}`}
      size={buttonSize}
      onClick={toggleTheme}
      className={`theme-toggle ${className}`}
      title={getLabel()}
    >
      <span className="theme-icon">{getIcon()}</span>
      <span className="theme-label ms-1">{getLabel()}</span>
    </Button>
  )
}
