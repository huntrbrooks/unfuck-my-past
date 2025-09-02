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
    <header className={`border-b border-border bg-card/50 backdrop-blur-sm sticky top-0 z-50 ${className}`}>
      <div className="max-w-7xl mx-auto px-6 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-8">
            <Link href="/dashboard" className="text-xl font-bold text-foreground hover:text-primary transition-colors cursor-pointer">
              Unfuck Your Past
            </Link>
            <nav className="hidden md:flex items-center gap-6">
              {isSignedIn && (
                <>
                  <Link href="/dashboard" className="text-sm text-primary font-medium">
                    Dashboard
                  </Link>
                  <Link href="/how-it-works" className="text-sm text-muted-foreground hover:text-primary transition-colors">
                    How It Works
                  </Link>
                  <Link href="/onboarding" className="text-sm text-muted-foreground hover:text-primary transition-colors">
                    Continue Journey
                  </Link>
                  <Link href="/report" className="text-sm text-muted-foreground hover:text-primary transition-colors">
                    My Report
                  </Link>
                  <Link href="/program" className="text-sm text-muted-foreground hover:text-primary transition-colors">
                    30-Day Program
                  </Link>
                  <Link href="/preferences" className="text-sm text-muted-foreground hover:text-primary transition-colors">
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
                    >
                      <Link href="/sign-in">
                        Sign In
                      </Link>
                    </Button>
                    <Button 
                      variant="default" 
                      asChild
                      size="sm"
                    >
                      <Link href="/sign-up">
                        Get Started
                      </Link>
                    </Button>
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      </div>
    </header>
  );
}
