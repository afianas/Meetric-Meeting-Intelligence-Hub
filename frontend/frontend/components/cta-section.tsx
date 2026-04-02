"use client"

import { Button } from "@/components/ui/button"
import Link from "next/link"

export function CtaSection() {
  return (
    <section className="py-32 bg-background relative overflow-hidden">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="relative overflow-hidden rounded-[3rem] bg-slate-900 px-8 py-20 md:px-16 md:py-32 text-center">
          {/* Immersive Background */}
          <div className="absolute inset-0 -z-10 group">
            <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-primary/20 rounded-full blur-[120px] opacity-50 group-hover:opacity-80 transition-opacity duration-1000" />
            <div className="absolute bottom-0 left-0 w-[400px] h-[400px] bg-blue-500/10 rounded-full blur-[100px] opacity-30" />
          </div>
          
          <div className="max-w-3xl mx-auto relative z-10">
            <span className="text-[10px] font-bold uppercase tracking-[0.4em] text-primary mb-6 block">Final Access</span>
            <h2 className="font-serif text-4xl sm:text-5xl md:text-7xl font-light italic text-white tracking-tighter leading-[1.1] balance">
              Start your journey toward <span className="font-extrabold text-primary">absolute clarity.</span>
            </h2>
            <p className="mt-8 text-xl text-slate-400 leading-relaxed max-w-xl mx-auto font-medium">
              Join the elite teams who have transformed their meeting culture into a structured intelligence asset.
            </p>
            
            <div className="mt-12 flex flex-wrap justify-center gap-6">
              <Link href="/app">
                <Button 
                  size="lg" 
                  className="px-10 h-16 rounded-full text-base font-bold uppercase tracking-widest bg-primary hover:scale-105 transition-all shadow-[0_20px_50px_rgba(59,130,246,0.3)] border-b-4 border-blue-700 active:border-b-0 active:translate-y-1"
                >
                  Join the platform
                </Button>
              </Link>
              <Link href="/app">
                <Button 
                  size="lg" 
                  variant="outline"
                  className="px-10 h-16 rounded-full text-base font-bold uppercase tracking-widest border-2 border-white/10 text-white hover:bg-white/5 transition-colors"
                >
                  Book Executive Demo
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
