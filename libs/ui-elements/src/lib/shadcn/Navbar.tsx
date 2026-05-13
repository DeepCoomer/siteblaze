import { Button } from '@/components/ui/button';
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet';
import { isDark } from '../theme.js';
import type { Theme } from '../theme.js';

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

  const textNav  = dark ? 'text-gray-300 hover:text-white' : 'text-gray-600 hover:text-gray-900';
  const stickyClass = variant === 'sticky' ? 'sticky top-0 z-50' : '';
  const bgClass =
    variant === 'transparent'
      ? 'bg-transparent'
      : dark
      ? 'bg-gray-900/95 backdrop-blur border-b border-gray-800'
      : 'bg-white/95 backdrop-blur border-b border-gray-100 shadow-sm';
  const sheetBg = dark ? 'bg-gray-900' : 'bg-white';

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
          <Button
            className="hidden rounded-full px-5 py-2 text-sm font-semibold text-white hover:opacity-90 md:inline-flex"
            style={{ backgroundColor: PRIMARY }}
          >
            {ctaText}
          </Button>
        )}

        {/* Mobile menu — Sheet with focus trap and keyboard nav */}
        {variant !== 'minimal' && (
          <Sheet>
            <SheetTrigger asChild>
              <Button variant="ghost" size="icon" className="flex md:hidden" aria-label="Open menu">
                <span className="flex flex-col gap-1" aria-hidden="true">
                  {[0, 1, 2].map((n) => (
                    <span key={n} className="block h-0.5 w-5 rounded" style={{ backgroundColor: PRIMARY }} />
                  ))}
                </span>
              </Button>
            </SheetTrigger>
            <SheetContent className={sheetBg}>
              <div className="flex flex-col gap-6 pt-8">
                <a href="#" className="text-xl font-extrabold" style={{ color: PRIMARY }}>{logo}</a>
                <ul className="flex flex-col gap-4">
                  {links.map((link, i) => (
                    <li key={i}>
                      <a href={link.href} className={`text-base font-medium transition-colors ${textNav}`}>
                        {link.label}
                      </a>
                    </li>
                  ))}
                </ul>
                {ctaText && (
                  <Button
                    className="w-full rounded-full text-sm font-semibold text-white hover:opacity-90"
                    style={{ backgroundColor: PRIMARY }}
                  >
                    {ctaText}
                  </Button>
                )}
              </div>
            </SheetContent>
          </Sheet>
        )}
      </div>
    </nav>
  );
}
