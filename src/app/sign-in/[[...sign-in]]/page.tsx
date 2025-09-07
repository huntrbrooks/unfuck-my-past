import { SignIn } from "@clerk/nextjs";
import Image from "next/image";

export default function SignInPage() {
  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <div className="w-full max-w-2xl mx-auto flex flex-col items-center">
        <div className="text-center mb-8 w-full flex flex-col items-center">
          <div className="relative mb-6 flex items-center justify-center gap-6 w-full">
            <div className="hidden sm:block animate-float">
              <Image src="/Line_art-01.png" alt="line art left" width={90} height={180} className="drop-shadow-[0_0_16px_rgba(255,165,0,0.75)]" />
            </div>
            <h1 className="responsive-heading mb-4 text-[var(--neon-cta,#ccff00)] [text-shadow:0_0_24px_rgba(204,255,0,0.85),0_0_48px_rgba(204,255,0,0.65),1px_1px_0_rgba(0,0,0,0.55),-1px_-1px_0_rgba(0,0,0,0.55)]">Welcome Back</h1>
            <div className="hidden sm:block animate-float">
              <Image src="/Line_art2-03.png" alt="line art right" width={90} height={180} className="drop-shadow-[0_0_16px_rgba(0,229,255,0.75)]" />
            </div>
          </div>
          <p className="responsive-body text-muted-foreground">
            Continue your healing journey where you left off
          </p>
        </div>
        <div className="w-full max-w-md mx-auto flex justify-center">
        <SignIn 
          appearance={{
            elements: {
              formButtonPrimary: 
                "bg-primary hover:bg-primary/90 text-primary-foreground font-medium py-3 px-6 rounded-xl w-full transition-all duration-200 hover:scale-105",
                card: "backdrop-blur-sm rounded-2xl border border-border/50 shadow-2xl p-8 mx-auto bg-white/95 text-neutral-900 dark:bg-neutral-900/90 dark:text-neutral-100",
                formFieldInput: "bg-white text-neutral-900 border border-neutral-300 shadow-sm dark:bg-neutral-800 dark:text-neutral-100 dark:border-neutral-700",
                formFieldLabel: "text-neutral-700 dark:text-neutral-300",
                dividerLine: "bg-neutral-200 dark:bg-neutral-700",
                dividerText: "text-neutral-500 dark:text-neutral-400",
                formFieldHintText: "text-neutral-500 dark:text-neutral-400",
                footer: "text-neutral-600 dark:text-neutral-300",
                headerTitle: "hidden",
                headerSubtitle: "hidden",
              }
            }}
          />
        </div>
      </div>
    </div>
  );
}
