import { isDark, sectionAltBg } from './theme.js';
import type { Theme } from './theme.js';

const PRIMARY = 'var(--color-primary)';

interface ScheduleItem {
  time: string;
  title: string;
  description?: string;
  speaker?: string;
  location?: string;
}

export interface ScheduleProps {
  content: { title?: string; items: ScheduleItem[] };
  variant: 'timeline' | 'grid' | 'minimal';
  theme: Theme;
}

export function Schedule({ content, variant, theme }: ScheduleProps) {
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

    case 'grid':
      return (
        <section className={`px-6 py-24 ${altBg} sm:py-32`}>
          <div className="mx-auto max-w-6xl">
            {sectionTitle}
            <ul className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {items.map((item, i) => (
                <li key={i} className={`rounded-2xl border ${cardBg} p-6 shadow-sm`}>
                  <span
                    className="inline-block rounded-full px-3 py-1 text-xs font-bold text-white"
                    style={{ backgroundColor: PRIMARY }}
                  >
                    {item.time}
                  </span>
                  <h3 className={`mt-3 text-lg font-bold ${textPrimary}`}>{item.title}</h3>
                  {item.description && <p className={`mt-1 text-sm ${textMuted}`}>{item.description}</p>}
                  <div className={`mt-3 flex flex-wrap gap-3 text-xs ${textMuted}`}>
                    {item.speaker && <span>🎤 {item.speaker}</span>}
                    {item.location && <span>📍 {item.location}</span>}
                  </div>
                </li>
              ))}
            </ul>
          </div>
        </section>
      );

    case 'minimal':
      return (
        <section className="px-6 py-20">
          <div className="mx-auto max-w-3xl">
            {sectionTitle}
            <ol className="space-y-4">
              {items.map((item, i) => (
                <li key={i} className={`flex gap-6 border-b pb-4 ${dark ? 'border-gray-700' : 'border-gray-100'} last:border-0`}>
                  <span className="w-20 shrink-0 pt-0.5 text-right text-xs font-bold uppercase tracking-wide" style={{ color: PRIMARY }}>
                    {item.time}
                  </span>
                  <div>
                    <h3 className={`font-semibold ${textPrimary}`}>{item.title}</h3>
                    {item.speaker && <p className={`text-xs ${textMuted}`}>🎤 {item.speaker}</p>}
                  </div>
                </li>
              ))}
            </ol>
          </div>
        </section>
      );

    case 'timeline':
    default:
      return (
        <section className={`px-6 py-24 ${altBg} sm:py-32`}>
          <div className="mx-auto max-w-3xl">
            {sectionTitle}
            <ol className="relative border-l-2" style={{ borderColor: `${PRIMARY}40` }}>
              {items.map((item, i) => (
                <li key={i} className="mb-10 ml-8 last:mb-0">
                  <span
                    className="absolute -left-2.5 flex h-5 w-5 items-center justify-center rounded-full ring-8 text-[10px] font-bold text-white"
                    style={{ backgroundColor: PRIMARY }}
                  >
                    {i + 1}
                  </span>
                  <div className={`rounded-xl border ${cardBg} p-5 shadow-sm`}>
                    <time
                      className="mb-1 inline-block rounded-full px-3 py-0.5 text-xs font-bold text-white"
                      style={{ backgroundColor: PRIMARY }}
                    >
                      {item.time}
                    </time>
                    <h3 className={`mt-2 text-lg font-bold ${textPrimary}`}>{item.title}</h3>
                    {item.description && (
                      <p className={`mt-1 text-sm leading-relaxed ${textMuted}`}>{item.description}</p>
                    )}
                    <div className={`mt-3 flex flex-wrap gap-4 text-xs font-medium ${textMuted}`}>
                      {item.speaker && (
                        <span className="flex items-center gap-1">
                          <span>🎤</span>{item.speaker}
                        </span>
                      )}
                      {item.location && (
                        <span className="flex items-center gap-1">
                          <span>📍</span>{item.location}
                        </span>
                      )}
                    </div>
                  </div>
                </li>
              ))}
            </ol>
          </div>
        </section>
      );
  }
}
