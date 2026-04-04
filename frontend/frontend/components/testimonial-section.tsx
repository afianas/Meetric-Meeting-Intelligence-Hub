"use client"

import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Quote } from "lucide-react"

const testimonials = [
  {
    quote: "Meetric has completely redefined how we digest project velocity. It&apos;s like having a senior editor in every meeting room, distilling complex debate into actionable intelligence.",
    author: "Julian Vought",
    role: "Product Director",
    company: "Ethos Media",
    initials: "JV",
  },
  {
    quote: "We used to spend hours reviewing meeting notes. Now our decisions are tracked automatically, and action items flow directly into our project management tools.",
    author: "Sarah Chen",
    role: "VP of Operations",
    company: "Nexus Ventures",
    initials: "SC",
  },
  {
    quote: "The sentiment analysis feature has been a game-changer for our leadership team. We can now identify concerns before they become blockers.",
    author: "Michael Torres",
    role: "Chief of Staff",
    company: "Meridian Labs",
    initials: "MT",
  },
]

export function TestimonialSection() {
  return (
    <section className="py-32 bg-secondary/5 border-y border-white/5 relative overflow-hidden">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="text-center max-w-4xl mx-auto mb-20">
          <span className="text-[10px] font-bold uppercase tracking-[0.3em] text-primary mb-4 block">Voices of Success</span>
          <h2 className="font-serif text-4xl sm:text-5xl md:text-6xl font-light italic text-foreground tracking-tighter leading-tight balance">
            Trusted by the <span className="font-extrabold text-primary">industry elite.</span>
          </h2>
        </div>

        <div className="grid gap-8 md:grid-cols-3">
          {testimonials.map((testimonial, index) => (
            <div 
              key={index} 
              className="group relative p-10 rounded-[2.5rem] bg-background border border-white/10 hover:border-primary/20 transition-all hover:translate-y-[-8px] shadow-2xl shadow-black/5 flex flex-col h-full"
            >
              <Quote className="h-12 w-12 text-primary/5 absolute top-8 right-8 group-hover:text-primary/10 transition-colors" />
              
              <p className="relative z-10 text-lg leading-relaxed italic text-foreground font-medium mb-10 flex-grow">
                &quot;{testimonial.quote}&quot;
              </p>
              
              <div className="flex items-center gap-4">
                <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center border border-primary/20">
                  <span className="text-xs font-bold text-primary">{testimonial.initials}</span>
                </div>
                <div className="flex flex-wrap items-baseline gap-x-3">
                  <p className="text-sm font-bold text-foreground tracking-tight">{testimonial.author}</p>
                  <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
                    {testimonial.role} • {testimonial.company}
                  </p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
