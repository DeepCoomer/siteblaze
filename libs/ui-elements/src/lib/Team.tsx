import { isDark, sectionAltBg } from './theme.js';
import type { Theme } from './theme.js';

const PRIMARY = 'var(--color-primary)';

interface TeamMember { name: string; role: string; bio?: string }

export interface TeamProps {
  content: { title?: string; items: TeamMember[] };
  variant: 'grid' | 'cards' | 'minimal';
  theme: Theme;
}

function Avatar({ member }: { member: TeamMember }) {
  return (
    <div
      className="flex h-16 w-16 shrink-0 items-center justify-center rounded-full text-xl font-bold text-white"
      style={{ backgroundColor: PRIMARY }}
    >
      {member.name.charAt(0).toUpperCase()}
    </div>
  );
}

export function Team({ content, variant, theme }: TeamProps) {
  const { title, items } = content;
  const dark = isDark(theme.themeMode);

  const textPrimary = dark ? 'text-white'   : 'text-gray-900';
  const textMuted   = dark ? 'text-gray-300' : 'text-gray-600';
  const cardBg      = dark ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-100';
  const altBg       = sectionAltBg(theme.themeMode);

  const sectionTitle = title && (
    <h2 className={`mb-12 text-center text-3xl font-extrabold ${textPrimary} sm:text-4xl`}>{title}</h2>
  );

  switch (variant) {
    case 'cards':
      return (
        <section className={`px-6 py-24 ${altBg} sm:py-32`}>
          <div className="mx-auto max-w-6xl">
            {sectionTitle}
            <ul className="grid grid-cols-1 gap-8 sm:grid-cols-2 lg:grid-cols-3">
              {items.map((member, i) => (
                <li
                  key={i}
                  className={`flex flex-col items-center rounded-2xl border ${cardBg} p-8 text-center shadow-md`}
                >
                  <Avatar member={member} />
                  <h3 className={`mt-4 text-lg font-bold ${textPrimary}`}>{member.name}</h3>
                  <p className="mt-1 text-sm font-medium" style={{ color: PRIMARY }}>{member.role}</p>
                  {member.bio && (
                    <p className={`mt-3 text-sm leading-relaxed ${textMuted}`}>{member.bio}</p>
                  )}
                </li>
              ))}
            </ul>
          </div>
        </section>
      );

    case 'minimal':
      return (
        <section className="px-6 py-24 sm:py-32">
          <div className="mx-auto max-w-3xl">
            {sectionTitle}
            <ul className="space-y-6">
              {items.map((member, i) => (
                <li key={i} className="flex items-center gap-4">
                  <Avatar member={member} />
                  <div>
                    <h3 className={`text-base font-semibold ${textPrimary}`}>{member.name}</h3>
                    <p className="text-sm font-medium" style={{ color: PRIMARY }}>{member.role}</p>
                    {member.bio && <p className={`mt-1 text-xs ${textMuted}`}>{member.bio}</p>}
                  </div>
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
            <ul className="grid grid-cols-2 gap-8 sm:grid-cols-3 lg:grid-cols-4">
              {items.map((member, i) => (
                <li key={i} className="flex flex-col items-center text-center">
                  <Avatar member={member} />
                  <h3 className={`mt-3 text-sm font-semibold ${textPrimary}`}>{member.name}</h3>
                  <p className="mt-0.5 text-xs font-medium" style={{ color: PRIMARY }}>{member.role}</p>
                </li>
              ))}
            </ul>
          </div>
        </section>
      );
  }
}
