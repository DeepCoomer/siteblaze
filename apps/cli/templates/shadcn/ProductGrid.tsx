import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { isDark, sectionAltBg } from '../theme.js';
import type { Theme } from '../theme.js';

const PRIMARY = 'var(--color-primary)';

interface ProductItem {
  name: string;
  price: string;
  description?: string;
  imageUrl?: string;
  badge?: string;
}

export interface ProductGridProps {
  content: { title?: string; items: ProductItem[] };
  variant: 'grid' | 'list' | 'featured';
  theme: Theme;
}

function ProductImage({ item, i }: { item: ProductItem; i: number }) {
  const hue = (i * 61) % 360;
  if (item.imageUrl) {
    return (
      <img
        src={item.imageUrl}
        alt={item.name}
        className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
      />
    );
  }
  return (
    <div
      className="flex h-full w-full items-center justify-center text-4xl text-white/20 select-none"
      style={{ background: `linear-gradient(135deg, hsl(${hue},55%,50%), hsl(${hue + 40},55%,40%))` }}
      aria-hidden="true"
    >
      🛍
    </div>
  );
}

function ProductBadgeLabel({ label }: { label: string }) {
  return (
    <Badge
      className="absolute left-3 top-3 rounded-full px-3 py-1 text-xs font-bold text-white shadow"
      style={{ backgroundColor: PRIMARY, borderColor: PRIMARY }}
    >
      {label}
    </Badge>
  );
}

export function ProductGrid({ content, variant, theme }: ProductGridProps) {
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
            <ul className="space-y-6">
              {items.map((item, i) => (
                <li key={i}>
                  <Card className="group flex overflow-hidden shadow-sm">
                    <div className="relative h-40 w-40 shrink-0 overflow-hidden">
                      <ProductImage item={item} i={i} />
                      {item.badge && <ProductBadgeLabel label={item.badge} />}
                    </div>
                    <CardContent className="flex flex-col justify-center py-4 pr-6 pl-4">
                      <h3 className={`text-lg font-bold ${textPrimary}`}>{item.name}</h3>
                      {item.description && <p className={`mt-1 text-sm ${textMuted}`}>{item.description}</p>}
                      <div className="mt-3 flex items-center gap-4">
                        <span className="text-xl font-extrabold" style={{ color: PRIMARY }}>{item.price}</span>
                        <Button
                          className="rounded-full px-5 py-1.5 text-sm font-semibold text-white hover:opacity-90"
                          style={{ backgroundColor: PRIMARY }}
                          onClick={e => e.preventDefault()}
                        >
                          Add to Cart
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                </li>
              ))}
            </ul>
          </div>
        </section>
      );

    case 'featured': {
      const [first, ...rest] = items;
      return (
        <section className={`px-6 py-24 ${altBg} sm:py-32`}>
          <div className="mx-auto max-w-6xl">
            {sectionTitle}
            <div className="grid grid-cols-1 gap-8 lg:grid-cols-2">
              {first && (
                <Card className="group relative overflow-hidden shadow-xl">
                  <div className="relative h-72 overflow-hidden">
                    <ProductImage item={first} i={0} />
                    {first.badge && <ProductBadgeLabel label={first.badge} />}
                  </div>
                  <CardContent className="p-8">
                    <h3 className={`text-2xl font-extrabold ${textPrimary}`}>{first.name}</h3>
                    {first.description && <p className={`mt-2 ${textMuted}`}>{first.description}</p>}
                    <div className="mt-4 flex items-center justify-between">
                      <span className="text-3xl font-extrabold" style={{ color: PRIMARY }}>{first.price}</span>
                    </div>
                    <Button
                      className="mt-4 w-full rounded-full py-2.5 text-sm font-semibold text-white hover:opacity-90"
                      style={{ backgroundColor: PRIMARY }}
                      onClick={e => e.preventDefault()}
                    >
                      Add to Cart
                    </Button>
                  </CardContent>
                </Card>
              )}
              <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
                {rest.slice(0, 4).map((item, i) => (
                  <Card key={i} className="group relative overflow-hidden shadow-md">
                    <div className="relative h-36 overflow-hidden">
                      <ProductImage item={item} i={i + 1} />
                      {item.badge && <ProductBadgeLabel label={item.badge} />}
                    </div>
                    <CardContent className="p-4">
                      <h3 className={`font-bold ${textPrimary}`}>{item.name}</h3>
                      <span className="mt-1 block font-extrabold" style={{ color: PRIMARY }}>{item.price}</span>
                      <Button
                        className="mt-2 w-full rounded-full py-2 text-sm font-semibold text-white hover:opacity-90"
                        style={{ backgroundColor: PRIMARY }}
                        onClick={e => e.preventDefault()}
                      >
                        Add to Cart
                      </Button>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          </div>
        </section>
      );
    }

    case 'grid':
    default:
      return (
        <section className={`px-6 py-24 ${altBg} sm:py-32`}>
          <div className="mx-auto max-w-6xl">
            {sectionTitle}
            <ul className="grid grid-cols-2 gap-6 sm:grid-cols-3 lg:grid-cols-4">
              {items.map((item, i) => (
                <li key={i}>
                  <Card className="group relative h-full overflow-hidden shadow-md transition-shadow hover:shadow-xl">
                    <div className="relative h-52 overflow-hidden">
                      <ProductImage item={item} i={i} />
                      {item.badge && <ProductBadgeLabel label={item.badge} />}
                    </div>
                    <CardContent className="p-4">
                      <h3 className={`font-semibold ${textPrimary}`}>{item.name}</h3>
                      {item.description && <p className={`mt-1 text-xs ${textMuted} line-clamp-2`}>{item.description}</p>}
                      <span className="mt-2 block font-extrabold" style={{ color: PRIMARY }}>{item.price}</span>
                      <Button
                        className="mt-2 w-full rounded-full py-2 text-sm font-semibold text-white hover:opacity-90"
                        style={{ backgroundColor: PRIMARY }}
                        onClick={e => e.preventDefault()}
                      >
                        Add to Cart
                      </Button>
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
