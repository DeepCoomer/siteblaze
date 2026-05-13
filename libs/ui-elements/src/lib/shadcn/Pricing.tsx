import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { isDark, sectionAltBg } from '../theme.js';
import type { Theme } from '../theme.js';

const PRIMARY   = 'var(--color-primary)';
const SECONDARY = 'var(--color-secondary)';
const CHECK = '✓';
const CROSS = '✗';

interface PricingTier {
  name: string;
  price: string;
  description?: string;
  features: string[];
  ctaText: string;
  highlighted?: boolean;
}

export interface PricingProps {
  content: { title?: string; tiers: PricingTier[] };
  variant: 'cards' | 'table' | 'minimal';
  theme: Theme;
}

export function Pricing({ content, variant, theme }: PricingProps) {
  const { title, tiers } = content;
  const dark = isDark(theme.themeMode);

  const textPrimary  = dark ? 'text-white'   : 'text-gray-900';
  const textMuted    = dark ? 'text-gray-300' : 'text-gray-600';
  const divider      = dark ? 'divide-gray-700' : 'divide-gray-100';
  const altBg        = sectionAltBg(theme.themeMode);

  const sectionTitle = title && (
    <h2 className={`mb-12 text-center text-3xl font-extrabold ${textPrimary} sm:text-4xl`}>
      {title}
    </h2>
  );

  switch (variant) {

    case 'minimal':
      return (
        <section className="px-6 py-24 sm:py-32">
          <div className="mx-auto max-w-2xl">
            {sectionTitle}
            <ul className={`divide-y ${divider}`}>
              {tiers.map((tier, i) => (
                <li key={i} className="flex items-center justify-between py-6">
                  <div>
                    <p className={`font-semibold ${textPrimary}`}>{tier.name}</p>
                    {tier.description && <p className={`mt-1 text-sm ${textMuted}`}>{tier.description}</p>}
                  </div>
                  <div className="text-right">
                    <p className="text-2xl font-extrabold" style={{ color: PRIMARY }}>{tier.price}</p>
                    <Button
                      variant="link"
                      className="mt-1 h-auto p-0 text-sm font-medium"
                      style={{ color: PRIMARY }}
                    >
                      {tier.ctaText}
                    </Button>
                  </div>
                </li>
              ))}
            </ul>
          </div>
        </section>
      );

    case 'table': {
      const allFeatures = Array.from(new Set(tiers.flatMap((t) => t.features)));
      return (
        <section className={`px-6 py-24 ${altBg} sm:py-32`}>
          <div className="mx-auto max-w-6xl overflow-x-auto">
            {sectionTitle}
            <table className="w-full border-collapse text-sm">
              <thead>
                <tr>
                  <th className={`py-4 pr-6 text-left font-medium ${textMuted}`}>Feature</th>
                  {tiers.map((tier, i) => (
                    <th key={i} className="px-4 py-4 text-center">
                      <div className="flex flex-col items-center gap-1">
                        {tier.highlighted
                          ? <Badge style={{ backgroundColor: PRIMARY, color: 'white', borderColor: PRIMARY }}>{tier.name}</Badge>
                          : <span className={`font-bold ${textPrimary}`}>{tier.name}</span>
                        }
                        <p className="text-lg font-extrabold" style={{ color: PRIMARY }}>{tier.price}</p>
                      </div>
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className={`divide-y ${divider}`}>
                {allFeatures.map((feature, fi) => (
                  <tr key={fi}>
                    <td className={`py-3 pr-6 ${textMuted}`}>{feature}</td>
                    {tiers.map((tier, ti) => (
                      <td key={ti} className="px-4 py-3 text-center font-bold">
                        {tier.features.includes(feature)
                          ? <span style={{ color: PRIMARY }}>{CHECK}</span>
                          : <span className={textMuted}>{CROSS}</span>}
                      </td>
                    ))}
                  </tr>
                ))}
                <tr>
                  <td />
                  {tiers.map((tier, i) => (
                    <td key={i} className="px-4 py-4 text-center">
                      <Button
                        className="rounded-full px-6 py-2 text-sm font-semibold text-white hover:opacity-90"
                        style={{ backgroundColor: tier.highlighted ? PRIMARY : SECONDARY }}
                      >
                        {tier.ctaText}
                      </Button>
                    </td>
                  ))}
                </tr>
              </tbody>
            </table>
          </div>
        </section>
      );
    }

    case 'cards':
    default:
      return (
        <section className={`px-6 py-24 ${altBg} sm:py-32`}>
          <div className="mx-auto max-w-6xl">
            {sectionTitle}
            <ul className="grid grid-cols-1 items-stretch gap-8 sm:grid-cols-2 lg:grid-cols-3">
              {tiers.map((tier, i) => (
                <li key={i} className={tier.highlighted ? 'scale-105' : ''}>
                  <Card
                    className="flex h-full flex-col p-8 shadow-sm"
                    style={tier.highlighted ? { backgroundColor: PRIMARY, borderColor: PRIMARY, color: 'white' } : {}}
                  >
                    <CardHeader className="p-0">
                      <p className={`text-sm font-semibold uppercase tracking-widest ${tier.highlighted ? 'text-white/70' : textMuted}`}>
                        {tier.name}
                      </p>
                      <CardTitle className={`mt-3 text-4xl font-extrabold ${tier.highlighted ? 'text-white' : textPrimary}`}>
                        {tier.price}
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="flex flex-1 flex-col p-0">
                      {tier.description && (
                        <p className={`mt-2 text-sm ${tier.highlighted ? 'text-white/70' : textMuted}`}>
                          {tier.description}
                        </p>
                      )}
                      <ul className="mt-6 flex-1 space-y-3 border-t pt-6" style={{ borderColor: tier.highlighted ? 'rgba(255,255,255,0.2)' : undefined }}>
                        {tier.features.map((feat, fi) => (
                          <li key={fi} className={`flex items-start gap-2 text-sm ${tier.highlighted ? 'text-white/90' : textMuted}`}>
                            <span className="mt-0.5 font-bold" style={{ color: tier.highlighted ? 'white' : SECONDARY }}>
                              {CHECK}
                            </span>
                            {feat}
                          </li>
                        ))}
                      </ul>
                      <Button
                        className="mt-8 w-full rounded-full py-3 text-sm font-semibold hover:opacity-90"
                        style={tier.highlighted ? { backgroundColor: 'white', color: PRIMARY } : { backgroundColor: PRIMARY, color: 'white' }}
                      >
                        {tier.ctaText}
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
