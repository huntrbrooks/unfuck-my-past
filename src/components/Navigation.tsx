'use client'

import { useAuth } from "@clerk/nextjs";
import React from "react";
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
  const [showResults, setShowResults] = React.useState(false);
  const [showReportTab, setShowReportTab] = React.useState(false);
  const [showDashboard, setShowDashboard] = React.useState(false);
  const [showProgram, setShowProgram] = React.useState(false);
  const [showContinue, setShowContinue] = React.useState(false);
  const [continueHref, setContinueHref] = React.useState('/onboarding');
  const [showPreferences, setShowPreferences] = React.useState(false);

  React.useEffect(() => {
    let cancelled = false;
    const checkCompletion = async () => {
      if (!isSignedIn) {
        setShowResults(false);
        setShowContinue(false);
        setContinueHref('/onboarding');
        setShowDashboard(false);
        setShowProgram(false);
        setShowPreferences(false);
        return;
      }
      try {
        const [resResponses, resQuestions, resPurchases] = await Promise.all([
          fetch('/api/diagnostic/responses'),
          fetch('/api/diagnostic/questions'),
          fetch('/api/payments/user-purchases')
        ]);
        if (!resResponses.ok || !resQuestions.ok) return;
        const responsesData = await resResponses.json();
        const questionsData = await resQuestions.json();
        const purchases = resPurchases.ok ? await resPurchases.json() : [];
        const responsesCount = (responsesData.responses?.length ?? 0) as number;
        const questionsCount = (questionsData.questions?.length ?? 0) as number;
        const completedDiag = questionsCount > 0 && responsesCount >= questionsCount;
        const hasDiagnostic = Array.isArray(purchases) && purchases.some((p: { product: string; active: boolean }) => p.product === 'diagnostic' && p.active);
        const hasProgram = Array.isArray(purchases) && purchases.some((p: { product: string; active: boolean }) => p.product === 'program' && p.active);

        if (!cancelled) {
          setShowResults(completedDiag);
          setShowPreferences(completedDiag);
          // Continue Journey tab visibility after onboarding completion (we infer onboarding via any responses existing)
          const anyResponses = (responsesCount ?? 0) > 0;
          setShowContinue(anyResponses);
          // Dynamic target for Continue Journey
          if (!anyResponses) setContinueHref('/onboarding');
          else if (anyResponses && !completedDiag) setContinueHref('/diagnostic');
          else if (completedDiag && !hasDiagnostic) setContinueHref('/report');
          else if (hasDiagnostic && !hasProgram) setContinueHref('/program');
          else setContinueHref('/dashboard');

          // Dashboard shows after any paywall paid
          setShowDashboard(hasDiagnostic || hasProgram);
          // Program tab shows only after program purchased
          setShowProgram(hasProgram);
        }
      } catch {
        if (!cancelled) setShowResults(false);
      }
    };
    checkCompletion();
    return () => { cancelled = true };
  }, [isSignedIn]);

  React.useEffect(() => {
    let cancelled = false;
    const checkReport = async () => {
      if (!isSignedIn) {
        setShowReportTab(false);
        return;
      }
      try {
        const res = await fetch('/api/diagnostic/comprehensive-report', { method: 'GET' });
        if (!cancelled) setShowReportTab(res.ok);
      } catch {
        if (!cancelled) setShowReportTab(false);
      }
    };
    checkReport();
    return () => { cancelled = true };
  }, [isSignedIn]);

  return (
    <header className={`border-b border-border/50 bg-card/50 backdrop-blur-xl sticky top-0 z-50 transition-all duration-300 ${className}`}>
      <div className="max-w-7xl mx-auto px-6 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-8">
            <Link 
              href="/" 
              className="text-xl font-bold transition-all duration-300 cursor-pointer group"
            >
              <span className="neon-heading">
                Unfuck My Past
              </span>
            </Link>
            <nav className="hidden md:flex items-center gap-6">
              {isSignedIn && (
                <>
                  {showDashboard && (
                    <Link 
                      href="/dashboard" 
                      className="nav-link text-sm font-medium flex items-center gap-2 group"
                    >
                      <Target className="h-4 w-4 transition-transform duration-300 group-hover:scale-110" />
                      Dashboard
                    </Link>
                  )}
                  <Link 
                    href="/how-it-works" 
                    className="nav-link text-sm flex items-center gap-2 group"
                  >
                    <Sparkles className="h-4 w-4 transition-transform duration-300 group-hover:scale-110" />
                    How It Works
                  </Link>
                  {showContinue && (
                    <Link 
                      href={continueHref} 
                      className="nav-link text-sm flex items-center gap-2 group"
                    >
                      <TrendingUp className="h-4 w-4 transition-transform duration-300 group-hover:scale-110" />
                      Continue Journey
                    </Link>
                  )}
                  {showReportTab && (
                    <Link 
                      href="/report" 
                      className="nav-link text-sm flex items-center gap-2 group"
                    >
                      <Heart className="h-4 w-4 transition-transform duration-300 group-hover:scale-110" />
                      My Report
                    </Link>
                  )}
                  {showProgram && (
                    <Link 
                      href="/program" 
                      className="nav-link text-sm flex items-center gap-2 group"
                    >
                      <Calendar className="h-4 w-4 transition-transform duration-300 group-hover:scale-110" />
                      30-Day Program
                    </Link>
                  )}
                  {showPreferences && (
                    <Link 
                      href="/preferences" 
                      className="nav-link text-sm flex items-center gap-2 group"
                    >
                      <Clock className="h-4 w-4 transition-transform duration-300 group-hover:scale-110" />
                      Preferences
                    </Link>
                  )}
                  {showResults && (
                    <Link 
                      href="/diagnostic/results" 
                      className="nav-link text-sm flex items-center gap-2 group"
                    >
                      <Sparkles className="h-4 w-4 transition-transform duration-300 group-hover:scale-110" />
                      Results
                    </Link>
                  )}
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
