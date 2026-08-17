import {
  ShieldCheck,
  HeartPulse,
  Brain,
  Zap,
  type LucideIcon,
} from 'lucide-react'

export interface BenefitItem {
  title: string
  description: string
  Icon: LucideIcon
  iconColor: string
}

export const benefitsData: BenefitItem[] = [
  {
    title: 'Cardiovascular Support',
    description: 'Promotes optimal endothelial function and healthy arterial elasticity using clinically proven bio-nutrients.',
    Icon: HeartPulse,
    iconColor: 'text-red-500',
  },
  {
    title: 'Cognitive Clarity & Focus',
    description: 'Enhances synaptic neurotransmission and memory recall while reducing mental fatigue and brain fog.',
    Icon: Brain,
    iconColor: 'text-primary',
  },
  {
    title: 'Cellular Energy & Vitality',
    description: 'Stimulates mitochondrial ATP production to boost daily stamina without stimulants or crashes.',
    Icon: Zap,
    iconColor: 'text-accent-amber',
  },
  {
    title: 'Immune System Fortification',
    description: 'Delivers broad-spectrum antioxidant protection to reinforce natural cellular defense mechanisms.',
    Icon: ShieldCheck,
    iconColor: 'text-accent-teal',
  },
]

export interface IngredientItem {
  name: string
  amount: string
  desc: string
}

export const ingredientsData: IngredientItem[] = [
  {
    name: 'Coenzyme Q10 (Ubiquinol)',
    amount: '200 mg',
    desc: 'High-absorption active antioxidant supporting cardiac muscle efficiency and intracellular energy production.',
  },
  {
    name: 'Phosphatidylserine (PS-90)',
    amount: '150 mg',
    desc: 'Pure phospholipid required for optimal neuron membrane fluidity, memory consolidation, and stress reduction.',
  },
  {
    name: 'Trans-Resveratrol 99%',
    amount: '250 mg',
    desc: 'Standardized polyphenol activating SIRT1 longevity pathways and promoting vascular elasticity.',
  },
  {
    name: 'Magnesium L-Threonate',
    amount: '400 mg',
    desc: 'Unique chelated form capable of crossing the blood-brain barrier for superior neurological support.',
  },
]

export interface TestimonialItem {
  quote: string
  author: string
  role: string
  avatarUrl: string
}

export const testimonialsData: TestimonialItem[] = [
  {
    quote:
      'As a preventive cardiologist, I look for verifiable bio-availability and clinical trial backing. MediCore exceeds our standard clinical thresholds.',
    author: 'Dr. Marcus Vance, MD',
    role: 'Chief of Cardiology, Metro Health',
    avatarUrl: 'https://images.pexels.com/photos/5327585/pexels-photo-5327585.jpeg?auto=compress&cs=tinysrgb&w=150',
  },
  {
    quote:
      'Within three weeks of the recommended protocol, my cognitive endurance and morning recovery showed measurable improvement.',
    author: 'Elena Rostova',
    role: 'Biomedical Researcher & Patient',
    avatarUrl: 'https://images.pexels.com/photos/4173251/pexels-photo-4173251.jpeg?auto=compress&cs=tinysrgb&w=150',
  },
  {
    quote:
      'The purity and transparency of their formula gives me complete confidence in recommending this to my integrative health patients.',
    author: 'Dr. Sarah Jenkins, DO',
    role: 'Integrative Medicine Specialist',
    avatarUrl: 'https://images.pexels.com/photos/220453/pexels-photo-220453.jpeg?auto=compress&cs=tinysrgb&w=150',
  },
]

export interface FAQItem {
  question: string
  answer: string
}

export const faqData: FAQItem[] = [
  {
    question: 'How quickly can I expect noticeable results?',
    answer:
      'Most individuals notice improved daily focus and sustained energy within 7 to 14 days of consistent daily use. Cumulative cellular and cardiovascular benefits are clinically documented after 60-90 days.',
  },
  {
    question: 'Is a doctor prescription required?',
    answer:
      'No prescription is required. All MediCore formulas are classified as dietary and clinical-grade nutraceuticals manufactured under strict FDA cGMP guidelines.',
  },
  {
    question: 'How are the ingredients tested for purity?',
    answer:
      'Each production batch undergoes third-party ISO 17025 accredited laboratory testing with HPLC, mass spectrometry, and heavy metal screening before release.',
  },
  {
    question: 'Can this be taken alongside other medications?',
    answer:
      'MediCore is formulated with high-safety margin bio-compounds. However, if you are currently taking prescription blood thinners or chronic medication, please consult your physician.',
  },
]
