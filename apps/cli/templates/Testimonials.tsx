import { isDark, sectionAltBg } from './theme.js';
import type { Theme } from './theme.js';

const PRIMARY = 'var(--color-primary)';

interface TestimonialItem {
  quote: string;
  author: string;
  role?: string;
  avatarUrl?: string;
}

export interface TestimonialsProps {
  content: { title?: string; items: TestimonialItem[] };
  variant: 'grid' | 'carousel' | 'minimal';
  theme: Theme;
}

function Avatar({ item }: { item: TestimonialItem }) {
  if (item.avatarUrl) {
    return (
      <img src={item.avatarUrl} alt={item.author} className="h-10 w-10 rounded-full object-cover" />
    );
  }
  return (
    <div
      className="flex h-10 w-10 items-center justify-center rounded-full text-sm font-bold text-white"
      style={{ backgroundColor: PRIMARY }}
    >
      {item.author.charAt(0).toUpperCase()}
    </div>
  );
}

export function Testimonials({ content, variant, theme }: TestimonialsProps) {
  const { title, items } = content;
  const dark = isDark(theme.themeMode);

  const textPrimary = dark ? 'text-white'    : 'text-gray-900';
  const textMuted   = dark ? 'text-gray-300'  : 'text-gray-600';
  const cardBg      = dark ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-100';
  const quoteMark   = dark ? 'text-gray-600'  : 'text-gray-200';
  const dividerColor = dark ? '#374151' : '#f3f4f6';
  const altBg       = sectionAltBg(theme.themeMode);

  const sectionTitle = title && (
    <h2 className={`mb-12 text-center text-3xl font-extrabold ${textPrimary} sm:text-4xl`}>
      {title}
    </h2>
  );

  switch (variant) {

    case 'minimal':
      return (
        <section className="px-6 py-24 sm:py-32">
          <div className="mx-auto max-w-3xl space-y-12">
            {sectionTitle}
            {items.map((item, i) => (
              <blockquote key={i} className="border-l-4 pl-6" style={{ borderColor: PRIMARY }}>
                <p className={`text-xl italic ${textMuted}`}>"{item.quote}"</p>
                <footer className={`mt-3 text-sm font-semibold ${textPrimary}`}>
                  {item.author}
                  {item.role && <span className={`ml-2 font-normal ${textMuted}`}>— {item.role}</span>}
                </footer>
              </blockquote>
            ))}
          </div>
        </section>
      );

    case 'carousel':
      return (
        <section className={`px-6 py-24 ${altBg} sm:py-32`}>
          <div className="mx-auto max-w-6xl">
            {sectionTitle}
            <div className="flex snap-x snap-mandatory gap-6 overflow-x-auto pb-4">
              {items.map((item, i) => (
                <div
                  key={i}
                  className={`min-w-[320px] max-w-sm shrink-0 snap-start rounded-2xl border ${cardBg} p-8 shadow-sm`}
                >
                  <p className={`text-4xl font-serif leading-none ${quoteMark}`}>"</p>
                  <p className={`mt-2 text-base leading-relaxed ${textMuted}`}>{item.quote}</p>
                  <div className="mt-6 flex items-center gap-3">
                    <Avatar item={item} />
                    <div>
                      <p className={`text-sm font-semibold ${textPrimary}`}>{item.author}</p>
                      {item.role && <p className={`text-xs ${textMuted}`}>{item.role}</p>}
                    </div>
                  </div>
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
            <ul className="grid grid-cols-1 gap-8 sm:grid-cols-2 lg:grid-cols-3">
              {items.map((item, i) => (
                <li key={i} className={`flex flex-col gap-4 rounded-2xl border ${cardBg} p-8 shadow-sm`}>
                  <span className={`text-5xl font-serif leading-none ${quoteMark}`} aria-hidden="true">"</span>
                  <p className={`flex-1 text-base leading-relaxed ${textMuted}`}>{item.quote}</p>
                  <div
                    className="flex items-center gap-3 border-t pt-4"
                    style={{ borderColor: dividerColor }}
                  >
                    <Avatar item={item} />
                    <div>
                      <p className={`text-sm font-semibold ${textPrimary}`}>{item.author}</p>
                      {item.role && <p className={`text-xs ${textMuted}`}>{item.role}</p>}
                    </div>
                  </div>
                </li>
              ))}
            </ul>
          </div>
        </section>
      );
  }
}
