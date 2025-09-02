# 🚀 New Onboarding Package Integration Guide

## 🎯 **What You Just Got:**

A **config-driven, multi-select onboarding flow** that's much better than your current one!

## 📁 **Package Structure:**
```
docs/ONBOARDING_SPEC.md          # Product copy & mapping
src/onboarding/flow.json         # Single source of truth config
src/onboarding/types.ts          # TypeScript types
src/onboarding/Onboarding.tsx    # Drop-in React component
src/onboarding/index.ts          # Barrel export
scripts/commit_push.sh           # Helper script
src/app/onboarding-test/page.tsx # Test page
```

## 🔄 **How to Replace Your Current Onboarding:**

### **Option 1: Quick Test (Recommended First)**
1. **Visit**: `http://localhost:3000/onboarding-test`
2. **See the new flow** in action
3. **Compare** with your current `/onboarding` page

### **Option 2: Full Replacement**
Replace your current `src/app/onboarding/page.tsx` with:

```tsx
'use client'

import React from 'react'
import { useRouter } from 'next/navigation'
import { useUser } from '@clerk/nextjs'
import { Onboarding } from '@/onboarding'

export default function OnboardingPage() {
  const { user, isLoaded } = useUser()
  const router = useRouter()

  // Redirect if not signed in
  React.useEffect(() => {
    if (isLoaded && !user) {
      router.push('/sign-in')
    }
  }, [isLoaded, user, router])

  const handleComplete = async (payload: Record<string, any>) => {
    try {
      // Send to your existing API
      const response = await fetch('/api/onboarding', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      })
      
      if (response.ok) {
        router.push('/diagnostic')
      }
    } catch (error) {
      console.error('Onboarding error:', error)
    }
  }

  const handleChange = (partial: Record<string, any>) => {
    // Optional: Save progress or analytics
    console.log('Progress:', partial)
  }

  if (!isLoaded || !user) return null

  return (
    <div className="min-h-screen bg-gray-50">
      <Onboarding 
        onComplete={handleComplete}
        onChange={handleChange}
      />
    </div>
  )
}
```

## 🎨 **Key Improvements Over Current Onboarding:**

| Feature | Old Onboarding | New Onboarding |
|---------|----------------|----------------|
| **Multi-select** | ❌ Limited | ✅ Full support |
| **Helper text** | ❌ Missing | ✅ Every step |
| **Accessibility** | ❌ Basic | ✅ ARIA labels |
| **Config-driven** | ❌ Hardcoded | ✅ flow.json |
| **User experience** | ❌ Complex | ✅ Clean & simple |

## ⚙️ **Customizing the Flow:**

### **Change Copy Without Code:**
Edit `src/onboarding/flow.json`:

```json
{
  "id": "goals",
  "title": "Your Healing Goals",  // ← Change this
  "helper": "What do you want to heal?",  // ← Change this
  "fields": [
    {
      "id": "primaryGoals",
      "label": "What are you seeking?",  // ← Change this
      "options": ["Healing", "Growth", "Peace"]  // ← Add/remove options
    }
  ]
}
```

### **Add New Steps:**
```json
{
  "id": "safety",
  "title": "Safety Preferences",
  "helper": "How can we support you safely?",
  "fields": [
    {
      "id": "triggers",
      "label": "Any topics to avoid?",
      "multi": true,
      "options": ["Violence", "Abuse", "Self-harm"],
      "type": "choice"
    }
  ]
}
```

## 🧪 **Testing:**

1. **Local test**: `npm run dev` → `/onboarding-test`
2. **Build test**: `npm run build` ✅
3. **Deploy**: Already pushed to GitHub, Vercel will auto-deploy!

## 🚀 **Next Steps:**

1. **Test the new flow** at `/onboarding-test`
2. **Compare** with current `/onboarding`
3. **Decide** if you want to replace the current one
4. **Customize** the flow.json if needed
5. **Deploy** - Vercel is already building!

## 💡 **Pro Tips:**

- **Multi-select fields** automatically become arrays
- **Single-select fields** become strings
- **Helper text** appears above complex steps
- **Progress bar** shows completion status
- **Accessibility** built-in with ARIA labels

Your new onboarding is ready to use! 🎉
