"use client"

import Link from "next/link"
import { Button } from "@/components/ui/button"
import { useState } from "react"
import { Menu, X } from "lucide-react"

export function Header() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)

  return (
    <header className="fixed top-6 left-0 right-0 z-50 px-4 pointer-events-none">
      <nav className="mx-auto max-w-4xl pointer-events-auto">
        <div className="rounded-full bg-background/60 backdrop-blur-xl border border-white/20 shadow-[0_8px_32px_0_rgba(0,0,0,0.1)] px-6 py-3 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <span className="h-2 w-2 rounded-full bg-primary" />
            <span className="font-serif text-lg font-semibold italic text-foreground tracking-tight">Meetric</span>
          </div>

          <div className="hidden md:flex items-center gap-8">
            <Link href="#features" className="text-xs font-semibold uppercase tracking-widest text-muted-foreground hover:text-primary transition-colors">
              Features
            </Link>
          </div>

          <div className="flex items-center gap-3">
            <Link href="/app">
              <Button size="sm" className="rounded-full text-xs font-bold uppercase tracking-wider h-8 px-5 bg-primary hover:scale-105 transition-transform shadow-lg shadow-primary/20">
                Get Started
              </Button>
            </Link>
          </div>
        </div>
      </nav>
    </header>
  )
}
