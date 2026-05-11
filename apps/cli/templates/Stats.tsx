import { isDark, sectionAltBg } from './theme.js';
import type { Theme } from './theme.js';

const PRIMARY   = 'var(--color-primary)';
const SECONDARY = 'var(--color-secondary)';

interface StatItem { value: string; label: string; description?: string }

export interface StatsProps {
  content: { title?: string; items: StatItem[] };
  variant: 'grid' | 'banner' | 'minimal';
  theme: Theme;
}

export function Stats({ content, variant, theme }: StatsProps) {
  const { title, items } = content;
  const dark = isDark(theme.themeMode);

  const textPrimary = dark ? 'text-white'   : 'text-gray-900';
  const textMuted   = dark ? 'text-gray-300' : 'text-gray-600';
  const altBg       = sectionAltBg(theme.themeMode);

  const sectionTitle = title && (
    <h2 className={`mb-12 text-center text-3xl font-extrabold ${textPrimary} sm:text-4xl`}>{title}</h2>
  );

  switch (variant) {
    case 'banner':
      return (
        <section
          className="px-6 py-16 text-white"
          style={{ background: `linear-gradient(135deg, ${PRIMARY}, ${SECONDARY})` }}
        >
          <div className="mx-auto max-w-6xl">
            {title && (
              <h2 className="mb-10 text-center text-3xl font-extrabold sm:text-4xl">{title}</h2>
            )}
            <div className="grid grid-cols-2 gap-8 text-center sm:grid-cols-4">
              {items.map((item, i) => (
                <div key={i}>
                  <div className="text-4xl font-extrabold sm:text-5xl">{item.value}</div>
                  <div className="mt-1 text-sm font-semibold opacity-90">{item.label}</div>
                  {item.description && <div className="mt-1 text-xs opacity-70">{item.description}</div>}
                </div>
              ))}
            </div>
          </div>
        </section>
      );

    case 'minimal':
      return (
        <section className="px-6 py-16">
          <div className="mx-auto max-w-4xl">
            {sectionTitle}
            <div className="grid grid-cols-2 gap-6 text-center sm:grid-cols-4">
              {items.map((item, i) => (
                <div key={i}>
                  <div className="text-3xl font-extrabold" style={{ color: PRIMARY }}>{item.value}</div>
                  <div className={`mt-1 text-sm ${textMuted}`}>{item.label}</div>
                </div>
              ))}
            </div>
          </div>
        </section>
      );

    case 'grid':
    default:
      return (
        <section className={`px-6 py-24 ${altBg} sm:py-32`}>
          <div className="mx-auto max-w-6xl">
            {sectionTitle}
            <div className="grid grid-cols-1 gap-10 text-center sm:grid-cols-2 lg:grid-cols-4">
              {items.map((item, i) => (
                <div key={i}>
                  <div className="text-5xl font-extrabold" style={{ color: PRIMARY }}>{item.value}</div>
                  <div className={`mt-2 text-base font-semibold ${textPrimary}`}>{item.label}</div>
                  {item.description && <div className={`mt-1 text-sm ${textMuted}`}>{item.description}</div>}
                </div>
              ))}
            </div>
          </div>
        </section>
      );
  }
}
