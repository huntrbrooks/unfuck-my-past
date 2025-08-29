import React from 'react'
import { render, screen } from '@testing-library/react'
import LoadingSpinner from '../LoadingSpinner'

describe('LoadingSpinner', () => {
  it('renders with default props', () => {
    render(<LoadingSpinner />)
    
    expect(screen.getByText('Loading...')).toBeInTheDocument()
    expect(screen.getByRole('status')).toBeInTheDocument()
  })

  it('renders with custom text', () => {
    render(<LoadingSpinner text="Custom loading text" />)
    
    expect(screen.getByText('Custom loading text')).toBeInTheDocument()
  })

  it('renders without text when text prop is empty', () => {
    render(<LoadingSpinner text="" />)
    
    expect(screen.queryByText('Loading...')).not.toBeInTheDocument()
    expect(screen.getByRole('status')).toBeInTheDocument()
  })

  it('applies custom className', () => {
    render(<LoadingSpinner className="custom-class" />)
    
    const container = screen.getByText('Loading...').parentElement
    expect(container).toHaveClass('custom-class')
  })

  it('renders with different variants', () => {
    const { rerender } = render(<LoadingSpinner variant="primary" />)
    expect(screen.getByRole('status')).toHaveClass('spinner-border', 'text-primary')

    rerender(<LoadingSpinner variant="secondary" />)
    expect(screen.getByRole('status')).toHaveClass('spinner-border', 'text-secondary')

    rerender(<LoadingSpinner variant="success" />)
    expect(screen.getByRole('status')).toHaveClass('spinner-border', 'text-success')
  })

  it('renders with different sizes', () => {
    const { rerender } = render(<LoadingSpinner size="sm" />)
    expect(screen.getByRole('status')).toHaveClass('spinner-border-sm')

    rerender(<LoadingSpinner size="md" />)
    expect(screen.getByRole('status')).not.toHaveClass('spinner-border-sm')

    rerender(<LoadingSpinner size="lg" />)
    expect(screen.getByRole('status')).not.toHaveClass('spinner-border-sm')
  })
})
