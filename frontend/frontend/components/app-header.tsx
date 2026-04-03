"use client"

import { Bell, HelpCircle } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { useRouter } from "next/navigation"

export function AppHeader() {
  const router = useRouter()

  return (
    <header className="sticky top-0 z-30 flex h-16 items-center justify-between border-b border-border bg-background/95 px-6 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      {/* Left side spacer - can be used for context-aware breadcrumbs later */}
      <div className="flex items-center gap-4">
        {/* Empty for now to maintain minimalist design */}
      </div>

      {/* Right Section */}
      <div className="flex items-center gap-2">
        <Button variant="ghost" size="sm" className="text-primary font-medium">
          Upgrade
        </Button>
        <Button variant="ghost" size="icon" className="text-muted-foreground">
          <HelpCircle className="h-5 w-5" />
        </Button>
        <Button variant="ghost" size="icon" className="relative text-muted-foreground">
          <Bell className="h-5 w-5" />
          <span className="absolute right-1.5 top-1.5 h-2 w-2 rounded-full bg-primary" />
        </Button>
        <div className="ml-2 flex items-center gap-3">
          <div className="text-right">
            <p className="text-sm font-medium text-foreground">Julian Thorne</p>
            <p className="text-xs text-muted-foreground">Editor-in-Chief</p>
          </div>
          <Avatar className="h-9 w-9">
            <AvatarImage src="https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=100&h=100&fit=crop&crop=face" />
            <AvatarFallback>JT</AvatarFallback>
          </Avatar>
        </div>
      </div>
    </header>
  )
}
