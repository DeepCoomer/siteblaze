import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { isDark, sectionAltBg } from '../theme.js';
import type { Theme } from '../theme.js';

const PRIMARY = 'var(--color-primary)';

interface PortfolioItem { title: string; description: string; tags: string[]; imageUrl?: string }

export interface PortfolioGridProps {
  content: { title?: string; items: PortfolioItem[] };
  variant: 'grid' | 'list' | 'minimal';
  theme: Theme;
}

function Placeholder({ title, i }: { title: string; i: number }) {
  const hue = (i * 47) % 360;
  return (
    <div
      className="flex h-48 w-full items-center justify-center text-4xl text-white/30 select-none"
      style={{ background: `linear-gradient(135deg, hsl(${hue},60%,50%), hsl(${hue + 40},60%,40%))` }}
      aria-hidden="true"
    >
      {title.slice(0, 1).toUpperCase()}
    </div>
  );
}

function Tags({ tags }: { tags: string[] }) {
  return (
    <div className="mt-3 flex flex-wrap gap-2">
      {tags.map((tag, j) => (
        <Badge key={j} variant="secondary" className="rounded-full text-xs">{tag}</Badge>
      ))}
    </div>
  );
}

export function PortfolioGrid({ content, variant, theme }: PortfolioGridProps) {
  const { title, items } = content;
  const dark = isDark(theme.themeMode);
  const textPrimary = dark ? 'text-white'   : 'text-gray-900';
  const textMuted   = dark ? 'text-gray-400' : 'text-gray-500';
  const altBg       = sectionAltBg(theme.themeMode);

  const sectionTitle = title && (
    <h2 className={`mb-12 text-center text-3xl font-extrabold ${textPrimary} sm:text-4xl`}>{title}</h2>
  );

  switch (variant) {

    case 'list':
      return (
        <section className={`px-6 py-24 ${altBg} sm:py-32`}>
          <div className="mx-auto max-w-4xl">
            {sectionTitle}
            <ul className="space-y-8">
              {items.map((item, i) => (
                <li key={i}>
                  <Card className="flex flex-col overflow-hidden shadow-sm sm:flex-row">
                    <div className="sm:w-64 sm:shrink-0">
                      {item.imageUrl
                        ? <img src={item.imageUrl} alt={item.title} className="h-full w-full object-cover" />
                        : <Placeholder title={item.title} i={i} />}
                    </div>
                    <CardContent className="flex flex-col justify-center p-6 sm:pl-0">
                      <h3 className={`text-xl font-bold ${textPrimary}`}>{item.title}</h3>
                      <p className={`mt-2 text-sm leading-relaxed ${textMuted}`}>{item.description}</p>
                      <Tags tags={item.tags} />
                      <a href="#" className="mt-4 text-sm font-semibold hover:underline" style={{ color: PRIMARY }}>
                        View project →
                      </a>
                    </CardContent>
                  </Card>
                </li>
              ))}
            </ul>
          </div>
        </section>
      );

    case 'minimal':
      return (
        <section className="px-6 py-20">
          <div className="mx-auto max-w-4xl">
            {sectionTitle}
            <ul className="divide-y" style={{ borderColor: dark ? '#374151' : '#e5e7eb' }}>
              {items.map((item, i) => (
                <li key={i} className="flex items-start justify-between gap-8 py-8">
                  <div>
                    <h3 className={`text-lg font-bold ${textPrimary}`}>{item.title}</h3>
                    <p className={`mt-1 text-sm ${textMuted}`}>{item.description}</p>
                    <Tags tags={item.tags} />
                  </div>
                  <a href="#" className="shrink-0 text-sm font-semibold hover:underline" style={{ color: PRIMARY }}>
                    View →
                  </a>
                </li>
              ))}
            </ul>
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
                <li key={i}>
                  <Card className="group h-full overflow-hidden shadow-md transition-shadow hover:shadow-xl">
                    <div className="overflow-hidden">
                      {item.imageUrl
                        ? <img src={item.imageUrl} alt={item.title} className="h-48 w-full object-cover transition-transform duration-300 group-hover:scale-105" />
                        : <Placeholder title={item.title} i={i} />}
                    </div>
                    <CardContent className="p-6">
                      <h3 className={`text-lg font-bold ${textPrimary}`}>{item.title}</h3>
                      <p className={`mt-2 text-sm leading-relaxed ${textMuted}`}>{item.description}</p>
                      <Tags tags={item.tags} />
                      <a href="#" className="mt-4 inline-block text-sm font-semibold hover:underline" style={{ color: PRIMARY }}>
                        View project →
                      </a>
                    </CardContent>
                  </Card>
                </li>
              ))}
            </ul>
          </div>
        </section>
      );
  }
}
