import {
  Hero,
  SourcesBento,
  AgentWorkflow,
  ActionPlanShowcase,
  Extensibility,
  TrustMetrics,
  FAQ,
  CTA,
} from '../features/home'
import Footer from '../shared/components/Footer'
import Navbar from '../shared/components/Navbar'
import PWARedirector from '../shared/components/PWARedirector'
import { PWAInstallBanner } from '../features/user'

export default function Home() {
  return (
    <main className="min-h-screen bg-canvas text-ink selection:bg-primary/15 selection:text-primary relative">
      <PWARedirector />
      <Navbar />
      <Hero />
      <SourcesBento />
      <AgentWorkflow />
      <ActionPlanShowcase />
      <Extensibility />
      <TrustMetrics />
      <FAQ />
      <CTA />
      <Footer />

      {/* Floating PWA install prompt for mobile visitors */}
      <PWAInstallBanner variant="floating" />
    </main>
  )
}



