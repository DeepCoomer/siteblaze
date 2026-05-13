import React from 'react';
import { isDark, sectionAltBg } from './theme.js';
import type { Theme } from './theme.js';

const PRIMARY   = 'var(--color-primary)';
const SECONDARY = 'var(--color-secondary)';

interface ResultItem { value: string; label: string }

export interface CaseStudyProps {
  content: {
    title: string;
    subtitle?: string;
    imageUrl?: string;
    problem?: string;
    solution?: string;
    results?: ResultItem[];
    tags?: string[];
    ctaText?: string;
  };
  variant: 'split' | 'stacked' | 'minimal';
  theme: Theme;
}

function CaseStudyImage({ imageUrl, title, i }: { imageUrl?: string; title: string; i?: number }) {
  const hue = ((i ?? 0) * 61 + 200) % 360;
  if (imageUrl) {
    return (
      <img
        src={imageUrl}
        alt={title}
        className="h-full w-full object-cover"
      />
    );
  }
  return (
    <div
      className="flex h-full w-full items-center justify-center"
      style={{ background: `linear-gradient(135deg, hsl(${hue},55%,45%), hsl(${hue + 40},55%,35%))` }}
      aria-hidden="true"
    >
      <span className="text-6xl opacity-20">🖼</span>
    </div>
  );
}

export function CaseStudy({ content, variant, theme }: CaseStudyProps) {
  const { title, subtitle, imageUrl, problem, solution, results, tags, ctaText } = content;
  const dark = isDark(theme.themeMode);
  const textPrimary = dark ? 'text-white'   : 'text-gray-900';
  const textMuted   = dark ? 'text-gray-400' : 'text-gray-500';
  const cardBg      = dark ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-100';
  const altBg       = sectionAltBg(theme.themeMode);
  const divider     = dark ? 'border-gray-700' : 'border-gray-100';

  const tagList = tags && tags.length > 0 && (
    <div className="flex flex-wrap gap-2">
      {tags.map((tag, i) => (
        <span
          key={i}
          className="rounded-full px-3 py-1 text-xs font-semibold text-white"
          style={{ backgroundColor: `${PRIMARY}cc` }}
        >
          {tag}
        </span>
      ))}
    </div>
  );

  const resultStats = results && results.length > 0 && (
    <div className="grid grid-cols-2 gap-4 sm:grid-cols-3">
      {results.map((r, i) => (
        <div key={i} className={`rounded-xl border ${cardBg} p-4 text-center`}>
          <p className="text-2xl font-extrabold" style={{ color: PRIMARY }}>{r.value}</p>
          <p className={`mt-1 text-xs ${textMuted}`}>{r.label}</p>
        </div>
      ))}
    </div>
  );

  const cta = ctaText && (
    <a
      href="#"
      className="inline-block rounded-full px-6 py-3 text-sm font-semibold text-white transition-opacity hover:opacity-90"
      style={{ backgroundColor: PRIMARY }}
    >
      {ctaText}
    </a>
  );

  switch (variant) {

    case 'split':
      return (
        <section className={`px-6 py-24 ${altBg} sm:py-32`}>
          <div className="mx-auto max-w-6xl">
            <div className="grid grid-cols-1 gap-12 lg:grid-cols-2 lg:items-center">
              <div className="overflow-hidden rounded-2xl shadow-xl aspect-[4/3]">
                <CaseStudyImage imageUrl={imageUrl} title={title} />
              </div>
              <div className="flex flex-col gap-6">
                {tagList}
                <div>
                  <h2 className={`text-3xl font-extrabold ${textPrimary} sm:text-4xl`}>{title}</h2>
                  {subtitle && <p className={`mt-3 text-lg ${textMuted}`}>{subtitle}</p>}
                </div>
                {problem && (
                  <div className={`border-l-4 pl-4`} style={{ borderColor: PRIMARY }}>
                    <p className={`text-xs font-bold uppercase tracking-widest mb-1`} style={{ color: PRIMARY }}>Challenge</p>
                    <p className={`text-sm leading-relaxed ${textMuted}`}>{problem}</p>
                  </div>
                )}
                {solution && (
                  <div className={`border-l-4 pl-4`} style={{ borderColor: SECONDARY }}>
                    <p className={`text-xs font-bold uppercase tracking-widest mb-1`} style={{ color: SECONDARY }}>Solution</p>
                    <p className={`text-sm leading-relaxed ${textMuted}`}>{solution}</p>
                  </div>
                )}
                {resultStats}
                {cta}
              </div>
            </div>
          </div>
        </section>
      );

    case 'minimal':
      return (
        <section className="px-6 py-20">
          <div className="mx-auto max-w-3xl">
            {tagList && <div className="mb-4">{tagList}</div>}
            <h2 className={`text-3xl font-extrabold ${textPrimary} sm:text-4xl`}>{title}</h2>
            {subtitle && <p className={`mt-3 text-lg ${textMuted}`}>{subtitle}</p>}
            {(problem || solution) && (
              <div className={`mt-8 grid grid-cols-1 gap-6 border-t pt-8 ${divider} sm:grid-cols-2`}>
                {problem && (
                  <div>
                    <p className="text-xs font-bold uppercase tracking-widest mb-2" style={{ color: PRIMARY }}>Challenge</p>
                    <p className={`text-sm leading-relaxed ${textMuted}`}>{problem}</p>
                  </div>
                )}
                {solution && (
                  <div>
                    <p className="text-xs font-bold uppercase tracking-widest mb-2" style={{ color: SECONDARY }}>Solution</p>
                    <p className={`text-sm leading-relaxed ${textMuted}`}>{solution}</p>
                  </div>
                )}
              </div>
            )}
            {results && results.length > 0 && (
              <div className={`mt-8 flex flex-wrap gap-8 border-t pt-8 ${divider}`}>
                {results.map((r, i) => (
                  <div key={i}>
                    <p className="text-3xl font-extrabold" style={{ color: PRIMARY }}>{r.value}</p>
                    <p className={`mt-1 text-sm ${textMuted}`}>{r.label}</p>
                  </div>
                ))}
              </div>
            )}
            {cta && <div className="mt-8">{cta}</div>}
          </div>
        </section>
      );

    case 'stacked':
    default:
      return (
        <section className={`px-6 py-24 ${altBg} sm:py-32`}>
          <div className="mx-auto max-w-4xl">
            <div className="overflow-hidden rounded-2xl shadow-xl aspect-video mb-10">
              <CaseStudyImage imageUrl={imageUrl} title={title} />
            </div>
            <div className="flex flex-col gap-6">
              {tagList}
              <div>
                <h2 className={`text-3xl font-extrabold ${textPrimary} sm:text-4xl`}>{title}</h2>
                {subtitle && <p className={`mt-3 text-lg ${textMuted}`}>{subtitle}</p>}
              </div>
              {(problem || solution) && (
                <div className={`grid grid-cols-1 gap-6 border-t pt-6 ${divider} sm:grid-cols-2`}>
                  {problem && (
                    <div className={`rounded-xl border ${cardBg} p-5`}>
                      <p className="text-xs font-bold uppercase tracking-widest mb-2" style={{ color: PRIMARY }}>Challenge</p>
                      <p className={`text-sm leading-relaxed ${textMuted}`}>{problem}</p>
                    </div>
                  )}
                  {solution && (
                    <div className={`rounded-xl border ${cardBg} p-5`}>
                      <p className="text-xs font-bold uppercase tracking-widest mb-2" style={{ color: SECONDARY }}>Solution</p>
                      <p className={`text-sm leading-relaxed ${textMuted}`}>{solution}</p>
                    </div>
                  )}
                </div>
              )}
              {resultStats}
              {cta}
            </div>
          </div>
        </section>
      );
  }
}
