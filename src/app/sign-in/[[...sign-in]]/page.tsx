import { SignIn } from "@clerk/nextjs";
import { Heart, Sparkles, Target, Brain } from "lucide-react";

export default function SignInPage() {
  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <div className="max-w-md w-full">
        <div className="text-center mb-8">
          {/* Floating Elements */}
          <div className="relative mb-6">
            <div className="absolute -top-4 -left-4 p-3 rounded-full bg-primary/10 animate-float">
              <Heart className="h-6 w-6 text-primary" />
            </div>
            <div className="absolute -top-2 -right-4 p-3 rounded-full bg-accent/10 animate-float-delayed">
              <Sparkles className="h-6 w-6 text-accent-foreground" />
            </div>
            <div className="absolute -bottom-4 left-1/4 p-3 rounded-full bg-primary/10 animate-float-slow">
              <Target className="h-6 w-6 text-primary" />
            </div>
            <div className="absolute -bottom-2 right-1/4 p-3 rounded-full bg-accent/10 animate-float-delayed-slow">
              <Brain className="h-6 w-6 text-accent-foreground" />
            </div>
          </div>
          
          <h1 className="responsive-heading text-foreground mb-4">Welcome Back</h1>
          <p className="responsive-body text-muted-foreground">
            Continue your healing journey where you left off
          </p>
        </div>
        <SignIn 
          appearance={{
            elements: {
              formButtonPrimary: 
                "bg-primary hover:bg-primary/90 text-primary-foreground font-medium py-3 px-6 rounded-xl w-full transition-all duration-200 hover:scale-105",
                card: "bg-background/80 backdrop-blur-sm rounded-2xl border border-border/50 shadow-2xl p-8",
                headerTitle: "hidden",
                headerSubtitle: "hidden",
              }
            }}
          />
      </div>
    </div>
  );
}
