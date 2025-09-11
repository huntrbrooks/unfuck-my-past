'use client'

import React from 'react'
import { SignIn } from '@clerk/nextjs'

export default function SignInPage() {
  return (
    <div className="min-h-screen-dvh flex items-center justify-center bg-background px-4 py-12">
      <div className="w-full max-w-md">
        <SignIn />
      </div>
    </div>
  )
}
