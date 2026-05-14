import { describe, it, expect } from 'vitest';
import { LandingPageSchema } from './schema.js';

// Minimal valid config used as a base for most tests
const validConfig = {
  metadata: {
    siteName: 'Test Site',
    siteType: 'saas',
    themeMode: 'dark',
    fontFamily: 'sans',
    enableThemeToggle: false,
    colors: { primary: '#6366f1', secondary: '#8b5cf6' },
  },
  sections: [
    {
      type: 'NAVBAR',
      variant: 'sticky',
      content: { logo: 'TestSite', links: [{ label: 'Home', href: '#' }] },
    },
    {
      type: 'HERO',
      variant: 'centered',
      content: { title: 'Hello world', subtitle: 'Subtitle', ctaText: 'Get started' },
    },
    {
      type: 'CTA',
      variant: 'centered',
      content: { title: 'Ready?', buttonText: 'Start now' },
    },
  ],
};

describe('LandingPageSchema', () => {
  it('accepts a valid minimal config', () => {
    const result = LandingPageSchema.safeParse(validConfig);
    expect(result.success).toBe(true);
  });

  it('accepts all valid themeMode values', () => {
    for (const themeMode of ['light', 'dark', 'midnight']) {
      const result = LandingPageSchema.safeParse({
        ...validConfig,
        metadata: { ...validConfig.metadata, themeMode },
      });
      expect(result.success, `themeMode "${themeMode}" should be valid`).toBe(true);
    }
  });

  it('accepts all valid siteType values', () => {
    for (const siteType of ['landing', 'portfolio', 'agency', 'saas', 'blog', 'ecommerce', 'event']) {
      const result = LandingPageSchema.safeParse({
        ...validConfig,
        metadata: { ...validConfig.metadata, siteType },
      });
      expect(result.success, `siteType "${siteType}" should be valid`).toBe(true);
    }
  });

  it('rejects unknown themeMode', () => {
    const result = LandingPageSchema.safeParse({
      ...validConfig,
      metadata: { ...validConfig.metadata, themeMode: 'neon' },
    });
    expect(result.success).toBe(false);
  });

  it('rejects missing metadata', () => {
    const { metadata: _, ...noMeta } = validConfig;
    expect(LandingPageSchema.safeParse(noMeta).success).toBe(false);
  });

  it('rejects missing sections array', () => {
    const { sections: _, ...noSections } = validConfig;
    expect(LandingPageSchema.safeParse(noSections).success).toBe(false);
  });

  it('rejects invalid hex color', () => {
    const result = LandingPageSchema.safeParse({
      ...validConfig,
      metadata: { ...validConfig.metadata, colors: { primary: 'not-a-color', secondary: '#fff' } },
    });
    expect(result.success).toBe(false);
  });

  it('accepts optional color fields being absent by treating them as undefined', () => {
    const result = LandingPageSchema.safeParse({
      ...validConfig,
      metadata: { ...validConfig.metadata, colors: { primary: '#ff0000', secondary: '#00ff00' } },
    });
    expect(result.success).toBe(true);
  });

  it('accepts a PRICING section with valid tiers', () => {
    const result = LandingPageSchema.safeParse({
      ...validConfig,
      sections: [
        ...validConfig.sections,
        {
          type: 'PRICING',
          variant: 'cards',
          content: {
            tiers: [
              { name: 'Free', price: '$0', features: ['Feature A'], ctaText: 'Start', highlighted: false },
              { name: 'Pro',  price: '$9', features: ['Feature A', 'Feature B'], ctaText: 'Upgrade', highlighted: true },
            ],
          },
        },
      ],
    });
    expect(result.success).toBe(true);
  });

  it('accepts a TESTIMONIALS section with multiple items', () => {
    const result = LandingPageSchema.safeParse({
      ...validConfig,
      sections: [
        ...validConfig.sections,
        {
          type: 'TESTIMONIALS',
          variant: 'grid',
          content: {
            items: [
              { quote: 'Great product', author: 'Alice', role: 'CEO' },
              { quote: 'Love it',       author: 'Bob' },
              { quote: 'Amazing',       author: 'Carol', role: 'Designer' },
            ],
          },
        },
      ],
    });
    expect(result.success).toBe(true);
  });

  it('rejects a section with an unknown type', () => {
    const result = LandingPageSchema.safeParse({
      ...validConfig,
      sections: [
        ...validConfig.sections,
        { type: 'UNKNOWN_SECTION', variant: 'default', content: {} },
      ],
    });
    expect(result.success).toBe(false);
  });

  it('accepts a SKILLS section with badge variant', () => {
    const result = LandingPageSchema.safeParse({
      ...validConfig,
      sections: [
        ...validConfig.sections,
        {
          type: 'SKILLS',
          variant: 'badges',
          content: {
            title: 'My stack',
            items: [
              { name: 'TypeScript', level: 5 },
              { name: 'React', icon: '⚛️' },
              { name: 'Node.js', category: 'backend' },
            ],
          },
        },
      ],
    });
    expect(result.success).toBe(true);
  });

  it('accepts a TIMELINE section', () => {
    const result = LandingPageSchema.safeParse({
      ...validConfig,
      sections: [
        ...validConfig.sections,
        {
          type: 'TIMELINE',
          variant: 'vertical',
          content: {
            items: [
              { year: '2022', title: 'Founded', description: 'Started the company' },
              { year: '2023', title: 'Series A', description: 'Raised funding', tag: 'milestone' },
            ],
          },
        },
      ],
    });
    expect(result.success).toBe(true);
  });

  it('accepts a COUNTDOWN section', () => {
    const result = LandingPageSchema.safeParse({
      ...validConfig,
      sections: [
        ...validConfig.sections,
        {
          type: 'COUNTDOWN',
          variant: 'centered',
          content: { title: 'Launching soon', date: '2026-12-31', ctaText: 'Get notified' },
        },
      ],
    });
    expect(result.success).toBe(true);
  });

  it('accepts a CASE_STUDY section with all optional fields', () => {
    const result = LandingPageSchema.safeParse({
      ...validConfig,
      sections: [
        ...validConfig.sections,
        {
          type: 'CASE_STUDY',
          variant: 'split',
          content: {
            title: 'How Acme doubled revenue',
            problem: 'Slow onboarding',
            solution: 'Automated flow',
            results: [{ value: '2×', label: 'Revenue' }],
            tags: ['saas', 'growth'],
          },
        },
      ],
    });
    expect(result.success).toBe(true);
  });

  it('rejects a SKILLS section with level out of range', () => {
    const result = LandingPageSchema.safeParse({
      ...validConfig,
      sections: [
        ...validConfig.sections,
        {
          type: 'SKILLS',
          content: { items: [{ name: 'React', level: 6 }] },
        },
      ],
    });
    expect(result.success).toBe(false);
  });

  it('rejects a COUNTDOWN section missing required date', () => {
    const result = LandingPageSchema.safeParse({
      ...validConfig,
      sections: [
        ...validConfig.sections,
        { type: 'COUNTDOWN', content: { title: 'Soon' } },
      ],
    });
    expect(result.success).toBe(false);
  });

  it('defaults variant to "centered" on HERO when omitted', () => {
    const result = LandingPageSchema.safeParse({
      ...validConfig,
      sections: [
        { type: 'NAVBAR', variant: 'sticky', content: { logo: 'X', links: [] } },
        { type: 'HERO', content: { title: 'Hi', subtitle: 'Sub', ctaText: 'Go' } },
        { type: 'CTA', variant: 'centered', content: { title: 'Ready', buttonText: 'Go' } },
      ],
    });
    expect(result.success).toBe(true);
    if (result.success) {
      const hero = result.data.sections.find(s => s.type === 'HERO');
      expect((hero as { variant: string }).variant).toBe('centered');
    }
  });
});
