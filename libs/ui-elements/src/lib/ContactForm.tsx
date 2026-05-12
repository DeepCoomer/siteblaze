import { isDark, sectionAltBg } from './theme.js';
import type { Theme } from './theme.js';

const PRIMARY = 'var(--color-primary)';

export interface ContactFormProps {
  content: { title?: string; subtitle?: string; buttonText: string };
  variant: 'centered' | 'split' | 'minimal';
  theme: Theme;
}

function Field({ label, type = 'text', placeholder }: { label: string; type?: string; placeholder?: string }) {
  return (
    <div className="flex flex-col gap-1.5">
      <label className="text-sm font-semibold">{label}</label>
      {type === 'textarea' ? (
        <textarea
          rows={4}
          placeholder={placeholder}
          className="w-full rounded-lg border border-gray-300 bg-transparent px-4 py-3 text-sm outline-none ring-0 transition focus:ring-2 focus:ring-offset-0"
          style={{ '--tw-ring-color': PRIMARY } as React.CSSProperties}
          onSubmit={e => e.preventDefault()}
        />
      ) : (
        <input
          type={type}
          placeholder={placeholder}
          className="w-full rounded-lg border border-gray-300 bg-transparent px-4 py-3 text-sm outline-none transition focus:ring-2 focus:ring-offset-0"
          style={{ '--tw-ring-color': PRIMARY } as React.CSSProperties}
        />
      )}
    </div>
  );
}

export function ContactForm({ content, variant, theme }: ContactFormProps) {
  const { title, subtitle, buttonText } = content;
  const dark = isDark(theme.themeMode);
  const textPrimary = dark ? 'text-white'   : 'text-gray-900';
  const textMuted   = dark ? 'text-gray-400' : 'text-gray-500';
  const cardBg      = dark ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-100';
  const altBg       = sectionAltBg(theme.themeMode);

  const formFields = (
    <form className="flex flex-col gap-5" onSubmit={e => e.preventDefault()}>
      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
        <Field label="Name" placeholder="Your name" />
        <Field label="Email" type="email" placeholder="you@example.com" />
      </div>
      <Field label="Subject" placeholder="What's this about?" />
      <Field label="Message" type="textarea" placeholder="Tell me more…" />
      <button
        type="submit"
        className="rounded-full px-8 py-3 text-sm font-semibold text-white shadow-md transition-opacity hover:opacity-90"
        style={{ backgroundColor: PRIMARY }}
      >
        {buttonText}
      </button>
    </form>
  );

  switch (variant) {

    case 'split':
      return (
        <section className={`px-6 py-24 ${altBg} sm:py-32`}>
          <div className="mx-auto grid max-w-5xl gap-16 lg:grid-cols-2 lg:items-start">
            <div>
              {title && <h2 className={`text-3xl font-extrabold ${textPrimary} sm:text-4xl`}>{title}</h2>}
              {subtitle && <p className={`mt-4 text-lg ${textMuted}`}>{subtitle}</p>}
              <ul className={`mt-10 space-y-4 text-sm ${textMuted}`}>
                <li className="flex items-center gap-3"><span style={{ color: PRIMARY }}>✉</span> hello@example.com</li>
                <li className="flex items-center gap-3"><span style={{ color: PRIMARY }}>📍</span> Remote, Worldwide</li>
                <li className="flex items-center gap-3"><span style={{ color: PRIMARY }}>🕐</span> Mon–Fri, 9am–6pm</li>
              </ul>
            </div>
            <div className={`rounded-2xl border ${cardBg} p-8 shadow-lg ${textPrimary}`}>
              {formFields}
            </div>
          </div>
        </section>
      );

    case 'minimal':
      return (
        <section className="px-6 py-20">
          <div className={`mx-auto max-w-xl ${textPrimary}`}>
            {title && <h2 className={`mb-2 text-2xl font-extrabold ${textPrimary}`}>{title}</h2>}
            {subtitle && <p className={`mb-8 text-sm ${textMuted}`}>{subtitle}</p>}
            {formFields}
          </div>
        </section>
      );

    case 'centered':
    default:
      return (
        <section className={`px-6 py-24 ${altBg} sm:py-32`}>
          <div className="mx-auto max-w-2xl text-center">
            {title && <h2 className={`mb-3 text-3xl font-extrabold ${textPrimary} sm:text-4xl`}>{title}</h2>}
            {subtitle && <p className={`mb-10 text-lg ${textMuted}`}>{subtitle}</p>}
            <div className={`rounded-2xl border ${cardBg} p-8 shadow-lg text-left ${textPrimary}`}>
              {formFields}
            </div>
          </div>
        </section>
      );
  }
}
