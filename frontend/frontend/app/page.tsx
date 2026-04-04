import { Header } from "@/components/header"
import { HeroSection } from "@/components/hero-section"
import { StatsSection } from "@/components/stats-section"
import { FeaturesSection } from "@/components/features-section"
import { HowItWorksSection } from "@/components/how-it-works-section"
import { DashboardPreviewSection } from "@/components/dashboard-preview-section"
import { TestimonialSection } from "@/components/testimonial-section"
import { CtaSection } from "@/components/cta-section"
import { Footer } from "@/components/footer"

export default function HomePage() {
  return (
    <main className="min-h-screen">
      <Header />
      <HeroSection />
      <StatsSection />
      <FeaturesSection />
      <HowItWorksSection />
      <DashboardPreviewSection />
      <TestimonialSection />
      <CtaSection />
      <Footer />
    </main>
  )
}
