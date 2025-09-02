'use client'

import { UserButton as ClerkUserButton } from "@clerk/nextjs";

export default function UserButton() {
  return (
    <div className="inline-block">
      <ClerkUserButton 
        appearance={{
          elements: {
            userButtonAvatarBox: "rounded-full",
            userButtonTrigger: "w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-primary font-medium"
          }
        }}
      />
    </div>
  );
}
