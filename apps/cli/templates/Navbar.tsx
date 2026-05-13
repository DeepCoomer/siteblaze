import { useState } from 'react';
import { isDark } from './theme.js';
import type { Theme } from './theme.js';

const PRIMARY = 'var(--color-primary)';

interface NavLink { label: string; href: string }

export interface NavbarProps {
  content: { logo: string; links: NavLink[]; ctaText?: string };
  variant: 'sticky' | 'transparent' | 'minimal';
  theme: Theme;
}

export function Navbar({ content, variant, theme }: NavbarProps) {
  const { logo, links, ctaText } = content;
  const dark = isDark(theme.themeMode);
  const [mobileOpen, setMobileOpen] = useState(false);

  const textNav = dark ? 'text-gray-300 hover:text-white' : 'text-gray-600 hover:text-gray-900';

  const stickyClass = variant === 'sticky' ? 'sticky top-0 z-50' : '';

  const bgClass =
    variant === 'transparent'
      ? 'bg-transparent'
      : dark
      ? 'bg-gray-900/95 backdrop-blur border-b border-gray-800'
      : 'bg-white/95 backdrop-blur border-b border-gray-100 shadow-sm';

  const mobileBg = dark ? 'bg-gray-900 border-gray-800' : 'bg-white border-gray-100';

  return (
    <nav className={`${stickyClass} ${bgClass} px-6 py-4`}>
      <div className="mx-auto flex max-w-6xl items-center justify-between">
        {/* Logo */}
        <a href="#" className="text-xl font-extrabold" style={{ color: PRIMARY }}>
          {logo}
        </a>

        {/* Desktop nav links */}
        {variant !== 'minimal' && links.length > 0 && (
          <ul className="hidden items-center gap-8 md:flex">
            {links.map((link, i) => (
              <li key={i}>
                <a href={link.href} className={`text-sm font-medium transition-colors ${textNav}`}>
                  {link.label}
                </a>
              </li>
            ))}
          </ul>
        )}

        {/* Desktop CTA */}
        {ctaText && (
          <a
            href="#"
            className="hidden rounded-full px-5 py-2 text-sm font-semibold text-white transition-opacity hover:opacity-90 md:inline-block"
            style={{ backgroundColor: PRIMARY }}
          >
            {ctaText}
          </a>
        )}

        {/* Mobile hamburger */}
        {variant !== 'minimal' && (
          <button
            className="flex flex-col gap-1 md:hidden"
            aria-label={mobileOpen ? 'Close menu' : 'Open menu'}
            aria-expanded={mobileOpen}
            onClick={() => setMobileOpen(!mobileOpen)}
          >
            {[0, 1, 2].map((n) => (
              <span
                key={n}
                className="block h-0.5 w-5 rounded transition-all duration-200"
                style={{ backgroundColor: PRIMARY }}
              />
            ))}
          </button>
        )}
      </div>

      {/* Mobile menu */}
      {variant !== 'minimal' && mobileOpen && (
        <div className={`border-t md:hidden ${mobileBg} px-6 py-4`}>
          <ul className="flex flex-col gap-4">
            {links.map((link, i) => (
              <li key={i}>
                <a
                  href={link.href}
                  className={`text-sm font-medium transition-colors ${textNav}`}
                  onClick={() => setMobileOpen(false)}
                >
                  {link.label}
                </a>
              </li>
            ))}
          </ul>
          {ctaText && (
            <a
              href="#"
              className="mt-4 inline-block rounded-full px-5 py-2 text-sm font-semibold text-white transition-opacity hover:opacity-90"
              style={{ backgroundColor: PRIMARY }}
              onClick={() => setMobileOpen(false)}
            >
              {ctaText}
            </a>
          )}
        </div>
      )}
    </nav>
  );
}
