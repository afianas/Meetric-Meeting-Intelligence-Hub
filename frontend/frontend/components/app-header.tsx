"use client"

import { Bell, HelpCircle, FileText } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { useRouter } from "next/navigation"
import { useQuery } from "@tanstack/react-query"
import { getMeetings, BackendMeeting, normalizeMeeting } from "@/lib/api"

export function AppHeader() {
  const router = useRouter()

  const { data: meetings = [] } = useQuery({
    queryKey: ['meetings'],
    queryFn: getMeetings,
  })

  return (
    <header className="sticky top-0 z-30 flex h-16 items-center justify-between border-b border-border bg-background/95 px-6 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      {/* Meeting Selector Instead of Search */}
      <div className="relative w-full max-w-md">
        <Select onValueChange={(val) => {
          if (val) router.push(`/app/transcripts?id=${val}`)
        }}>
          <SelectTrigger className="w-full bg-muted/50 border-0 focus-visible:ring-1 focus-visible:ring-primary h-9">
            <div className="flex items-center gap-2">
              <FileText className="h-4 w-4 text-muted-foreground mr-1" />
              <SelectValue placeholder="Quickly Jump to Meeting Transcript..." />
            </div>
          </SelectTrigger>
          <SelectContent>
            {(meetings as BackendMeeting[]).map(m => {
              const mapped = normalizeMeeting(m);
              return (
                <SelectItem key={m._id} value={m._id}>
                  {mapped.title} ({mapped.date})
                </SelectItem>
              )
            })}
          </SelectContent>
        </Select>
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
