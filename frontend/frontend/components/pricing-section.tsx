"use client"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader } from "@/components/ui/card"
import Link from "next/link"
import { Check } from "lucide-react"

const plans = [
  {
    name: "Editorial Pro",
    price: "$19",
    period: "/mo",
    description: "Perfect for individuals and small teams getting started.",
    features: [
      "Unlimited recording & storage",
      "Advanced Query Engine",
      "Basic AI Summaries",
      "Email support",
      "Up to 5 team members",
    ],
    cta: "Start 14-Day Trial",
    popular: false,
  },
  {
    name: "Intelligence Hub",
    price: "$49",
    period: "/user/mo",
    description: "For growing teams that need advanced analytics and integrations.",
    features: [
      "All Pro features",
      "Linear & Jira Native Sync",
      "Scoped Chatbot Access",
      "Decision Tracking Engine",
      "Speaker Sentiment Analysis",
      "Priority support",
    ],
    cta: "Get Hub Access",
    popular: true,
  },
  {
    name: "Enterprise",
    price: "Custom",
    period: "",
    description: "For organizations requiring custom solutions and dedicated support.",
    features: [
      "All Hub features",
      "Custom integrations",
      "SSO & advanced security",
      "Dedicated success manager",
      "SLA guarantee",
      "On-premise deployment option",
    ],
    cta: "Contact Sales",
    popular: false,
  },
]

export function PricingSection() {
  return (
    <section id="pricing" className="py-32 bg-background relative overflow-hidden">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="text-center max-w-4xl mx-auto mb-20">
          <span className="text-[10px] font-bold uppercase tracking-[0.3em] text-primary mb-4 block">Membership</span>
          <h2 className="font-serif text-4xl sm:text-5xl md:text-6xl font-light italic text-foreground tracking-tighter leading-tight balance">
            Invest in <span className="font-extrabold text-primary">Intelligence.</span>
          </h2>
          <p className="mt-8 text-xl text-muted-foreground leading-relaxed max-w-2xl mx-auto font-medium">
            Choose the tier that matches your team&apos;s editorial needs.
          </p>
        </div>

        <div className="grid gap-8 lg:grid-cols-3">
          {plans.map((plan, index) => (
            <div 
              key={index} 
              className={`relative p-10 rounded-[2.5rem] transition-all duration-500 ${
                plan.popular 
                  ? "bg-slate-900 text-white scale-105 shadow-[0_40px_80px_-20px_rgba(0,0,0,0.4)] z-10" 
                  : "bg-secondary/30 backdrop-blur-sm border border-white/10 hover:border-primary/20"
              }`}
            >
              {plan.popular && (
                <div className="absolute top-8 right-8">
                  <span className="bg-primary text-primary-foreground text-[10px] font-bold px-3 py-1.5 rounded-full uppercase tracking-wider">
                    Most Selected
                  </span>
                </div>
              )}
              
              <div className="mb-8">
                <h3 className={`text-base font-bold uppercase tracking-widest ${plan.popular ? "text-primary" : "text-muted-foreground"}`}>
                  {plan.name}
                </h3>
                <div className="mt-6 flex items-baseline gap-1">
                  <span className="text-5xl font-serif italic font-black">{plan.price}</span>
                  <span className={`text-sm font-medium ${plan.popular ? "text-slate-400" : "text-muted-foreground"}`}>{plan.period}</span>
                </div>
                <p className={`mt-4 text-sm font-medium leading-relaxed ${plan.popular ? "text-slate-300" : "text-muted-foreground"}`}>
                  {plan.description}
                </p>
              </div>

              <div className="h-px w-full bg-white/10 my-8" />

              <ul className="space-y-4 mb-10">
                {plan.features.map((feature, featureIndex) => (
                  <li key={featureIndex} className="flex items-start gap-4">
                    <Check className={`h-5 w-5 shrink-0 mt-0.5 ${plan.popular ? "text-primary" : "text-primary/60"}`} />
                    <span className={`text-sm font-medium ${plan.popular ? "text-slate-300" : "text-muted-foreground"}`}>{feature}</span>
                  </li>
                ))}
              </ul>

              <Link href="/app">
                <Button 
                  className={`w-full h-14 rounded-full text-xs font-bold uppercase tracking-widest transition-all ${
                    plan.popular 
                      ? "bg-primary hover:scale-105 text-primary-foreground shadow-lg shadow-primary/20" 
                      : "bg-white/10 hover:bg-white/20 text-foreground border border-white/10"
                  }`}
                >
                  {plan.cta}
                </Button>
              </Link>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
