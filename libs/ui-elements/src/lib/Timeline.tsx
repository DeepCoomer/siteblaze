import React from 'react';
import { isDark, sectionAltBg } from './theme.js';
import type { Theme } from './theme.js';

const PRIMARY = 'var(--color-primary)';

interface TimelineItem { year: string; title: string; description: string; tag?: string }

export interface TimelineProps {
  content: { title?: string; items: TimelineItem[] };
  variant: 'vertical' | 'horizontal' | 'minimal';
  theme: Theme;
}

export function Timeline({ content, variant, theme }: TimelineProps) {
  const { title, items } = content;
  const dark = isDark(theme.themeMode);
  const textPrimary = dark ? 'text-white'   : 'text-gray-900';
  const textMuted   = dark ? 'text-gray-400' : 'text-gray-500';
  const cardBg      = dark ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-100';
  const line        = dark ? 'bg-gray-700'   : 'bg-gray-200';
  const altBg       = sectionAltBg(theme.themeMode);

  const sectionTitle = title && (
    <h2 className={`mb-16 text-center text-3xl font-extrabold ${textPrimary} sm:text-4xl`}>{title}</h2>
  );

  switch (variant) {

    case 'horizontal':
      return (
        <section className={`px-6 py-24 ${altBg} sm:py-32`}>
          <div className="mx-auto max-w-6xl">
            {sectionTitle}
            <div className="relative">
              <div className={`absolute top-5 left-0 right-0 h-0.5 ${line}`} />
              <ol className="grid grid-cols-2 gap-8 sm:grid-cols-3 lg:grid-cols-4">
                {items.map((item, i) => (
                  <li key={i} className="relative pt-10">
                    <div
                      className="absolute top-3.5 left-0 h-3 w-3 -translate-y-1/2 rounded-full ring-4"
                      style={{ backgroundColor: PRIMARY, '--tw-ring-color': `${PRIMARY}40` } as React.CSSProperties}
                    />
                    <p className="text-xs font-bold uppercase tracking-widest" style={{ color: PRIMARY }}>{item.year}</p>
                    <h3 className={`mt-1 text-sm font-bold ${textPrimary}`}>{item.title}</h3>
                    <p className={`mt-1 text-xs leading-relaxed ${textMuted}`}>{item.description}</p>
                  </li>
                ))}
              </ol>
            </div>
          </div>
        </section>
      );

    case 'minimal':
      return (
        <section className="px-6 py-20">
          <div className="mx-auto max-w-2xl">
            {sectionTitle}
            <ol className="space-y-6">
              {items.map((item, i) => (
                <li key={i} className="flex gap-6">
                  <span className="w-14 shrink-0 pt-0.5 text-right text-xs font-bold uppercase tracking-wide" style={{ color: PRIMARY }}>
                    {item.year}
                  </span>
                  <div>
                    <h3 className={`font-semibold ${textPrimary}`}>{item.title}</h3>
                    <p className={`mt-1 text-sm ${textMuted}`}>{item.description}</p>
                  </div>
                </li>
              ))}
            </ol>
          </div>
        </section>
      );

    case 'vertical':
    default:
      return (
        <section className={`px-6 py-24 ${altBg} sm:py-32`}>
          <div className="mx-auto max-w-3xl">
            {sectionTitle}
            <ol className="relative border-l-2" style={{ borderColor: `${PRIMARY}40` }}>
              {items.map((item, i) => (
                <li key={i} className="mb-12 ml-8 last:mb-0">
                  <span
                    className="absolute -left-2.5 flex h-5 w-5 items-center justify-center rounded-full ring-8"
                    style={{ backgroundColor: PRIMARY, '--tw-ring-color': dark ? '#1f2937' : '#f9fafb' } as React.CSSProperties}
                  />
                  <div className={`rounded-xl border ${cardBg} p-6 shadow-sm`}>
                    <time className="mb-1 block text-xs font-bold uppercase tracking-widest" style={{ color: PRIMARY }}>
                      {item.year}{item.tag && <span className={`ml-3 font-normal normal-case tracking-normal ${textMuted}`}>{item.tag}</span>}
                    </time>
                    <h3 className={`text-lg font-bold ${textPrimary}`}>{item.title}</h3>
                    <p className={`mt-2 text-sm leading-relaxed ${textMuted}`}>{item.description}</p>
                  </div>
                </li>
              ))}
            </ol>
          </div>
        </section>
      );
  }
}
