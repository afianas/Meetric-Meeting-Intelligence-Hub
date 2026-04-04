"use client"

import { Upload, Cpu, FileText, Sparkles } from "lucide-react"

const steps = [
  {
    icon: Upload,
    step: "01",
    title: "Upload Your Transcripts",
    description: "Drop your meeting transcripts in JSON or raw text format to map your collaborative dialogue.",
  },
  {
    icon: Cpu,
    step: "02",
    title: "Semantic Analysis",
    description: "Our engine indexes your conversational structure, mapping emotional footprint and interaction flow.",
  },
  {
    icon: FileText,
    step: "03",
    title: "Review Timelines",
    description: "Access synchronized dynamic timelines that highlight speaker pivots, tone intensity, and participation.",
  },
  {
    icon: Sparkles,
    step: "04",
    title: "Extract Intelligence",
    description: "Get curated summaries, action items, and decisions ready for your team to act on.",
  },
]

export function HowItWorksSection() {
  return (
    <section id="solutions" className="py-32 bg-secondary/10 relative overflow-hidden">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="text-center max-w-4xl mx-auto mb-20">
          <span className="text-[10px] font-bold uppercase tracking-[0.3em] text-primary mb-4 block">The Process</span>
          <h2 className="font-serif text-4xl sm:text-5xl md:text-6xl font-light italic text-foreground tracking-tighter leading-tight balance">
            From dialogue to <span className="font-extrabold text-primary">actionable clarity.</span>
          </h2>
          <p className="mt-8 text-xl text-muted-foreground leading-relaxed max-w-2xl mx-auto font-medium">
            Four simple steps to transform your meeting chaos into structured intelligence.
          </p>
        </div>

        <div className="grid gap-12 md:grid-cols-2 lg:grid-cols-4 relative">
          <div className="absolute top-1/2 left-0 w-full h-[2px] bg-gradient-to-r from-transparent via-primary/10 to-transparent hidden lg:block -translate-y-1/2" />
          
          {steps.map((item, index) => (
            <div key={index} className="relative group">
              <div className="mb-8 relative inline-block">
                <div className="h-20 w-20 rounded-[2rem] bg-background border border-border flex items-center justify-center group-hover:border-primary/50 transition-all group-hover:scale-110 shadow-xl shadow-black/5 relative z-10">
                  <item.icon className="h-8 w-8 text-primary" />
                </div>
                <div className="absolute -top-4 -right-4 text-4xl font-serif italic font-black text-primary/10 select-none">
                  {item.step}
                </div>
              </div>
              <h3 className="text-xl font-bold text-foreground mb-3 tracking-tight">{item.title}</h3>
              <p className="text-muted-foreground leading-relaxed font-medium text-sm">
                {item.description}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
