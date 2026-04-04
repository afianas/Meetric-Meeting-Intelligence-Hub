"use client"

import { HelpCircle, Settings, LogOut, BookOpen, MessageSquare, Keyboard, Info } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { useRouter } from "next/navigation"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"

const MOCK_USER = {
  name: "Julian Thorne",
  role: "Editor-in-Chief",
  initials: "JT",
  avatar: "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=100&h=100&fit=crop&crop=face",
}

const HELP_ITEMS = [
  {
    icon: BookOpen,
    label: "Supported Formats",
    description: "Upload .vtt (WebVTT) or .txt transcripts. Multi-file batch upload is supported.",
  },
  {
    icon: MessageSquare,
    label: "Query Engine",
    description: "Global mode searches all meetings. Select a meeting to scope results to one session.",
  },
  {
    icon: Keyboard,
    label: "Keyboard Tip",
    description: "Press Enter in the query box to run a search instantly.",
  },
  {
    icon: Info,
    label: "Confidence Score",
    description: "Scores above 50% indicate a strong semantic match from the BGE reranker.",
  },
]

export function AppHeader() {
  const router = useRouter()

  return (
    <header className="sticky top-0 z-30 flex h-16 items-center justify-end border-b border-border bg-background/95 px-6 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="flex items-center gap-2">

        {/* Help Popover */}
        <Popover>
          <PopoverTrigger asChild>
            <Button variant="ghost" size="icon" className="text-muted-foreground hover:text-foreground">
              <HelpCircle className="h-5 w-5" />
            </Button>
          </PopoverTrigger>
          <PopoverContent align="end" className="w-80 p-0 rounded-2xl border-border/60 shadow-xl overflow-hidden">
            <div className="px-5 py-4 border-b border-border/40 bg-muted/20">
              <p className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground">Help & Reference</p>
            </div>
            <div className="divide-y divide-border/30">
              {HELP_ITEMS.map((item) => (
                <div key={item.label} className="flex items-start gap-4 px-5 py-4 hover:bg-muted/30 transition-colors">
                  <div className="mt-0.5 h-8 w-8 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
                    <item.icon className="h-4 w-4 text-primary" />
                  </div>
                  <div className="space-y-0.5">
                    <p className="text-xs font-bold text-foreground">{item.label}</p>
                    <p className="text-[11px] text-muted-foreground leading-relaxed">{item.description}</p>
                  </div>
                </div>
              ))}
            </div>
            <div className="px-5 py-3 bg-muted/10 border-t border-border/30">
              <p className="text-[10px] text-muted-foreground/60 text-center">Meetric Intelligence Hub · v1.0</p>
            </div>
          </PopoverContent>
        </Popover>

        {/* User Dropdown */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <div className="ml-2 flex items-center gap-3 cursor-pointer hover:opacity-80 transition-opacity">
              <div className="text-right hidden sm:block">
                <p className="text-sm font-medium text-foreground">{MOCK_USER.name}</p>
                <p className="text-xs text-muted-foreground">{MOCK_USER.role}</p>
              </div>
              <Avatar className="h-9 w-9">
                <AvatarImage src={MOCK_USER.avatar} />
                <AvatarFallback>{MOCK_USER.initials}</AvatarFallback>
              </Avatar>
            </div>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-56">
            <DropdownMenuLabel>My Account</DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem>
              <Settings className="mr-2 h-4 w-4" />
              <span>Settings</span>
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={() => router.push("/")}>
              <LogOut className="mr-2 h-4 w-4" />
              <span>Log out</span>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>

      </div>
    </header>
  )
}
