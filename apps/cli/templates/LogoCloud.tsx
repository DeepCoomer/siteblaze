import { isDark, sectionAltBg } from './theme.js';
import type { Theme } from './theme.js';

const PRIMARY = 'var(--color-primary)';

interface LogoItem { name: string; logoUrl?: string }

export interface LogoCloudProps {
  content: { title?: string; items: LogoItem[] };
  variant: 'row' | 'grid' | 'minimal';
  theme: Theme;
}

function Logo({ item, dark }: { item: LogoItem; dark: boolean }) {
  const border = dark ? 'border-gray-700' : 'border-gray-200';
  const bg     = dark ? 'bg-gray-800'     : 'bg-white';
  const text   = dark ? 'text-gray-300'   : 'text-gray-500';

  if (item.logoUrl) {
    return (
      <div className={`flex h-14 items-center justify-center rounded-xl border ${border} ${bg} px-6 py-3`}>
        <img src={item.logoUrl} alt={item.name} className="h-8 w-auto object-contain opacity-70 grayscale" />
      </div>
    );
  }
  return (
    <div className={`flex h-14 min-w-[120px] items-center justify-center rounded-xl border ${border} ${bg} px-6 py-3`}>
      <span className={`text-sm font-semibold tracking-wide ${text}`}>{item.name}</span>
    </div>
  );
}

export function LogoCloud({ content, variant, theme }: LogoCloudProps) {
  const { title, items } = content;
  const dark = isDark(theme.themeMode);
  const textPrimary = dark ? 'text-white'   : 'text-gray-900';
  const textMuted   = dark ? 'text-gray-400' : 'text-gray-500';
  const altBg       = sectionAltBg(theme.themeMode);

  const heading = title ?? 'Trusted by leading companies';

  switch (variant) {

    case 'grid':
      return (
        <section className={`px-6 py-20 ${altBg}`}>
          <div className="mx-auto max-w-5xl">
            <h2 className={`mb-10 text-center text-2xl font-bold ${textPrimary}`}>{heading}</h2>
            <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
              {items.map((item, i) => <Logo key={i} item={item} dark={dark} />)}
            </div>
          </div>
        </section>
      );

    case 'minimal':
      return (
        <section className="px-6 py-12">
          <div className="mx-auto max-w-5xl">
            <p className={`mb-6 text-center text-xs font-semibold uppercase tracking-widest ${textMuted}`}>{heading}</p>
            <div className="flex flex-wrap items-center justify-center gap-x-10 gap-y-4">
              {items.map((item, i) => (
                <span key={i} className={`text-sm font-semibold ${textMuted} opacity-60`}>{item.name}</span>
              ))}
            </div>
          </div>
        </section>
      );

    case 'row':
    default:
      return (
        <section className={`px-6 py-16 ${altBg}`}>
          <div className="mx-auto max-w-5xl">
            <p className={`mb-8 text-center text-sm font-semibold uppercase tracking-widest ${textMuted}`}
               style={{ color: PRIMARY }}>{heading}</p>
            <div className="flex flex-wrap items-center justify-center gap-4">
              {items.map((item, i) => <Logo key={i} item={item} dark={dark} />)}
            </div>
          </div>
        </section>
      );
  }
}
