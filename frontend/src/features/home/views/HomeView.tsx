import { HomeLayout } from '../../../shared/layouts'
import HeroSection from '../components/HeroSection'
import SourcesBentoSection from '../components/SourcesBentoSection'
import AgentWorkflowSection from '../components/AgentWorkflowSection'
import ActionPlanShowcaseSection from '../components/ActionPlanShowcaseSection'
import ExtensibilitySection from '../components/ExtensibilitySection'
import TrustMetricsSection from '../components/TrustMetricsSection'
import FAQSection from '../components/FAQSection'
import CTASection from '../components/CTASection'

export default function HomeView() {
  return (
    <HomeLayout>
      <HeroSection />
      <SourcesBentoSection />
      <AgentWorkflowSection />
      <ActionPlanShowcaseSection />
      <ExtensibilitySection />
      <TrustMetricsSection />
      <FAQSection />
      <CTASection />
    </HomeLayout>
  )
}
