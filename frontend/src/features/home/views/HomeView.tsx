import { HomeLayout } from '@/shared'
import {
  HeroSection,
  SourcesBentoSection,
  AgentWorkflowSection,
  ActionPlanShowcaseSection,
  ExtensibilitySection,
  TrustMetricsSection,
  FAQSection,
  CTASection,
} from '@/features/home'

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
