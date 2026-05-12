import { isDark, sectionAltBg } from './theme.js';
import type { Theme } from './theme.js';

export interface HeroProps {
  content: { title: string; subtitle: string; ctaText: string; imageUrl?: string };
  variant: 'centered' | 'split-image' | 'minimal';
  theme: Theme;
}

const PRIMARY   = 'var(--color-primary)';
const SECONDARY = 'var(--color-secondary)';

export function Hero({ content, variant, theme }: HeroProps) {
  const { title, subtitle, ctaText, imageUrl } = content;
  const dark = isDark(theme.themeMode);

  const textPrimary = dark ? 'text-white'   : 'text-gray-900';
  const textMuted   = dark ? 'text-gray-300' : 'text-gray-600';

  switch (variant) {

    case 'minimal':
      return (
        <section className={`px-6 py-16 ${sectionAltBg(theme.themeMode)}`}>
          <div className="mx-auto max-w-3xl border-l-4 pl-8" style={{ borderColor: PRIMARY }}>
            <h1 className={`text-4xl font-extrabold tracking-tight ${textPrimary} sm:text-5xl`}>
              {title}
            </h1>
            <p className={`mt-4 text-lg ${textMuted}`}>{subtitle}</p>
            <a
              href="#"
              className="mt-6 inline-block rounded-lg px-6 py-3 text-sm font-semibold text-white transition-opacity hover:opacity-90"
              style={{ backgroundColor: PRIMARY }}
            >
              {ctaText}
            </a>
          </div>
        </section>
      );

    case 'split-image':
      return (
        <section className="grid min-h-[600px] grid-cols-1 items-center lg:grid-cols-2">
          <div className="flex flex-col justify-center px-8 py-16 lg:px-16">
            <h1 className={`text-balance text-4xl font-extrabold tracking-tight ${textPrimary} sm:text-5xl lg:text-6xl`}>
              {title}
            </h1>
            <p className={`mt-6 max-w-xl text-lg ${textMuted}`}>{subtitle}</p>
            <a
              href="#"
              className="mt-10 inline-block w-fit rounded-full px-8 py-4 text-base font-semibold text-white shadow-lg transition-opacity hover:opacity-90"
              style={{ backgroundColor: PRIMARY }}
            >
              {ctaText}
            </a>
          </div>

          <div
            className="hidden min-h-[500px] items-center justify-center overflow-hidden lg:flex"
            style={{ background: `linear-gradient(135deg, ${PRIMARY}, ${SECONDARY})` }}
          >
            {imageUrl ? (
              <img src={imageUrl} alt={title} className="h-full w-full object-cover" />
            ) : (
              <span className="text-9xl opacity-20 select-none">✦</span>
            )}
          </div>
        </section>
      );

    case 'centered':
    default:
      return (
        <section className="relative flex flex-col items-center overflow-hidden px-6 pb-0 pt-24 text-center">
          {/* Radial primary glow */}
          <div
            className="pointer-events-none absolute inset-0 -z-10 opacity-15"
            style={{ background: `radial-gradient(ellipse 80% 60% at 50% 0%, ${PRIMARY}, transparent)` }}
          />
          <h1 className={`max-w-4xl text-balance text-5xl font-extrabold tracking-tight ${textPrimary} sm:text-6xl lg:text-7xl`}>
            {title}
          </h1>
          <p className={`mt-6 max-w-2xl text-balance text-lg ${textMuted} sm:text-xl`}>
            {subtitle}
          </p>
          <a
            href="#"
            className="mt-10 inline-block rounded-full px-8 py-4 text-base font-semibold text-white shadow-lg transition-opacity hover:opacity-90"
            style={{ backgroundColor: PRIMARY }}
          >
            {ctaText}
          </a>
          {imageUrl ? (
            <div className="mt-16 w-full max-w-5xl overflow-hidden rounded-t-2xl shadow-2xl ring-1 ring-black/10">
              <img
                src={imageUrl}
                alt={title}
                className="w-full object-cover object-top"
                style={{ maxHeight: '520px' }}
              />
            </div>
          ) : (
            <div
              className="mt-16 flex h-64 w-full max-w-5xl items-center justify-center rounded-t-2xl"
              style={{ background: `linear-gradient(135deg, ${PRIMARY}22, ${SECONDARY}22)` }}
            >
              <span className="text-8xl opacity-20 select-none">✦</span>
            </div>
          )}
        </section>
      );
  }
}
