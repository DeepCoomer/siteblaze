import React, { Component } from 'react';
import { Hero } from '@org/ui-elements';
import { Features } from '@org/ui-elements';
import { CTASection } from '@org/ui-elements';
import { Testimonials } from '@org/ui-elements';
import { Pricing } from '@org/ui-elements';
import { Navbar } from '@org/ui-elements';
import { FAQ } from '@org/ui-elements';
import { Stats } from '@org/ui-elements';
import { Team } from '@org/ui-elements';
import { Newsletter } from '@org/ui-elements';
import { LogoCloud } from '@org/ui-elements';
import { Skills } from '@org/ui-elements';
import { Timeline } from '@org/ui-elements';
import { PortfolioGrid } from '@org/ui-elements';
import { ContactForm } from '@org/ui-elements';
import { Gallery } from '@org/ui-elements';
import { ProductGrid } from '@org/ui-elements';
import { TrustBadges } from '@org/ui-elements';
import { Countdown } from '@org/ui-elements';
import { Schedule } from '@org/ui-elements';
import { CaseStudy } from '@org/ui-elements';
import { VideoEmbed } from '@org/ui-elements';
import { LandingPageSchema } from './schema.js';
import type { Section } from './schema.js';
import type { Theme } from '@org/ui-elements';

// ---------------------------------------------------------------------------
// Theme helpers
// ---------------------------------------------------------------------------

const THEME_BG: Record<string, string> = {
  light:    'bg-white text-gray-900',
  dark:     'bg-gray-900 text-gray-100',
  midnight: 'bg-slate-950 text-white',
};

const FONT_CLASS: Record<string, string> = {
  sans:  'font-sans',
  serif: 'font-serif',
  mono:  'font-mono',
};

// ---------------------------------------------------------------------------
// Error boundary
// ---------------------------------------------------------------------------

type BoundaryState = { error: Error | null };

class SectionErrorBoundary extends Component<
  { children: React.ReactNode; label: string },
  BoundaryState
> {
  override state: BoundaryState = { error: null };

  static getDerivedStateFromError(error: Error): BoundaryState {
    return { error };
  }

  override render() {
    if (this.state.error) {
      return (
        <div
          role="alert"
          className="my-4 rounded-lg border border-red-200 bg-red-50 px-6 py-5 text-sm text-red-700"
        >
          <strong>Section "{this.props.label}" failed to render.</strong>
          <pre className="mt-2 whitespace-pre-wrap text-xs opacity-75">
            {this.state.error.message}
          </pre>
        </div>
      );
    }
    return this.props.children;
  }
}

// ---------------------------------------------------------------------------
// Style-override parser
// ---------------------------------------------------------------------------

function parseStyleOverrides(raw?: string): React.CSSProperties {
  if (!raw) return {};
  try {
    return JSON.parse(raw) as React.CSSProperties;
  } catch {
    return {};
  }
}

// ---------------------------------------------------------------------------
// Section renderer
// ---------------------------------------------------------------------------

function renderSection(section: Section, theme: Theme): React.ReactElement {
  let inner: React.ReactElement;

  switch (section.type) {
    case 'HERO':
      inner = <Hero content={section.content} variant={section.variant} theme={theme} />;
      break;
    case 'FEATURES':
      inner = <Features content={section.content} variant={section.variant} theme={theme} />;
      break;
    case 'CTA':
      inner = <CTASection content={section.content} variant={section.variant} theme={theme} />;
      break;
    case 'TESTIMONIALS':
      inner = <Testimonials content={section.content} variant={section.variant} theme={theme} />;
      break;
    case 'PRICING':
      inner = <Pricing content={section.content} variant={section.variant} theme={theme} />;
      break;
    case 'NAVBAR':
      inner = <Navbar content={section.content} variant={section.variant} theme={theme} />;
      break;
    case 'FAQ':
      inner = <FAQ content={section.content} variant={section.variant} theme={theme} />;
      break;
    case 'STATS':
      inner = <Stats content={section.content} variant={section.variant} theme={theme} />;
      break;
    case 'TEAM':
      inner = <Team content={section.content} variant={section.variant} theme={theme} />;
      break;
    case 'NEWSLETTER':
      inner = <Newsletter content={section.content} variant={section.variant} theme={theme} />;
      break;
    case 'LOGO_CLOUD':
      inner = <LogoCloud content={section.content} variant={section.variant} theme={theme} />;
      break;
    case 'SKILLS':
      inner = <Skills content={section.content} variant={section.variant} theme={theme} />;
      break;
    case 'TIMELINE':
      inner = <Timeline content={section.content} variant={section.variant} theme={theme} />;
      break;
    case 'PORTFOLIO_GRID':
      inner = <PortfolioGrid content={section.content} variant={section.variant} theme={theme} />;
      break;
    case 'CONTACT_FORM':
      inner = <ContactForm content={section.content} variant={section.variant} theme={theme} />;
      break;
    case 'GALLERY':
      inner = <Gallery content={section.content} variant={section.variant} theme={theme} />;
      break;
    case 'PRODUCT_GRID':
      inner = <ProductGrid content={section.content} variant={section.variant} theme={theme} />;
      break;
    case 'TRUST_BADGES':
      inner = <TrustBadges content={section.content} variant={section.variant} theme={theme} />;
      break;
    case 'COUNTDOWN':
      inner = <Countdown content={section.content} variant={section.variant} theme={theme} />;
      break;
    case 'SCHEDULE':
      inner = <Schedule content={section.content} variant={section.variant} theme={theme} />;
      break;
    case 'CASE_STUDY':
      inner = <CaseStudy content={section.content} variant={section.variant} theme={theme} />;
      break;
    case 'VIDEO_EMBED':
      inner = <VideoEmbed content={section.content} variant={section.variant} theme={theme} />;
      break;
    default: {
      const _: never = section;
      void _;
      const unknownType = (section as { type: string }).type;
      inner = (
        <div
          role="alert"
          className="my-4 rounded-lg border border-yellow-200 bg-yellow-50 px-6 py-4 text-sm text-yellow-800"
        >
          Unknown section type: <code className="font-mono">{unknownType}</code>
        </div>
      );
    }
  }

  const { className, styleOverrides } = section;
  if (!className && !styleOverrides) return inner;

  return (
    <div className={className} style={parseStyleOverrides(styleOverrides)}>
      {inner}
    </div>
  );
}

// ---------------------------------------------------------------------------
// PageRenderer
// ---------------------------------------------------------------------------

export interface PageRendererProps {
  config: unknown;
  /** Overrides the themeMode from the config at runtime — useful for live theme toggles. */
  themeOverride?: 'light' | 'dark' | 'midnight';
}

export function PageRenderer({ config, themeOverride }: PageRendererProps) {
  const result = LandingPageSchema.safeParse(config);

  if (!result.success) {
    return (
      <div
        role="alert"
        className="mx-auto max-w-2xl rounded-xl border border-red-200 bg-red-50 p-8 font-mono text-sm text-red-800"
      >
        <p className="mb-3 font-semibold">Invalid page configuration</p>
        <ul className="space-y-1 text-xs">
          {result.error.issues.map((issue, i) => (
            <li key={i}>
              <span className="opacity-60">{issue.path.join(' › ') || 'root'}</span>
              {' — '}
              {issue.message}
            </li>
          ))}
        </ul>
      </div>
    );
  }

  const { metadata, sections } = result.data;
  const effectiveTheme = themeOverride ?? metadata.themeMode;

  const theme: Theme = {
    colors: metadata.colors,
    themeMode: effectiveTheme,
    fontFamily: metadata.fontFamily,
  };

  const bgClass   = THEME_BG[effectiveTheme]        ?? THEME_BG['light'];
  const fontClass = FONT_CLASS[metadata.fontFamily]  ?? FONT_CLASS['sans'];

  return (
    <main
      className={`min-h-screen ${bgClass} ${fontClass} transition-colors duration-500`}
      style={{
        '--color-primary':   metadata.colors.primary,
        '--color-secondary': metadata.colors.secondary,
      } as React.CSSProperties}
    >
      {sections.map((section, i) => (
        <SectionErrorBoundary key={i} label={section.type}>
          {renderSection(section, theme)}
        </SectionErrorBoundary>
      ))}
    </main>
  );
}
