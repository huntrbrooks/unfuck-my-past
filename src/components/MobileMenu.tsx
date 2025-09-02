'use client'

import React, { useState } from 'react'
import { useAuth } from '@clerk/nextjs'
import { Button } from '@/components/ui/button'
import UserButton from './UserButton'
import ThemeToggle from './ThemeToggle'
import Link from 'next/link'
import { Menu, X } from 'lucide-react'

interface MobileMenuProps {
  className?: string
}

export default function MobileMenu({ className = '' }: MobileMenuProps) {
  const [show, setShow] = useState(false)
  const { isSignedIn, isLoaded } = useAuth()

  const handleClose = () => setShow(false)
  const handleShow = () => setShow(true)

  return (
    <>
      <header className={`border-b border-border bg-card/50 backdrop-blur-sm sticky top-0 z-50 ${className}`}>
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <Link href="/dashboard" className="text-xl font-bold text-foreground hover:text-primary transition-colors cursor-pointer">
              Unfuck Your Past
            </Link>
            
            <div className="flex items-center gap-4">
              <ThemeToggle />
              <Button
                variant="outline"
                size="sm"
                onClick={handleShow}
                className="md:hidden"
              >
                <Menu className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>
      </header>

      {/* Mobile Menu Overlay */}
      {show && (
        <div className="fixed inset-0 z-50 bg-black/50 md:hidden" onClick={handleClose} />
      )}

      {/* Mobile Menu Sidebar */}
      <div className={`fixed top-0 right-0 z-50 h-full w-80 bg-background border-l border-border transform transition-transform duration-300 ease-in-out md:hidden ${show ? 'translate-x-0' : 'translate-x-full'}`}>
        <div className="flex items-center justify-between p-6 border-b border-border">
          <h2 className="text-lg font-semibold">Menu</h2>
          <Button
            variant="ghost"
            size="sm"
            onClick={handleClose}
          >
            <X className="h-4 w-4" />
          </Button>
        </div>
        
        <div className="p-6">
          <nav className="flex flex-col space-y-4">
            <Link 
              href="/how-it-works" 
              onClick={handleClose}
              className="text-sm text-muted-foreground hover:text-primary transition-colors py-2"
            >
              How It Works
            </Link>
            
            {isSignedIn && (
              <>
                <Link 
                  href="/dashboard" 
                  onClick={handleClose}
                  className="text-sm text-primary font-medium py-2"
                >
                  Dashboard
                </Link>
                <Link 
                  href="/how-it-works" 
                  onClick={handleClose}
                  className="text-sm text-muted-foreground hover:text-primary transition-colors py-2"
                >
                  How It Works
                </Link>
                <Link 
                  href="/onboarding" 
                  onClick={handleClose}
                  className="text-sm text-muted-foreground hover:text-primary transition-colors py-2"
                >
                  Continue Journey
                </Link>
                <Link 
                  href="/report" 
                  onClick={handleClose}
                  className="text-sm text-muted-foreground hover:text-primary transition-colors py-2"
                >
                  My Report
                </Link>
                <Link 
                  href="/program" 
                  onClick={handleClose}
                  className="text-sm text-muted-foreground hover:text-primary transition-colors py-2"
                >
                  30-Day Program
                </Link>
                <Link 
                  href="/preferences" 
                  onClick={handleClose}
                  className="text-sm text-muted-foreground hover:text-primary transition-colors py-2"
                >
                  Preferences
                </Link>
              </>
            )}
          </nav>
          
          <hr className="my-6" />
          
          {isLoaded && (
            <div className="space-y-4">
              {isSignedIn ? (
                <div className="text-center">
                  <UserButton />
                </div>
              ) : (
                <>
                  <Button 
                    variant="outline" 
                    asChild
                    size="lg"
                    className="w-full"
                    onClick={handleClose}
                  >
                    <Link href="/sign-in">
                      Sign In
                    </Link>
                  </Button>
                  <Button 
                    variant="default" 
                    asChild
                    size="lg"
                    className="w-full"
                    onClick={handleClose}
                  >
                    <Link href="/sign-up">
                      Get Started
                    </Link>
                  </Button>
                </>
              )}
            </div>
          )}
        </div>
      </div>
    </>
  )
}
