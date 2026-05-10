import { useState } from 'react';
import { isDark, sectionAltBg } from './theme.js';
import type { Theme } from './theme.js';

const PRIMARY = 'var(--color-primary)';

interface FAQItem { question: string; answer: string }

export interface FAQProps {
  content: { title?: string; items: FAQItem[] };
  variant: 'accordion' | 'grid' | 'minimal';
  theme: Theme;
}

function AccordionItem({ item, dark }: { item: FAQItem; dark: boolean }) {
  const [open, setOpen] = useState(false);
  const textPrimary = dark ? 'text-white' : 'text-gray-900';
  const textMuted   = dark ? 'text-gray-300' : 'text-gray-600';
  const border      = dark ? 'border-gray-700' : 'border-gray-200';

  return (
    <div className={`border-b ${border}`}>
      <button
        onClick={() => setOpen(!open)}
        className={`flex w-full items-center justify-between py-5 text-left text-base font-semibold ${textPrimary}`}
      >
        <span>{item.question}</span>
        <span
          className="ml-4 shrink-0 text-2xl font-light transition-transform duration-200"
          style={{ color: PRIMARY, transform: open ? 'rotate(45deg)' : 'none' }}
          aria-hidden="true"
        >+</span>
      </button>
      {open && (
        <p className={`pb-5 text-sm leading-relaxed ${textMuted}`}>{item.answer}</p>
      )}
    </div>
  );
}

export function FAQ({ content, variant, theme }: FAQProps) {
  const { title, items } = content;
  const dark = isDark(theme.themeMode);

  const textPrimary = dark ? 'text-white'   : 'text-gray-900';
  const textMuted   = dark ? 'text-gray-300' : 'text-gray-600';
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
            <ul className="grid grid-cols-1 gap-6 sm:grid-cols-2">
              {items.map((item, i) => (
                <li key={i} className={`rounded-2xl border ${cardBg} p-7 shadow-sm`}>
                  <h3
                    className={`text-sm font-semibold ${textPrimary}`}
                    style={{ borderLeft: `3px solid ${PRIMARY}`, paddingLeft: '12px' }}
                  >
                    {item.question}
                  </h3>
                  <p className={`mt-3 text-sm leading-relaxed ${textMuted}`}>{item.answer}</p>
                </li>
              ))}
            </ul>
          </div>
        </section>
      );

    case 'minimal':
      return (
        <section className="px-6 py-24 sm:py-32">
          <div className="mx-auto max-w-3xl space-y-8">
            {sectionTitle}
            {items.map((item, i) => (
              <div key={i}>
                <h3 className={`text-base font-semibold ${textPrimary}`}>{item.question}</h3>
                <p className={`mt-2 text-sm leading-relaxed ${textMuted}`}>{item.answer}</p>
              </div>
            ))}
          </div>
        </section>
      );

    case 'accordion':
    default:
      return (
        <section className={`px-6 py-24 ${altBg} sm:py-32`}>
          <div className="mx-auto max-w-3xl">
            {sectionTitle}
            {items.map((item, i) => (
              <AccordionItem key={i} item={item} dark={dark} />
            ))}
          </div>
        </section>
      );
  }
}
