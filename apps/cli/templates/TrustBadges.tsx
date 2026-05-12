import { isDark, sectionAltBg } from './theme.js';
import type { Theme } from './theme.js';

const PRIMARY = 'var(--color-primary)';

interface BadgeItem { icon: string; title: string; description?: string }

export interface TrustBadgesProps {
  content: { items: BadgeItem[] };
  variant: 'row' | 'grid' | 'minimal';
  theme: Theme;
}

export function TrustBadges({ content, variant, theme }: TrustBadgesProps) {
  const { items } = content;
  const dark = isDark(theme.themeMode);
  const textPrimary = dark ? 'text-white'   : 'text-gray-900';
  const textMuted   = dark ? 'text-gray-400' : 'text-gray-500';
  const cardBg      = dark ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-100';
  const divider     = dark ? 'divide-gray-700' : 'divide-gray-100';
  const altBg       = sectionAltBg(theme.themeMode);

  switch (variant) {

    case 'grid':
      return (
        <section className={`px-6 py-16 ${altBg}`}>
          <div className="mx-auto max-w-5xl">
            <ul className="grid grid-cols-2 gap-6 sm:grid-cols-4">
              {items.map((item, i) => (
                <li key={i} className={`flex flex-col items-center gap-3 rounded-2xl border ${cardBg} p-6 text-center shadow-sm`}>
                  <span className="text-3xl" aria-hidden="true">{item.icon}</span>
                  <span className={`text-sm font-bold ${textPrimary}`}>{item.title}</span>
                  {item.description && <span className={`text-xs ${textMuted}`}>{item.description}</span>}
                </li>
              ))}
            </ul>
          </div>
        </section>
      );

    case 'minimal':
      return (
        <section className="px-6 py-10">
          <div className={`mx-auto max-w-5xl flex flex-wrap items-center justify-center gap-x-10 gap-y-4 divide-x ${divider}`}>
            {items.map((item, i) => (
              <div key={i} className={`flex items-center gap-2 ${i > 0 ? 'pl-10' : ''}`}>
                <span className="text-xl" aria-hidden="true">{item.icon}</span>
                <span className={`text-sm font-semibold ${textMuted}`}>{item.title}</span>
              </div>
            ))}
          </div>
        </section>
      );

    case 'row':
    default:
      return (
        <section className={`border-y px-6 py-8 ${altBg} ${dark ? 'border-gray-700' : 'border-gray-100'}`}>
          <div className="mx-auto max-w-5xl">
            <ul className="flex flex-wrap items-start justify-center gap-8 sm:gap-12">
              {items.map((item, i) => (
                <li key={i} className="flex flex-col items-center gap-2 text-center">
                  <span
                    className="flex h-12 w-12 items-center justify-center rounded-full text-2xl"
                    style={{ backgroundColor: `${PRIMARY}18` }}
                    aria-hidden="true"
                  >
                    {item.icon}
                  </span>
                  <span className={`text-sm font-bold ${textPrimary}`}>{item.title}</span>
                  {item.description && <span className={`max-w-[120px] text-xs ${textMuted}`}>{item.description}</span>}
                </li>
              ))}
            </ul>
          </div>
        </section>
      );
  }
}
