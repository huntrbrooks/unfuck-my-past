'use client'

import { useState } from 'react'
import { useAuth } from '@clerk/nextjs'
import { Button } from '@/components/ui/button'
import UserButton from './UserButton'
import ThemeToggle from './ThemeToggle'
import Link from 'next/link'
import { Menu, X, Target, Sparkles, TrendingUp, Heart, Calendar, Clock } from 'lucide-react'

export default function MobileMenu() {
  const [isOpen, setIsOpen] = useState(false)
  const { isSignedIn, isLoaded } = useAuth()

  const toggleMenu = () => setIsOpen(!isOpen)

  return (
    <div className="md:hidden">
      {/* Mobile Menu Button */}
      <Button
        variant="ghost"
        size="icon"
        onClick={toggleMenu}
        className="relative z-50 hover:bg-accent/50 transition-all duration-300"
        aria-label="Toggle mobile menu"
      >
        {isOpen ? (
          <X className="h-6 w-6 transition-all duration-300 rotate-90" />
        ) : (
          <Menu className="h-6 w-6 transition-all duration-300" />
        )}
      </Button>

      {/* Mobile Menu Overlay */}
      {isOpen && (
        <div className="fixed inset-0 z-40 bg-background/80 backdrop-blur-xl">
          <div className="fixed inset-y-0 right-0 w-full max-w-sm bg-card/95 backdrop-blur-xl border-l border-border/50 shadow-2xl">
            <div className="flex flex-col h-full">
              {/* Header */}
              <div className="flex items-center justify-between p-6 border-b border-border/50">
                <Link 
                  href="/dashboard" 
                  className="text-xl font-bold text-foreground hover:text-primary transition-all duration-300 cursor-pointer group"
                  onClick={() => setIsOpen(false)}
                >
                  <span className="bg-gradient-to-r from-primary via-accent to-secondary bg-clip-text text-transparent group-hover:from-primary/80 group-hover:via-accent/80 group-hover:to-secondary/80 transition-all duration-300">
                    Unfuck Your Past
                  </span>
                </Link>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={toggleMenu}
                  className="hover:bg-accent/50 transition-all duration-300"
                >
                  <X className="h-6 w-6" />
                </Button>
              </div>

              {/* Navigation Links */}
              <nav className="flex-1 px-6 py-8 space-y-6">
                {isSignedIn && (
                  <>
                    <Link
                      href="/dashboard"
                      className="flex items-center gap-3 text-lg font-medium text-foreground hover:text-primary transition-all duration-300 p-3 rounded-xl hover:bg-accent/50 group"
                      onClick={() => setIsOpen(false)}
                    >
                      <Target className="h-5 w-5 transition-transform duration-300 group-hover:scale-110" />
                      Dashboard
                    </Link>
                    <Link
                      href="/how-it-works"
                      className="flex items-center gap-3 text-lg font-medium text-muted-foreground hover:text-primary transition-all duration-300 p-3 rounded-xl hover:bg-accent/50 group"
                      onClick={() => setIsOpen(false)}
                    >
                      <Sparkles className="h-5 w-5 transition-transform duration-300 group-hover:scale-110" />
                      How It Works
                    </Link>
                    <Link
                      href="/onboarding"
                      className="flex items-center gap-3 text-lg font-medium text-muted-foreground hover:text-primary transition-all duration-300 p-3 rounded-xl hover:bg-accent/50 group"
                      onClick={() => setIsOpen(false)}
                    >
                      <TrendingUp className="h-5 w-5 transition-transform duration-300 group-hover:scale-110" />
                      Continue Journey
                    </Link>
                    <Link
                      href="/report"
                      className="flex items-center gap-3 text-lg font-medium text-muted-foreground hover:text-primary transition-all duration-300 p-3 rounded-xl hover:bg-accent/50 group"
                      onClick={() => setIsOpen(false)}
                    >
                      <Heart className="h-5 w-5 transition-transform duration-300 group-hover:scale-110" />
                      My Report
                    </Link>
                    <Link
                      href="/program"
                      className="flex items-center gap-3 text-lg font-medium text-muted-foreground hover:text-primary transition-all duration-300 p-3 rounded-xl hover:bg-accent/50 group"
                      onClick={() => setIsOpen(false)}
                    >
                      <Calendar className="h-5 w-5 transition-transform duration-300 group-hover:scale-110" />
                      30-Day Program
                    </Link>
                    <Link
                      href="/preferences"
                      className="flex items-center gap-3 text-lg font-medium text-muted-foreground hover:text-primary transition-all duration-300 p-3 rounded-xl hover:bg-accent/50 group"
                      onClick={() => setIsOpen(false)}
                    >
                      <Clock className="h-5 w-5 transition-transform duration-300 group-hover:scale-110" />
                      Preferences
                    </Link>
                  </>
                )}
              </nav>

              {/* Footer */}
              <div className="p-6 border-t border-border/50 space-y-4">
                <div className="flex items-center justify-center">
                  <ThemeToggle />
                </div>
                
                {isLoaded && !isSignedIn && (
                  <div className="flex flex-col gap-3">
                    <Button 
                      variant="outline" 
                      asChild
                      className="w-full hover:shadow-lg transition-all duration-300"
                      onClick={() => setIsOpen(false)}
                    >
                      <Link href="/sign-in">Sign In</Link>
                    </Button>
                    <Button 
                      asChild
                      className="w-full hover:shadow-lg hover:-translate-y-0.5 transition-all duration-300"
                      onClick={() => setIsOpen(false)}
                    >
                      <Link href="/sign-up">Get Started</Link>
                    </Button>
                  </div>
                )}
                
                {isSignedIn && (
                  <div className="flex justify-center">
                    <UserButton />
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
