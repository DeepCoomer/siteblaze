import { z } from 'zod';

// Shared optional override fields on every section
const base = {
  className: z.string().optional(),
  styleOverrides: z.string().optional(),
};

// ── Item schemas ────────────────────────────────────────────────────────────

export const FeatureItemSchema = z.object({
  icon: z.string(),
  title: z.string(),
  description: z.string(),
});

export const TestimonialItemSchema = z.object({
  quote: z.string(),
  author: z.string(),
  role: z.string().optional(),
  avatarUrl: z.string().optional(),
});

export const PricingTierSchema = z.object({
  name: z.string(),
  price: z.string(),
  description: z.string().optional(),
  features: z.array(z.string()),
  ctaText: z.string(),
  highlighted: z.boolean().optional(),
});

export const NavLinkSchema = z.object({
  label: z.string(),
  href: z.string(),
});

export const FAQItemSchema = z.object({
  question: z.string(),
  answer: z.string(),
});

export const StatItemSchema = z.object({
  value: z.string(),
  label: z.string(),
  description: z.string().optional(),
});

export const TeamMemberSchema = z.object({
  name: z.string(),
  role: z.string(),
  bio: z.string().optional(),
});

// ── Section schemas ─────────────────────────────────────────────────────────

const HeroSectionSchema = z.object({
  ...base,
  type: z.literal('HERO'),
  variant: z.enum(['centered', 'split-image', 'minimal']).default('centered'),
  content: z.object({
    title: z.string(),
    subtitle: z.string(),
    ctaText: z.string(),
    imageUrl: z.string().optional(),
  }),
});

const FeaturesSectionSchema = z.object({
  ...base,
  type: z.literal('FEATURES'),
  variant: z.enum(['grid', 'list', 'cards']).default('grid'),
  content: z.object({
    title: z.string().optional(),
    items: z.array(FeatureItemSchema).min(1),
  }),
});

const CTASectionSchema = z.object({
  ...base,
  type: z.literal('CTA'),
  variant: z.enum(['centered', 'banner', 'minimal']).default('centered'),
  content: z.object({
    title: z.string(),
    buttonText: z.string(),
    subtitle: z.string().optional(),
  }),
});

const TestimonialsSectionSchema = z.object({
  ...base,
  type: z.literal('TESTIMONIALS'),
  variant: z.enum(['grid', 'carousel', 'minimal']).default('grid'),
  content: z.object({
    title: z.string().optional(),
    items: z.array(TestimonialItemSchema).min(1),
  }),
});

const PricingSectionSchema = z.object({
  ...base,
  type: z.literal('PRICING'),
  variant: z.enum(['cards', 'table', 'minimal']).default('cards'),
  content: z.object({
    title: z.string().optional(),
    tiers: z.array(PricingTierSchema).min(1),
  }),
});

const NavbarSectionSchema = z.object({
  ...base,
  type: z.literal('NAVBAR'),
  variant: z.enum(['sticky', 'transparent', 'minimal']).default('sticky'),
  content: z.object({
    logo: z.string(),
    links: z.array(NavLinkSchema),
    ctaText: z.string().optional(),
  }),
});

const FAQSectionSchema = z.object({
  ...base,
  type: z.literal('FAQ'),
  variant: z.enum(['accordion', 'grid', 'minimal']).default('accordion'),
  content: z.object({
    title: z.string().optional(),
    items: z.array(FAQItemSchema).min(1),
  }),
});

const StatsSectionSchema = z.object({
  ...base,
  type: z.literal('STATS'),
  variant: z.enum(['grid', 'banner', 'minimal']).default('grid'),
  content: z.object({
    title: z.string().optional(),
    items: z.array(StatItemSchema).min(1),
  }),
});

const TeamSectionSchema = z.object({
  ...base,
  type: z.literal('TEAM'),
  variant: z.enum(['grid', 'cards', 'minimal']).default('grid'),
  content: z.object({
    title: z.string().optional(),
    items: z.array(TeamMemberSchema).min(1),
  }),
});

const NewsletterSectionSchema = z.object({
  ...base,
  type: z.literal('NEWSLETTER'),
  variant: z.enum(['centered', 'banner', 'minimal']).default('centered'),
  content: z.object({
    title: z.string(),
    subtitle: z.string().optional(),
    placeholder: z.string().optional(),
    buttonText: z.string(),
  }),
});

const LogoCloudSectionSchema = z.object({
  ...base,
  type: z.literal('LOGO_CLOUD'),
  variant: z.enum(['row', 'grid', 'minimal']).default('row'),
  content: z.object({
    title: z.string().optional(),
    items: z.array(z.object({ name: z.string(), logoUrl: z.string().optional() })).min(1),
  }),
});

const SkillsSectionSchema = z.object({
  ...base,
  type: z.literal('SKILLS'),
  variant: z.enum(['badges', 'bars', 'grid']).default('badges'),
  content: z.object({
    title: z.string().optional(),
    items: z.array(z.object({
      name: z.string(),
      level: z.number().min(1).max(5).optional(),
      icon: z.string().optional(),
      category: z.string().optional(),
    })).min(1),
  }),
});

const TimelineSectionSchema = z.object({
  ...base,
  type: z.literal('TIMELINE'),
  variant: z.enum(['vertical', 'horizontal', 'minimal']).default('vertical'),
  content: z.object({
    title: z.string().optional(),
    items: z.array(z.object({
      year: z.string(),
      title: z.string(),
      description: z.string(),
      tag: z.string().optional(),
    })).min(1),
  }),
});

const PortfolioGridSectionSchema = z.object({
  ...base,
  type: z.literal('PORTFOLIO_GRID'),
  variant: z.enum(['grid', 'list', 'minimal']).default('grid'),
  content: z.object({
    title: z.string().optional(),
    items: z.array(z.object({
      title: z.string(),
      description: z.string(),
      tags: z.array(z.string()),
      imageUrl: z.string().optional(),
    })).min(1),
  }),
});

const ContactFormSectionSchema = z.object({
  ...base,
  type: z.literal('CONTACT_FORM'),
  variant: z.enum(['centered', 'split', 'minimal']).default('centered'),
  content: z.object({
    title: z.string().optional(),
    subtitle: z.string().optional(),
    buttonText: z.string(),
  }),
});

const GallerySectionSchema = z.object({
  ...base,
  type: z.literal('GALLERY'),
  variant: z.enum(['grid', 'masonry', 'minimal']).default('grid'),
  content: z.object({
    title: z.string().optional(),
    items: z.array(z.object({
      alt: z.string(),
      imageUrl: z.string().optional(),
    })).min(1),
  }),
});

const ProductGridSectionSchema = z.object({
  ...base,
  type: z.literal('PRODUCT_GRID'),
  variant: z.enum(['grid', 'list', 'featured']).default('grid'),
  content: z.object({
    title: z.string().optional(),
    items: z.array(z.object({
      name: z.string(),
      price: z.string(),
      description: z.string().optional(),
      imageUrl: z.string().optional(),
      badge: z.string().optional(),
    })).min(1),
  }),
});

const TrustBadgesSectionSchema = z.object({
  ...base,
  type: z.literal('TRUST_BADGES'),
  variant: z.enum(['row', 'grid', 'minimal']).default('row'),
  content: z.object({
    items: z.array(z.object({
      icon: z.string(),
      title: z.string(),
      description: z.string().optional(),
    })).min(1),
  }),
});

const CountdownSectionSchema = z.object({
  ...base,
  type: z.literal('COUNTDOWN'),
  variant: z.enum(['centered', 'banner', 'minimal']).default('centered'),
  content: z.object({
    title: z.string().optional(),
    date: z.string(),
    subtitle: z.string().optional(),
    ctaText: z.string().optional(),
  }),
});

const ScheduleSectionSchema = z.object({
  ...base,
  type: z.literal('SCHEDULE'),
  variant: z.enum(['timeline', 'grid', 'minimal']).default('timeline'),
  content: z.object({
    title: z.string().optional(),
    items: z.array(z.object({
      time: z.string(),
      title: z.string(),
      description: z.string().optional(),
      speaker: z.string().optional(),
      location: z.string().optional(),
    })).min(1),
  }),
});

// ── Discriminated union ─────────────────────────────────────────────────────

export const SectionSchema = z.discriminatedUnion('type', [
  HeroSectionSchema,
  FeaturesSectionSchema,
  CTASectionSchema,
  TestimonialsSectionSchema,
  PricingSectionSchema,
  NavbarSectionSchema,
  FAQSectionSchema,
  StatsSectionSchema,
  TeamSectionSchema,
  NewsletterSectionSchema,
  LogoCloudSectionSchema,
  SkillsSectionSchema,
  TimelineSectionSchema,
  PortfolioGridSectionSchema,
  ContactFormSectionSchema,
  GallerySectionSchema,
  ProductGridSectionSchema,
  TrustBadgesSectionSchema,
  CountdownSectionSchema,
  ScheduleSectionSchema,
]);

// ── Root schema ─────────────────────────────────────────────────────────────

export const LandingPageSchema = z.object({
  metadata: z.object({
    siteName: z.string(),
    siteType: z.enum(['landing', 'portfolio', 'agency', 'saas', 'blog', 'ecommerce', 'event']).default('landing'),
    themeMode: z.enum(['light', 'dark', 'midnight']).default('light'),
    fontFamily: z.enum(['sans', 'serif', 'mono']).default('sans'),
    enableThemeToggle: z.boolean().default(false),
    colors: z.object({
      primary: z.string(),
      secondary: z.string(),
    }),
  }),
  sections: z.array(SectionSchema).min(1),
});

// ── Exported TypeScript types ───────────────────────────────────────────────

export type LandingPage = z.infer<typeof LandingPageSchema>;
export type Section = z.infer<typeof SectionSchema>;
export type FeatureItem = z.infer<typeof FeatureItemSchema>;
export type TestimonialItem = z.infer<typeof TestimonialItemSchema>;
export type PricingTier = z.infer<typeof PricingTierSchema>;
export type NavLink = z.infer<typeof NavLinkSchema>;
export type FAQItem = z.infer<typeof FAQItemSchema>;
export type StatItem = z.infer<typeof StatItemSchema>;
export type TeamMember = z.infer<typeof TeamMemberSchema>;
export type ThemeMode = LandingPage['metadata']['themeMode'];
export type FontFamily = LandingPage['metadata']['fontFamily'];
