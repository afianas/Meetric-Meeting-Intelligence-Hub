"use client"

import { useEffect, useState, useRef } from "react"

function AnimatedCounter({ end, duration = 2000, suffix = "" }: { end: number; duration?: number; suffix?: string }) {
  const [count, setCount] = useState(0)
  const countRef = useRef<HTMLSpanElement>(null)
  const [hasAnimated, setHasAnimated] = useState(false)

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && !hasAnimated) {
          setHasAnimated(true)
          let start = 0
          const increment = end / (duration / 16)
          const timer = setInterval(() => {
            start += increment
            if (start >= end) {
              setCount(end)
              clearInterval(timer)
            } else {
              setCount(Math.floor(start))
            }
          }, 16)
        }
      },
      { threshold: 0.5 }
    )

    if (countRef.current) {
      observer.observe(countRef.current)
    }

    return () => observer.disconnect()
  }, [end, duration, hasAnimated])

  return (
    <span ref={countRef} className="tabular-nums">
      {count}{suffix}
    </span>
  )
}

export function StatsSection() {
  const stats = [
    { value: 85, suffix: "%", label: "Reduction in follow-up syncs" },
    { value: 12, suffix: "h", label: "Saved per week per leader" },
    { value: 10000, suffix: "+", label: "Meetings analyzed" },
    { value: 98, suffix: "%", label: "User satisfaction rate" },
  ]

  return (
    <section className="py-24 bg-background relative overflow-hidden">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-6 md:gap-8">
          {stats.map((stat, index) => (
            <div 
              key={index} 
              className="group relative p-8 rounded-3xl bg-secondary/50 backdrop-blur-sm border border-white/10 hover:border-primary/30 transition-all hover:translate-y-[-4px] text-center"
            >
              <div className="text-4xl md:text-5xl font-serif italic font-bold text-primary mb-3">
                <AnimatedCounter end={stat.value} suffix={stat.suffix} />
              </div>
              <p className="text-xs font-bold uppercase tracking-widest text-muted-foreground group-hover:text-foreground transition-colors leading-relaxed">
                {stat.label}
              </p>
              
              {/* Decorative Glow */}
              <div className="absolute inset-0 -z-10 bg-primary/5 rounded-3xl opacity-0 group-hover:opacity-100 transition-opacity blur-2xl" />
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
