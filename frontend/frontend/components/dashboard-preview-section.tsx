"use client"

import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"

const FLOW_BARS = [3, 5, 2, 8, 4, 10, 6, 7, 3, 5, 9, 2, 4, 8, 5, 3, 7, 4]

const EMOTION_BARS = [
  { label: "Joy",          pct: 42, color: "bg-blue-500"   },
  { label: "Neutral",      pct: 38, color: "bg-slate-400"  },
  { label: "Anticipation", pct: 20, color: "bg-emerald-500"},
]

export function DashboardPreviewSection() {
  return (
    <section id="preview" className="py-32 bg-background relative overflow-hidden">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="text-center max-w-4xl mx-auto mb-20">
          <span className="text-[10px] font-bold uppercase tracking-[0.3em] text-primary mb-4 block">Platform Experience</span>
          <h2 className="font-serif text-4xl sm:text-5xl md:text-6xl font-light italic text-foreground tracking-tighter leading-tight balance">
            Your command center for <span className="font-extrabold text-primary">meeting intelligence.</span>
          </h2>
          <p className="mt-8 text-xl text-muted-foreground leading-relaxed max-w-2xl mx-auto font-medium">
            A curated environment where every session becomes a structured asset.
          </p>
        </div>

        <div className="relative max-w-5xl mx-auto">
          <div className="absolute -top-20 -left-20 w-64 h-64 bg-primary/10 rounded-full blur-[100px] animate-pulse" />
          <div className="absolute -bottom-20 -right-20 w-64 h-64 bg-primary/5 rounded-full blur-[100px] animate-pulse delay-1000" />

          {/* Main Dashboard Mockup */}
          <div className="relative z-10 rounded-[2.5rem] border border-white/20 bg-background/40 backdrop-blur-3xl shadow-[0_32px_120px_-20px_rgba(0,0,0,0.3)] overflow-hidden">
            <div className="border-b border-white/10 px-8 py-6 flex items-center justify-between bg-black/5">
              <div className="flex items-center gap-4">
                <div className="flex gap-1.5">
                  <div className="w-3 h-3 rounded-full bg-red-500/20" />
                  <div className="w-3 h-3 rounded-full bg-amber-500/20" />
                  <div className="w-3 h-3 rounded-full bg-green-500/20" />
                </div>
                <div className="h-4 w-px bg-white/10 mx-2" />
                <span className="text-xs font-bold uppercase tracking-widest text-muted-foreground">Semantic Intelligence</span>
              </div>
              <div className="h-8 w-8 rounded-full bg-primary/20 border border-primary/30 flex items-center justify-center">
                <span className="text-[10px] font-bold text-primary">JS</span>
              </div>
            </div>

            <div className="p-10">
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Left Panel: Analytics */}
                <div className="lg:col-span-1 space-y-6">
                  <div className="p-6 rounded-[1.5rem] bg-white/5 border border-white/5">
                    <p className="text-[10px] font-bold uppercase tracking-widest text-primary mb-2">Dominant Tone</p>
                    <div className="flex items-end gap-2">
                      <span className="text-4xl font-serif italic text-blue-400 font-bold">Joy</span>
                      <span className="text-muted-foreground text-[10px] font-bold mb-1.5 uppercase">Primary</span>
                    </div>
                  </div>

                  <div className="p-6 rounded-[1.5rem] bg-white/5 border border-white/5">
                    <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground mb-4">Emotional Footprint</p>
                    <div className="space-y-4">
                      {EMOTION_BARS.map(({ label, pct, color }) => (
                        <div key={label}>
                          <div className="flex items-center justify-between text-xs mb-2">
                            <span className="text-muted-foreground">{label}</span>
                            <span className="text-foreground font-bold">{pct}%</span>
                          </div>
                          <div className="h-1.5 w-full bg-white/5 rounded-full overflow-hidden">
                            <div className={`h-full ${color}`} style={{ width: `${pct}%` }} />
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Right Panel: Semantic Flow */}
                <div className="lg:col-span-2 space-y-4">
                  <div className="flex items-center justify-between mb-4">
                    <h4 className="text-sm font-bold uppercase tracking-widest">Semantic Flow</h4>
                    <Badge className="bg-primary/10 text-primary border-primary/20 text-[10px] font-bold">LIVE SYNC</Badge>
                  </div>

                  <div className="h-28 w-full flex items-end gap-1 mb-6 mt-2 opacity-50 px-2">
                    {FLOW_BARS.map((h, i) => (
                      <div key={i} className="flex-1 bg-primary/40 rounded-t-sm transition-all hover:bg-primary cursor-pointer" style={{ height: `${h * 10}%` }} />
                    ))}
                  </div>

                  <div className="p-6 rounded-2xl bg-white/5 border border-white/5">
                    <div className="flex items-center gap-3 mb-3">
                      <Avatar className="h-8 w-8">
                        <AvatarFallback className="text-[10px] bg-primary/20 text-primary font-bold">EJ</AvatarFallback>
                      </Avatar>
                      <div>
                        <div className="text-sm font-bold font-serif italic text-foreground leading-none mb-1">Elena's Vision Shift</div>
                        <div className="text-[9px] uppercase tracking-widest text-muted-foreground">04:12 • High Conviction</div>
                      </div>
                    </div>
                    <p className="text-sm leading-relaxed text-muted-foreground italic border-l-2 border-primary/40 pl-4 mt-4">
                      "We need to pivot the architecture to support microservices. The monolithic approach is going to completely derail our Q3 delivery timeline if we don't act now."
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Floating UI Elements */}
          <div className="hidden lg:block">
            <div className="absolute -top-10 -right-10 w-56 p-5 rounded-2xl bg-primary shadow-2xl rotate-3 animate-bounce">
              <p className="text-[10px] font-bold uppercase tracking-widest text-primary-foreground/60 mb-2">System Pulse</p>
              <h4 className="text-primary-foreground font-serif italic text-lg leading-tight">Clarity Spike Detected</h4>
              <p className="mt-2 text-[10px] text-primary-foreground/80 leading-relaxed">
                Strategic alignment in "Product Vision" is up 12% following Elena's summary.
              </p>
            </div>

            <div className="absolute -bottom-6 -left-12 w-64 p-6 rounded-2xl bg-white/10 backdrop-blur-2xl border border-white/20 shadow-2xl -rotate-2">
              <div className="flex items-center gap-3 mb-4">
                <div className="h-3 w-3 rounded-full bg-green-500 animate-pulse" />
                <span className="text-[10px] font-bold uppercase tracking-widest">Action Extracted</span>
              </div>
              <p className="text-xs font-medium leading-relaxed italic text-muted-foreground">
                "Sarah to oversee the vendor negotiations for H2 cloud spend budget by Friday."
              </p>
              <div className="mt-4">
                <span className="text-[10px] font-bold tracking-widest text-primary underline cursor-pointer">ASSIGN TO SARAH</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
