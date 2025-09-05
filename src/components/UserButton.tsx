'use client'

import { useUser, useClerk } from '@clerk/nextjs'
import { Button } from '@/components/ui/button'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuLabel, 
  DropdownMenuSeparator, 
  DropdownMenuTrigger 
} from '@/components/ui/dropdown-menu'
import { 
  Settings, 
  LogOut, 
  Heart, 
  Calendar,
  Target
} from 'lucide-react'
import Link from 'next/link'

export default function UserButton() {
  const { user } = useUser()
  const { signOut } = useClerk()

  if (!user) return null

  const initials = user.firstName && user.lastName 
    ? `${user.firstName[0]}${user.lastName[0]}`
    : user.firstName?.[0] || user.emailAddresses[0]?.emailAddress[0]?.toUpperCase() || 'U'

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button 
          variant="ghost" 
          className="relative h-10 w-10 rounded-full hover:bg-accent/50 transition-all duration-300 group"
        >
          <Avatar className="h-10 w-10 ring-2 ring-transparent group-hover:ring-primary/20 transition-all duration-300">
            <AvatarImage src={user.imageUrl} alt={user.fullName || 'User'} />
            <AvatarFallback className="bg-gradient-to-br from-primary/20 to-accent/20 text-primary font-semibold">
              {initials}
            </AvatarFallback>
          </Avatar>
          <span className="sr-only">Open user menu</span>
        </Button>
      </DropdownMenuTrigger>
      
      <DropdownMenuContent 
        className="w-56 mt-2 p-2" 
        align="end" 
        forceMount
      >
        <DropdownMenuLabel className="font-normal">
          <div className="flex flex-col space-y-1">
            <p className="text-sm font-medium leading-none text-foreground">
              {user.fullName || 'User'}
            </p>
            <p className="text-xs leading-none text-muted-foreground">
              {user.emailAddresses[0]?.emailAddress}
            </p>
          </div>
        </DropdownMenuLabel>
        
        <DropdownMenuSeparator />
        
        <DropdownMenuItem asChild className="cursor-pointer">
          <Link href="/dashboard" className="flex items-center gap-2">
            <Target className="h-4 w-4" />
            Dashboard
          </Link>
        </DropdownMenuItem>
        
        <DropdownMenuItem asChild className="cursor-pointer">
          <Link href="/program" className="flex items-center gap-2">
            <Calendar className="h-4 w-4" />
            30-Day Program
          </Link>
        </DropdownMenuItem>
        
        <DropdownMenuItem asChild className="cursor-pointer">
          <Link href="/report" className="flex items-center gap-2">
            <Heart className="h-4 w-4" />
            My Report
          </Link>
        </DropdownMenuItem>
        
        <DropdownMenuItem asChild className="cursor-pointer">
          <Link href="/preferences" className="flex items-center gap-2">
            <Settings className="h-4 w-4" />
            Preferences
          </Link>
        </DropdownMenuItem>
        
        <DropdownMenuSeparator />
        
        <DropdownMenuItem 
          onClick={() => signOut()}
          className="cursor-pointer text-destructive focus:text-destructive"
        >
          <LogOut className="h-4 w-4 mr-2" />
          Sign out
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
