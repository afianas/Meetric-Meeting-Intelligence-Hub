"use client"

import { Button } from "@/components/ui/button"
import { HeroScene } from "@/components/hero-scene"
import Link from "next/link"
import { Play } from "lucide-react"

export function HeroSection() {
  return (
    <section className="relative min-h-screen flex items-center overflow-hidden">
      <HeroScene />

      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 pt-32 pb-20 relative z-10">
        {/* Text Protection Overlay */}
        <div className="absolute inset-0 -z-10 bg-[radial-gradient(circle_at_left,_white_0%,_transparent_70%)] opacity-30 pointer-events-none" />

        <div className="max-w-3xl">
          <h1 className="text-balance">
            <span className="block font-serif text-5xl sm:text-6xl md:text-7xl lg:text-8xl font-light italic text-foreground leading-[1.1] tracking-tight">
              Turn hours of
            </span>
            <span className="block font-serif text-5xl sm:text-6xl md:text-7xl lg:text-8xl font-light italic text-foreground leading-[1.1] tracking-tight">
              dialogue into
            </span>
            <span className="block font-serif text-5xl sm:text-6xl md:text-7xl lg:text-8xl font-extrabold italic text-primary leading-[1.1] tracking-tighter">
              minutes of clarity.
            </span>
          </h1>

          <p className="mt-8 text-xl text-muted-foreground max-w-xl leading-relaxed font-medium">
            Meetric transforms your voice transcripts into curated <span className="text-foreground italic">editorial intelligence</span>. No noise. Just structure, action, and insight.
          </p>

          <div className="mt-12 flex flex-wrap items-center gap-6">
            <Link href="/app">
              <Button size="lg" className="px-10 h-14 rounded-full text-base font-bold uppercase tracking-widest bg-primary hover:scale-105 transition-all shadow-[0_20px_50px_rgba(59,130,246,0.3)] border-b-4 border-blue-700 active:border-b-0 active:translate-y-1">
                Start Free Trial
              </Button>
            </Link>
            <Button variant="outline" size="lg" className="gap-3 h-14 px-8 rounded-full text-base font-bold uppercase tracking-widest border-2 hover:bg-muted transition-colors">
              <Play className="h-5 w-5 fill-current" />
              Watch Demo
            </Button>
          </div>
        </div>
      </div>

      <div className="absolute bottom-0 left-0 right-0 h-32 bg-gradient-to-t from-background to-transparent pointer-events-none" />
    </section>
  )
}
