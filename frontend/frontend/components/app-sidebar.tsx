"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { cn } from "@/lib/utils"
import {
  LayoutDashboard,
  CheckCircle2,
  Sparkles,
  MessageSquare,
  Upload,
  FileText,
  Settings,
  HelpCircle,
  Plus,
} from "lucide-react"
import { Button } from "@/components/ui/button"

const navItems = [
  { name: "Dashboard", href: "/app", icon: LayoutDashboard },
  { name: "Upload", href: "/app/upload", icon: Upload },
  { name: "Transcripts", href: "/app/transcripts", icon: FileText },
]

const secondaryNavItems = [
  { name: "Decision Tracker", href: "/app/decisions", icon: CheckCircle2 },
  { name: "Action Tracker", href: "/app/actions", icon: CheckCircle2 },
  { name: "Query Engine", href: "/app/query", icon: MessageSquare },
  { name: "Speaker Semantics", href: "/app/semantics", icon: Sparkles },
]

export function AppSidebar() {
  const pathname = usePathname()

  return (
    <aside className="fixed left-0 top-0 z-40 flex h-screen w-64 flex-col border-r border-border bg-card">
      {/* Logo */}
      <Link href="/" className="flex h-16 items-center gap-2 border-b border-border px-6 hover:bg-muted/50 transition-colors">
        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary">
          <span className="text-sm font-bold text-primary-foreground">M</span>
        </div>
        <div>
          <span className="font-serif text-lg font-semibold text-foreground italic">Meetric</span>
          <p className="text-[10px] uppercase tracking-wider text-muted-foreground">Meeting Intelligence Hub</p>
        </div>
      </Link>

      {/* New Meeting Button */}
      <div className="p-4">
        <Link href="/app/upload">
          <Button className="w-full gap-2 bg-primary hover:bg-primary/90">
            <Plus className="h-4 w-4" />
            New Meeting
          </Button>
        </Link>
      </div>

      {/* Main Navigation */}
      <nav className="flex-1 space-y-1 px-3">
        {navItems.map((item) => {
          const isActive = pathname === item.href
          return (
            <Link
              key={item.name}
              href={item.href}
              className={cn(
                "flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors",
                isActive
                  ? "bg-primary/10 text-primary border-l-2 border-primary"
                  : "text-muted-foreground hover:bg-muted hover:text-foreground"
              )}
            >
              <item.icon className="h-4 w-4" />
              {item.name}
            </Link>
          )
        })}

        <div className="py-4">
          <div className="border-t border-border" />
        </div>

        {secondaryNavItems.map((item) => {
          const isActive = pathname === item.href
          return (
            <Link
              key={item.name}
              href={item.href}
              className={cn(
                "flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors",
                isActive
                  ? "bg-primary/10 text-primary border-l-2 border-primary"
                  : "text-muted-foreground hover:bg-muted hover:text-foreground"
              )}
            >
              <item.icon className="h-4 w-4" />
              {item.name}
            </Link>
          )
        })}
      </nav>

      {/* Bottom Section */}
      <div className="border-t border-border p-3">
        <Link
          href="/app/settings"
          className="flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
        >
          <Settings className="h-4 w-4" />
          Settings
        </Link>
        <Link
          href="/app/help"
          className="flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
        >
          <HelpCircle className="h-4 w-4" />
          Help
        </Link>
      </div>
    </aside>
  )
}
