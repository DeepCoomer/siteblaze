import { isDark, sectionAltBg } from './theme.js';
import type { Theme } from './theme.js';

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
  const cardBg       = dark ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200';
  const divider      = dark ? 'divide-gray-700' : 'divide-gray-100';
  const altBg        = sectionAltBg(theme.themeMode);
  const tierDivider  = dark ? '#1f2937' : '#f9fafb';

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
                    <a href="#" className="mt-1 inline-block text-sm font-medium underline" style={{ color: PRIMARY }}>
                      {tier.ctaText}
                    </a>
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
                      <div
                        className={`inline-block rounded-xl px-4 py-2 font-bold ${tier.highlighted ? 'text-white' : textPrimary}`}
                        style={tier.highlighted ? { backgroundColor: PRIMARY } : {}}
                      >
                        {tier.name}
                      </div>
                      <p className="mt-1 text-lg font-extrabold" style={{ color: PRIMARY }}>{tier.price}</p>
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
                        {tier.features.includes(feature) ? (
                          <span style={{ color: PRIMARY }}>{CHECK}</span>
                        ) : (
                          <span className={textMuted}>{CROSS}</span>
                        )}
                      </td>
                    ))}
                  </tr>
                ))}
                <tr>
                  <td />
                  {tiers.map((tier, i) => (
                    <td key={i} className="px-4 py-4 text-center">
                      <a
                        href="#"
                        className="inline-block rounded-full px-6 py-2 text-sm font-semibold text-white transition-opacity hover:opacity-90"
                        style={{ backgroundColor: tier.highlighted ? PRIMARY : SECONDARY }}
                      >
                        {tier.ctaText}
                      </a>
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
                <li
                  key={i}
                  className={`flex flex-col rounded-2xl border p-8 shadow-sm ${
                    tier.highlighted ? 'scale-105 shadow-xl text-white' : cardBg
                  }`}
                  style={tier.highlighted ? { backgroundColor: PRIMARY, borderColor: PRIMARY } : {}}
                >
                  <p className={`text-sm font-semibold uppercase tracking-widest ${tier.highlighted ? 'text-white/70' : textMuted}`}>
                    {tier.name}
                  </p>
                  <p className={`mt-3 text-4xl font-extrabold ${tier.highlighted ? 'text-white' : textPrimary}`}>
                    {tier.price}
                  </p>
                  {tier.description && (
                    <p className={`mt-2 text-sm ${tier.highlighted ? 'text-white/70' : textMuted}`}>
                      {tier.description}
                    </p>
                  )}
                  <ul
                    className="mt-6 flex-1 space-y-3 border-t pt-6"
                    style={{ borderColor: tierDivider }}
                  >
                    {tier.features.map((feat, fi) => (
                      <li key={fi} className={`flex items-start gap-2 text-sm ${tier.highlighted ? 'text-white/90' : textMuted}`}>
                        <span
                          className="mt-0.5 font-bold"
                          style={{ color: tier.highlighted ? 'white' : SECONDARY }}
                        >
                          {CHECK}
                        </span>
                        {feat}
                      </li>
                    ))}
                  </ul>
                  <a
                    href="#"
                    className="mt-8 inline-block rounded-full py-3 text-center text-sm font-semibold transition-opacity hover:opacity-90"
                    style={
                      tier.highlighted
                        ? { backgroundColor: 'white', color: PRIMARY }
                        : { backgroundColor: PRIMARY, color: 'white' }
                    }
                  >
                    {tier.ctaText}
                  </a>
                </li>
              ))}
            </ul>
          </div>
        </section>
      );
  }
}
