import { isDark, sectionAltBg } from './theme.js';
import type { Theme } from './theme.js';

const PRIMARY   = 'var(--color-primary)';
const SECONDARY = 'var(--color-secondary)';

interface SkillItem { name: string; level?: number; icon?: string; category?: string }

export interface SkillsProps {
  content: { title?: string; items: SkillItem[] };
  variant: 'badges' | 'bars' | 'grid';
  theme: Theme;
}

const LEVEL_LABEL: Record<number, string> = { 1: 'Beginner', 2: 'Intermediate', 3: 'Advanced', 4: 'Expert', 5: 'Master' };

export function Skills({ content, variant, theme }: SkillsProps) {
  const { title, items } = content;
  const dark = isDark(theme.themeMode);
  const textPrimary = dark ? 'text-white'   : 'text-gray-900';
  const textMuted   = dark ? 'text-gray-400' : 'text-gray-500';
  const cardBg      = dark ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-100';
  const altBg       = sectionAltBg(theme.themeMode);

  const sectionTitle = title && (
    <h2 className={`mb-12 text-center text-3xl font-extrabold ${textPrimary} sm:text-4xl`}>{title}</h2>
  );

  switch (variant) {

    case 'bars':
      return (
        <section className={`px-6 py-24 ${altBg} sm:py-32`}>
          <div className="mx-auto max-w-3xl">
            {sectionTitle}
            <ul className="space-y-6">
              {items.map((item, i) => {
                const pct = ((item.level ?? 3) / 5) * 100;
                return (
                  <li key={i}>
                    <div className="mb-2 flex items-center justify-between">
                      <span className={`flex items-center gap-2 font-semibold ${textPrimary}`}>
                        {item.icon && <span aria-hidden="true">{item.icon}</span>}
                        {item.name}
                      </span>
                      <span className={`text-xs ${textMuted}`}>{LEVEL_LABEL[item.level ?? 3]}</span>
                    </div>
                    <div className={`h-2 w-full overflow-hidden rounded-full ${dark ? 'bg-gray-700' : 'bg-gray-200'}`}>
                      <div
                        className="h-2 rounded-full transition-all duration-700"
                        style={{ width: `${pct}%`, background: `linear-gradient(90deg, ${PRIMARY}, ${SECONDARY})` }}
                      />
                    </div>
                  </li>
                );
              })}
            </ul>
          </div>
        </section>
      );

    case 'grid':
      return (
        <section className={`px-6 py-24 ${altBg} sm:py-32`}>
          <div className="mx-auto max-w-5xl">
            {sectionTitle}
            <ul className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
              {items.map((item, i) => (
                <li key={i} className={`flex flex-col items-center gap-3 rounded-2xl border ${cardBg} p-6 shadow-sm`}>
                  {item.icon && <span className="text-3xl" aria-hidden="true">{item.icon}</span>}
                  <span className={`text-sm font-semibold ${textPrimary}`}>{item.name}</span>
                  {item.category && (
                    <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${textMuted} ${dark ? 'bg-gray-700' : 'bg-gray-100'}`}>
                      {item.category}
                    </span>
                  )}
                </li>
              ))}
            </ul>
          </div>
        </section>
      );

    case 'badges':
    default:
      return (
        <section className={`px-6 py-20 ${altBg}`}>
          <div className="mx-auto max-w-4xl text-center">
            {sectionTitle}
            <div className="flex flex-wrap justify-center gap-3">
              {items.map((item, i) => (
                <span
                  key={i}
                  className={`inline-flex items-center gap-2 rounded-full border px-4 py-2 text-sm font-semibold shadow-sm ${cardBg} ${textPrimary}`}
                >
                  {item.icon && <span aria-hidden="true">{item.icon}</span>}
                  {item.name}
                </span>
              ))}
            </div>
          </div>
        </section>
      );
  }
}
