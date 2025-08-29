import React from 'react'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import ThemeToggle from '../ThemeToggle'
import { ThemeProvider } from '../ThemeProvider'

// Mock the useTheme hook
jest.mock('../ThemeProvider', () => ({
  ...jest.requireActual('../ThemeProvider'),
  useTheme: jest.fn(),
}))

const mockUseTheme = require('../ThemeProvider').useTheme

const renderWithTheme = (component: React.ReactElement) => {
  return render(
    <ThemeProvider>
      {component}
    </ThemeProvider>
  )
}

describe('ThemeToggle', () => {

  it('renders with light theme by default', async () => {
    mockUseTheme.mockReturnValue({
      theme: 'light',
      toggleTheme: jest.fn(),
    })

    render(<ThemeToggle />)
    
    await waitFor(() => {
      expect(screen.getByText('Dark Mode')).toBeInTheDocument()
      expect(screen.getByText('🌙')).toBeInTheDocument()
    })
  })

  it('renders with dark theme', async () => {
    mockUseTheme.mockReturnValue({
      theme: 'dark',
      toggleTheme: jest.fn(),
    })

    render(<ThemeToggle />)
    
    await waitFor(() => {
      expect(screen.getByText('Light Mode')).toBeInTheDocument()
      expect(screen.getByText('☀️')).toBeInTheDocument()
    })
  })

  it('calls toggleTheme when clicked', async () => {
    const mockToggleTheme = jest.fn()
    mockUseTheme.mockReturnValue({
      theme: 'light',
      toggleTheme: mockToggleTheme,
    })

    render(<ThemeToggle />)
    
    await waitFor(() => {
      const button = screen.getByRole('button')
      fireEvent.click(button)
      expect(mockToggleTheme).toHaveBeenCalledTimes(1)
    })
  })

  it('applies correct variant classes', async () => {
    mockUseTheme.mockReturnValue({
      theme: 'light',
      toggleTheme: jest.fn(),
    })

    const { rerender } = render(<ThemeToggle variant="outline" />)
    
    await waitFor(() => {
      expect(screen.getByRole('button')).toHaveClass('btn-outline-dark')
    })

    rerender(<ThemeToggle variant="ghost" />)
    
    await waitFor(() => {
      expect(screen.getByRole('button')).toHaveClass('btn-link')
    })
  })

  it('applies custom className', async () => {
    mockUseTheme.mockReturnValue({
      theme: 'light',
      toggleTheme: jest.fn(),
    })

    render(<ThemeToggle className="custom-class" />)
    
    await waitFor(() => {
      expect(screen.getByRole('button')).toHaveClass('custom-class')
    })
  })

  it('has correct title attribute', async () => {
    mockUseTheme.mockReturnValue({
      theme: 'light',
      toggleTheme: jest.fn(),
    })

    render(<ThemeToggle />)
    
    await waitFor(() => {
      expect(screen.getByRole('button')).toHaveAttribute('title', 'Dark Mode')
    })
  })

  it('hides theme label on mobile', async () => {
    mockUseTheme.mockReturnValue({
      theme: 'light',
      toggleTheme: jest.fn(),
    })

    render(<ThemeToggle />)
    
    await waitFor(() => {
      const label = screen.getByText('Dark Mode')
      expect(label).toHaveClass('theme-label')
    })
  })
})
