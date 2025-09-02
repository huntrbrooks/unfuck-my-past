import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"
import { Badge } from "@/components/ui/badge"
import { Heart, Sparkles, TrendingUp, Calendar, Target, Clock } from "lucide-react"

export default function HealingDashboard() {
  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b border-border bg-card/50 backdrop-blur-sm sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-8">
              <h1 className="text-xl font-bold text-foreground">Unfuck Your Past</h1>
              <nav className="hidden md:flex items-center gap-6">
                <a href="#" className="text-sm text-muted-foreground hover:text-primary transition-colors">
                  How It Works
                </a>
                <a href="#" className="text-sm text-primary font-medium">
                  Dashboard
                </a>
                <a href="#" className="text-sm text-muted-foreground hover:text-primary transition-colors">
                  30-Day Program
                </a>
                <a href="#" className="text-sm text-muted-foreground hover:text-primary transition-colors">
                  Continue Journey
                </a>
                <a href="#" className="text-sm text-muted-foreground hover:text-primary transition-colors">
                  Diagnostic
                </a>
              </nav>
            </div>
            <div className="flex items-center gap-4">
              <Button variant="ghost" size="sm">
                Light Mode
              </Button>
              <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
                <span className="text-sm font-medium text-primary">U</span>
              </div>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-6 py-8">
        {/* Hero Section */}
        <div className="text-center mb-12">
          <h2 className="text-4xl font-bold text-foreground mb-4 text-balance">Your 30-Day Healing Journey</h2>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto text-balance">
            Transform your life through structured self-discovery and healing
          </p>
        </div>

        {/* Main Program Card */}
        <Card className="mb-8 border-primary/20 bg-gradient-to-br from-card to-primary/5">
          <CardContent className="p-8 text-center">
            <div className="flex items-center justify-center gap-2 mb-4">
              <Heart className="w-5 h-5 text-primary" />
              <h3 className="text-xl font-semibold text-foreground">Your Personalized Healing Program</h3>
            </div>
            <p className="text-muted-foreground mb-6 max-w-2xl mx-auto">
              Based on your diagnostic responses, we'll create a unique 30-day program tailored specifically to your
              trauma patterns and healing goals.
            </p>
            <Button size="lg" className="gap-2">
              <Sparkles className="w-4 h-4" />
              Generate My Program
            </Button>
          </CardContent>
        </Card>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
          {/* Progress Overview */}
          <Card className="lg:col-span-2">
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle className="flex items-center gap-2">
                <TrendingUp className="w-5 h-5 text-primary" />
                Progress Overview
              </CardTitle>
              <Badge variant="secondary" className="bg-primary/10 text-primary">
                40% Complete
              </Badge>
            </CardHeader>
            <CardContent>
              <div className="mb-6">
                <Progress value={40} className="h-2" />
              </div>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="text-center">
                  <div className="text-2xl font-bold text-primary mb-1">12</div>
                  <div className="text-sm text-muted-foreground">Days Completed</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-accent mb-1">12</div>
                  <div className="text-sm text-muted-foreground">Day Streak</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-secondary mb-1">13</div>
                  <div className="text-sm text-muted-foreground">Current Day</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-muted-foreground mb-1">18</div>
                  <div className="text-sm text-muted-foreground">Days Remaining</div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Quick Stats */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Target className="w-5 h-5 text-primary" />
                Quick Stats
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <div className="text-sm text-muted-foreground mb-1">Current Streak</div>
                <div className="text-xl font-semibold text-foreground">12 days</div>
              </div>
              <div>
                <div className="text-sm text-muted-foreground mb-1">Completion Rate</div>
                <div className="text-xl font-semibold text-primary">40%</div>
              </div>
              <div>
                <div className="text-sm text-muted-foreground mb-1">Estimated Completion</div>
                <div className="text-xl font-semibold text-accent">2 days</div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Bottom Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Current Day */}
          <Card className="lg:col-span-2 border-primary/20">
            <CardContent className="p-6">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <Badge variant="outline" className="mb-2">
                    Day 13
                  </Badge>
                  <h3 className="text-lg font-semibold text-foreground">Navigating Grief: Unearthing the Guilt</h3>
                </div>
                <Button variant="outline" size="sm">
                  Start Session
                </Button>
              </div>
              <Progress value={0} className="h-1" />
            </CardContent>
          </Card>

          {/* Today's Focus */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Calendar className="w-5 h-5 text-primary" />
                Today's Focus
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <div className="text-sm text-muted-foreground">Category:</div>
                <div className="font-medium text-foreground">Processing</div>
                <div className="text-sm text-muted-foreground mt-4">Estimated time:</div>
                <div className="flex items-center gap-1 text-foreground">
                  <Clock className="w-4 h-4" />
                  <span className="font-medium">15-20 minutes</span>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  )
}
