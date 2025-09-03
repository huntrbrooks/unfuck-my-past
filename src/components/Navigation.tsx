'use client'

import { useAuth } from "@clerk/nextjs";
import { Button } from "@/components/ui/button";
import UserButton from "./UserButton";
import ThemeToggle from "./ThemeToggle";
import Link from "next/link";
import { Heart, Sparkles, TrendingUp, Calendar, Target, Clock } from "lucide-react";

interface NavigationProps {
  className?: string
}

export default function Navigation({ className = '' }: NavigationProps) {
  const { isSignedIn, isLoaded } = useAuth();

  return (
    <header className={`border-b border-border/50 bg-card/50 backdrop-blur-xl sticky top-0 z-50 transition-all duration-300 ${className}`}>
      <div className="max-w-7xl mx-auto px-6 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-8">
            <Link 
              href="/dashboard" 
              className="text-xl font-bold text-foreground hover:text-primary transition-all duration-300 cursor-pointer group"
            >
              <span className="bg-gradient-to-r from-primary via-accent to-secondary bg-clip-text text-transparent group-hover:from-primary/80 group-hover:via-accent/80 group-hover:to-secondary/80 transition-all duration-300">
                Unfuck Your Past
              </span>
            </Link>
            <nav className="hidden md:flex items-center gap-6">
              {isSignedIn && (
                <>
                  <Link 
                    href="/dashboard" 
                    className="nav-link text-sm font-medium flex items-center gap-2 group"
                  >
                    <Target className="h-4 w-4 transition-transform duration-300 group-hover:scale-110" />
                    Dashboard
                  </Link>
                  <Link 
                    href="/how-it-works" 
                    className="nav-link text-sm flex items-center gap-2 group"
                  >
                    <Sparkles className="h-4 w-4 transition-transform duration-300 group-hover:scale-110" />
                    How It Works
                  </Link>
                  <Link 
                    href="/onboarding" 
                    className="nav-link text-sm flex items-center gap-2 group"
                  >
                    <TrendingUp className="h-4 w-4 transition-transform duration-300 group-hover:scale-110" />
                    Continue Journey
                  </Link>
                  <Link 
                    href="/report" 
                    className="nav-link text-sm flex items-center gap-2 group"
                  >
                    <Heart className="h-4 w-4 transition-transform duration-300 group-hover:scale-110" />
                    My Report
                  </Link>
                  <Link 
                    href="/program" 
                    className="nav-link text-sm flex items-center gap-2 group"
                  >
                    <Calendar className="h-4 w-4 transition-transform duration-300 group-hover:scale-110" />
                    30-Day Program
                  </Link>
                  <Link 
                    href="/preferences" 
                    className="nav-link text-sm flex items-center gap-2 group"
                  >
                    <Clock className="h-4 w-4 transition-transform duration-300 group-hover:scale-110" />
                    Preferences
                  </Link>
                </>
              )}
            </nav>
          </div>
          
          <div className="flex items-center gap-4">
            <ThemeToggle />
            
            {isLoaded && (
              <>
                {isSignedIn ? (
                  <UserButton />
                ) : (
                  <div className="flex gap-2">
                    <Button 
                      variant="outline" 
                      asChild
                      size="sm"
                      className="hover:shadow-lg transition-all duration-300"
                    >
                      <Link href="/sign-in">Sign In</Link>
                    </Button>
                    <Button 
                      asChild
                      size="sm"
                      className="hover:shadow-lg hover:-translate-y-0.5 transition-all duration-300"
                    >
                      <Link href="/sign-up">Get Started</Link>
                    </Button>
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      </div>
    </header>
  )
}
