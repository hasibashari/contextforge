import {
  HeroSection,
  SourcesBentoSection,
  AgentWorkflowSection,
  ActionPlanShowcaseSection,
  ExtensibilitySection,
  TrustMetricsSection,
  FAQSection,
  CTASection,
} from '../features/home'
import Footer from '../shared/components/Footer'
import Navbar from '../shared/components/Navbar'

export default function Home() {
  return (
    <main className="min-h-screen bg-canvas text-ink selection:bg-primary/15 selection:text-primary relative">
      <Navbar />
      <HeroSection />
      <SourcesBentoSection />
      <AgentWorkflowSection />
      <ActionPlanShowcaseSection />
      <ExtensibilitySection />
      <TrustMetricsSection />
      <FAQSection />
      <CTASection />
      <Footer />
    </main>
  )
}



