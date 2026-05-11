import React from 'react';
import { isDark, sectionAltBg } from './theme.js';
import type { Theme } from './theme.js';

const PRIMARY   = 'var(--color-primary)';
const SECONDARY = 'var(--color-secondary)';

export interface NewsletterProps {
  content: { title: string; subtitle?: string; placeholder?: string; buttonText: string };
  variant: 'centered' | 'banner' | 'minimal';
  theme: Theme;
}

export function Newsletter({ content, variant, theme }: NewsletterProps) {
  const { title, subtitle, placeholder = 'Enter your email', buttonText } = content;
  const dark = isDark(theme.themeMode);

  const textPrimary = dark ? 'text-white'   : 'text-gray-900';
  const textMuted   = dark ? 'text-gray-300' : 'text-gray-600';
  const inputBg     = dark
    ? 'bg-gray-800 border-gray-600 text-white placeholder-gray-400'
    : 'bg-white border-gray-300 text-gray-900 placeholder-gray-400';
  const altBg = sectionAltBg(theme.themeMode);

  const standardForm = (
    <form
      className="flex w-full max-w-md flex-col gap-3 sm:flex-row"
      onSubmit={(e) => e.preventDefault()}
    >
      <input
        type="email"
        placeholder={placeholder}
        className={`flex-1 rounded-lg border px-4 py-3 text-sm outline-none focus:ring-2 ${inputBg}`}
        style={{ '--tw-ring-color': PRIMARY } as React.CSSProperties}
      />
      <button
        type="submit"
        className="rounded-lg px-6 py-3 text-sm font-semibold text-white transition-opacity hover:opacity-90"
        style={{ backgroundColor: PRIMARY }}
      >
        {buttonText}
      </button>
    </form>
  );

  switch (variant) {
    case 'banner':
      return (
        <section
          className="px-6 py-16 text-white"
          style={{ background: `linear-gradient(135deg, ${PRIMARY}, ${SECONDARY})` }}
        >
          <div className="mx-auto flex max-w-5xl flex-col items-center gap-6 sm:flex-row sm:gap-10">
            <div className="flex-1 text-center sm:text-left">
              <h2 className="text-2xl font-extrabold sm:text-3xl">{title}</h2>
              {subtitle && <p className="mt-1 text-sm opacity-80">{subtitle}</p>}
            </div>
            <form
              className="flex w-full max-w-sm flex-col gap-3 sm:flex-row"
              onSubmit={(e) => e.preventDefault()}
            >
              <input
                type="email"
                placeholder={placeholder}
                className="flex-1 rounded-lg border border-white/30 bg-white/20 px-4 py-3 text-sm text-white placeholder-white/70 outline-none"
              />
              <button
                type="submit"
                className="rounded-lg bg-white px-5 py-3 text-sm font-semibold transition-opacity hover:opacity-90"
                style={{ color: PRIMARY }}
              >
                {buttonText}
              </button>
            </form>
          </div>
        </section>
      );

    case 'minimal':
      return (
        <section className="px-6 py-16">
          <div className="mx-auto max-w-xl text-center">
            <h2 className={`text-2xl font-bold ${textPrimary}`}>{title}</h2>
            {subtitle && <p className={`mt-2 text-sm ${textMuted}`}>{subtitle}</p>}
            <div className="mt-6 flex justify-center">{standardForm}</div>
          </div>
        </section>
      );

    case 'centered':
    default:
      return (
        <section className={`px-6 py-24 ${altBg} sm:py-32`}>
          <div className="mx-auto max-w-2xl text-center">
            <h2 className={`text-3xl font-extrabold ${textPrimary} sm:text-4xl`}>{title}</h2>
            {subtitle && <p className={`mt-4 text-lg ${textMuted}`}>{subtitle}</p>}
            <div className="mt-8 flex justify-center">{standardForm}</div>
          </div>
        </section>
      );
  }
}
