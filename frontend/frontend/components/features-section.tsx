"use client"

import { Card, CardContent } from "@/components/ui/card"
import { Brain, CheckCircle2, MessageSquare, BarChart3, Users, Zap } from "lucide-react"

const features = [
  {
    icon: Brain,
    title: "AI-Powered Analysis",
    description: "Our advanced AI extracts key decisions, action items, and insights from every meeting transcript automatically.",
  },
  {
    icon: CheckCircle2,
    title: "Decision Tracker",
    description: "A curated log of all definitive outcomes recorded during your discussions. Maintain project momentum and accountability.",
  },
  {
    icon: MessageSquare,
    title: "Query Engine",
    description: "Ask questions globally across all your historical transcripts or a specific transcript. Find decisions, clarify intent, and extract data in seconds.",
  },
  {
    icon: BarChart3,
    title: "Sentiment Analysis",
    description: "Understand the emotional dynamics of your meetings with speaker sentiment timelines and detailed footprints.",
  },
  {
    icon: Users,
    title: "Speaker Semantics",
    description: "Track individual contributions, agreement patterns, and concerns across all participants in your sessions.",
  },
  {
    icon: Zap,
    title: "Action Items",
    description: "Track key milestones and assigned tasks extracted from your editorial meetings and strategic reviews.",
  },
]

export function FeaturesSection() {
  return (
    <section id="features" className="py-32 bg-background relative overflow-hidden">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="text-center max-w-4xl mx-auto mb-20">
          <span className="text-[10px] font-bold uppercase tracking-[0.3em] text-primary mb-4 block">Editorial Intelligence</span>
          <h2 className="font-serif text-4xl sm:text-5xl md:text-6xl font-light italic text-foreground tracking-tighter leading-tight balance">
            Everything you need for <span className="font-extrabold text-primary">strategic clarity.</span>
          </h2>
          <p className="mt-8 text-xl text-muted-foreground leading-relaxed max-w-2xl mx-auto font-medium">
            Transform unstructured dialogue into pristine editorial summaries.
            Meetric handles the complexity, you focus on the outcome.
          </p>
        </div>

        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {features.map((feature, index) => (
            <div
              key={index}
              className="group p-8 rounded-[2rem] bg-secondary/30 backdrop-blur-sm border border-white/10 hover:border-primary/20 transition-all hover:bg-secondary/50"
            >
              <div className="h-14 w-14 rounded-2xl bg-primary/10 flex items-center justify-center mb-6 group-hover:scale-110 transition-transform shadow-inner shadow-primary/20">
                <feature.icon className="h-7 w-7 text-primary" />
              </div>
              <h3 className="text-xl font-bold text-foreground mb-3 tracking-tight">{feature.title}</h3>
              <p className="text-muted-foreground leading-relaxed font-medium text-sm">
                {feature.description}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
