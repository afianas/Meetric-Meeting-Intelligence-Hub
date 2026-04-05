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
  Plus,
  Cpu,
  Layers,
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
      <Link href="/" className="flex h-16 items-center gap-2.5 border-b border-border px-6 hover:bg-muted/50 transition-colors">
        <span className="h-2 w-2 rounded-full bg-primary shrink-0" />
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

      {/* System Info Card */}
      <div className="border-t border-border/60 p-4">
        <div className="rounded-xl bg-primary/5 border border-primary/20 p-3.5 space-y-3">
          <p className="text-[9px] font-black uppercase tracking-[0.2em] text-primary/70">System Info</p>
          <div className="space-y-2.5">
            <div className="flex items-center gap-2">
              <Cpu className="h-3.5 w-3.5 text-primary shrink-0" />
              <span className="text-[10px] text-foreground/70 font-medium">Llama 3.3-70B · BGE Reranker</span>
            </div>
            <div className="flex items-center gap-2">
              <Layers className="h-3.5 w-3.5 text-primary shrink-0" />
              <span className="text-[10px] text-foreground/70 font-medium">Pinecone · MongoDB · FastAPI</span>
            </div>
          </div>
          <div className="pt-1.5 border-t border-primary/15 flex items-center justify-between">
            <span className="text-[9px] text-primary/60 font-bold uppercase tracking-widest">Meetric</span>
            <span className="text-[9px] font-mono text-muted-foreground/50">v1.0 · .vtt · .txt</span>
          </div>
        </div>
      </div>
    </aside>
  )
}
