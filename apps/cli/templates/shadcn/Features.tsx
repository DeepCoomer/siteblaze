import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { isDark, sectionAltBg } from '../theme.js';
import type { Theme } from '../theme.js';

const PRIMARY   = 'var(--color-primary)';
const SECONDARY = 'var(--color-secondary)';

interface Item { icon: string; title: string; description: string }

export interface FeaturesProps {
  content: { title?: string; items: Item[] };
  variant: 'grid' | 'list' | 'cards';
  theme: Theme;
}

function ItemIcon({ icon }: { icon: string }) {
  return (
    <span
      className="flex h-12 w-12 items-center justify-center rounded-xl text-2xl text-white"
      style={{ backgroundColor: PRIMARY }}
      aria-hidden="true"
    >
      {icon}
    </span>
  );
}

export function Features({ content, variant, theme }: FeaturesProps) {
  const { title, items } = content;
  const dark = isDark(theme.themeMode);

  const textPrimary = dark ? 'text-white'   : 'text-gray-900';
  const textMuted   = dark ? 'text-gray-300' : 'text-gray-600';
  const altBg       = sectionAltBg(theme.themeMode);

  const sectionTitle = title && (
    <h2 className={`mb-12 text-center text-3xl font-extrabold ${textPrimary} sm:text-4xl`}>
      {title}
    </h2>
  );

  switch (variant) {

    case 'list':
      return (
        <section className={`px-6 py-24 ${altBg} sm:py-32`}>
          <div className="mx-auto max-w-3xl">
            {sectionTitle}
            <ul className="space-y-8">
              {items.map((item, i) => (
                <li key={i} className="flex gap-6">
                  <div className="mt-1 shrink-0"><ItemIcon icon={item.icon} /></div>
                  <div>
                    <h3 className={`text-lg font-semibold ${textPrimary}`}>{item.title}</h3>
                    <p className={`mt-1 text-sm leading-relaxed ${textMuted}`}>{item.description}</p>
                  </div>
                </li>
              ))}
            </ul>
          </div>
        </section>
      );

    case 'cards':
      return (
        <section className={`px-6 py-24 ${altBg} sm:py-32`}>
          <div className="mx-auto max-w-6xl">
            {sectionTitle}
            <ul className="grid grid-cols-1 gap-8 sm:grid-cols-2 lg:grid-cols-3">
              {items.map((item, i) => (
                <li key={i}>
                  <Card className="group flex h-full flex-col gap-4 p-8 shadow-md transition-shadow hover:shadow-xl">
                    <ItemIcon icon={item.icon} />
                    <CardHeader className="p-0">
                      <CardTitle className={`text-lg ${textPrimary}`}>{item.title}</CardTitle>
                    </CardHeader>
                    <CardContent className="p-0">
                      <p className={`text-sm leading-relaxed ${textMuted}`}>{item.description}</p>
                    </CardContent>
                    <div
                      className="mt-auto h-0.5 w-0 rounded-full transition-all duration-300 group-hover:w-full"
                      style={{ backgroundColor: SECONDARY }}
                    />
                  </Card>
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
            <ul className="grid grid-cols-1 gap-10 sm:grid-cols-2 lg:grid-cols-3">
              {items.map((item, i) => (
                <li key={i}>
                  <Card className="flex h-full flex-col gap-4 p-8 shadow-sm">
                    <ItemIcon icon={item.icon} />
                    <CardHeader className="p-0">
                      <CardTitle className={`text-lg ${textPrimary}`}>{item.title}</CardTitle>
                    </CardHeader>
                    <CardContent className="p-0">
                      <p className={`text-sm leading-relaxed ${textMuted}`}>{item.description}</p>
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
