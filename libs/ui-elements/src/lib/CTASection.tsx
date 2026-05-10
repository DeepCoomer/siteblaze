import { isDark } from './theme.js';
import type { Theme } from './theme.js';

const PRIMARY   = 'var(--color-primary)';
const SECONDARY = 'var(--color-secondary)';

export interface CTASectionProps {
  content: { title: string; buttonText: string; subtitle?: string };
  variant: 'centered' | 'banner' | 'minimal';
  theme: Theme;
}

export function CTASection({ content, variant, theme }: CTASectionProps) {
  const { title, buttonText, subtitle } = content;
  const dark = isDark(theme.themeMode);

  const textPrimary = dark ? 'text-white'   : 'text-gray-900';
  const textMuted   = dark ? 'text-gray-300' : 'text-gray-600';

  switch (variant) {

    case 'banner':
      return (
        <section className="px-6 py-10" style={{ backgroundColor: PRIMARY }}>
          <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-6 sm:flex-row">
            <div>
              <h2 className="text-2xl font-extrabold text-white">{title}</h2>
              {subtitle && <p className="mt-1 text-sm text-white/70">{subtitle}</p>}
            </div>
            <a
              href="#"
              className="shrink-0 rounded-full bg-white px-8 py-3 text-sm font-semibold shadow-md transition-opacity hover:opacity-90"
              style={{ color: PRIMARY }}
            >
              {buttonText}
            </a>
          </div>
        </section>
      );

    case 'minimal':
      return (
        <section className="px-6 py-20 text-center">
          <div className="mx-auto max-w-2xl">
            <h2 className={`text-3xl font-extrabold ${textPrimary} sm:text-4xl`}>{title}</h2>
            {subtitle && <p className={`mt-4 text-lg ${textMuted}`}>{subtitle}</p>}
            <a
              href="#"
              className="mt-8 inline-block rounded-full border-2 px-8 py-3 text-base font-semibold transition-colors"
              style={{ borderColor: PRIMARY, color: PRIMARY }}
              onMouseEnter={(e) => {
                const el = e.currentTarget as HTMLAnchorElement;
                el.style.backgroundColor = PRIMARY;
                el.style.color = 'white';
              }}
              onMouseLeave={(e) => {
                const el = e.currentTarget as HTMLAnchorElement;
                el.style.backgroundColor = 'transparent';
                el.style.color = PRIMARY;
              }}
            >
              {buttonText}
            </a>
          </div>
        </section>
      );

    case 'centered':
    default:
      return (
        <section className="px-6 py-24 sm:py-32">
          <div
            className="mx-auto max-w-4xl rounded-3xl px-10 py-16 text-center text-white shadow-xl"
            style={{ background: `linear-gradient(135deg, ${PRIMARY} 0%, ${SECONDARY} 100%)` }}
          >
            <h2 className="text-balance text-3xl font-extrabold sm:text-4xl">{title}</h2>
            {subtitle && <p className="mt-4 text-lg text-white/80">{subtitle}</p>}
            <a
              href="#"
              className="mt-8 inline-block rounded-full bg-white px-8 py-4 text-base font-semibold shadow-md transition-opacity hover:opacity-90"
              style={{ color: PRIMARY }}
            >
              {buttonText}
            </a>
          </div>
        </section>
      );
  }
}
