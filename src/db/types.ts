// Component metadata types for type safety

export type HeroMetadata = {
  headline: string;
  subheadline?: string;
  ctaText?: string;
  ctaLink?: string;
  imageUrl?: string;
};

export type FeaturesMetadata = {
  title?: string;
  subtitle?: string;
  features: Array<{
    title: string;
    description: string;
    icon?: string;
  }>;
};

export type CtaMetadata = {
  headline: string;
  description?: string;
  primaryButtonText: string;
  primaryButtonLink: string;
  secondaryButtonText?: string;
  secondaryButtonLink?: string;
};

export type TestimonialsMetadata = {
  title?: string;
  testimonials: Array<{
    quote: string;
    author: string;
    role?: string;
    company?: string;
    avatarUrl?: string;
  }>;
};

export type PricingMetadata = {
  title?: string;
  subtitle?: string;
  plans: Array<{
    name: string;
    price: string;
    period?: string;
    features: string[];
    ctaText: string;
    highlighted?: boolean;
  }>;
};

export type FaqMetadata = {
  title?: string;
  items: Array<{
    question: string;
    answer: string;
  }>;
};

// Union type for all component metadata
export type ComponentMetadata =
  | { type: "hero"; data: HeroMetadata }
  | { type: "features"; data: FeaturesMetadata }
  | { type: "cta"; data: CtaMetadata }
  | { type: "testimonials"; data: TestimonialsMetadata }
  | { type: "pricing"; data: PricingMetadata }
  | { type: "faq"; data: FaqMetadata };

// Component types enum for reference
export const COMPONENT_TYPES = [
  "hero",
  "features",
  "cta",
  "testimonials",
  "pricing",
  "faq",
  "gallery",
  "contact",
  "team",
  "stats",
  "logos",
  "footer",
  "navigation",
] as const;

export type ComponentType = (typeof COMPONENT_TYPES)[number];
