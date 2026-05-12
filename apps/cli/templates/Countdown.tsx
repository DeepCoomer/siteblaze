import { useState, useEffect } from 'react';
import { isDark, sectionAltBg } from './theme.js';
import type { Theme } from './theme.js';

const PRIMARY   = 'var(--color-primary)';
const SECONDARY = 'var(--color-secondary)';

export interface CountdownProps {
  content: { title?: string; date: string; subtitle?: string; ctaText?: string };
  variant: 'centered' | 'banner' | 'minimal';
  theme: Theme;
}

interface TimeLeft { days: number; hours: number; minutes: number; seconds: number }

function getTimeLeft(targetDate: string): TimeLeft | null {
  const diff = new Date(targetDate).getTime() - Date.now();
  if (diff <= 0) return null;
  return {
    days:    Math.floor(diff / 86_400_000),
    hours:   Math.floor((diff % 86_400_000) / 3_600_000),
    minutes: Math.floor((diff % 3_600_000)  / 60_000),
    seconds: Math.floor((diff % 60_000)     / 1_000),
  };
}

function useCountdown(targetDate: string) {
  const [timeLeft, setTimeLeft] = useState<TimeLeft | null>(() => getTimeLeft(targetDate));
  useEffect(() => {
    const id = setInterval(() => setTimeLeft(getTimeLeft(targetDate)), 1_000);
    return () => clearInterval(id);
  }, [targetDate]);
  return timeLeft;
}

function Pad(n: number) {
  return String(n).padStart(2, '0');
}

export function Countdown({ content, variant, theme }: CountdownProps) {
  const { title, date, subtitle, ctaText } = content;
  const timeLeft = useCountdown(date);
  const dark = isDark(theme.themeMode);
  const textPrimary = dark ? 'text-white'   : 'text-gray-900';
  const textMuted   = dark ? 'text-gray-300' : 'text-gray-600';
  const cardBg      = dark ? 'bg-gray-800/60' : 'bg-white/80';
  const altBg       = sectionAltBg(theme.themeMode);

  const units = timeLeft
    ? [
        { label: 'Days',    value: Pad(timeLeft.days) },
        { label: 'Hours',   value: Pad(timeLeft.hours) },
        { label: 'Minutes', value: Pad(timeLeft.minutes) },
        { label: 'Seconds', value: Pad(timeLeft.seconds) },
      ]
    : [];

  const started = !timeLeft;

  function Digits({ unit }: { unit: { label: string; value: string } }) {
    return (
      <div className="flex flex-col items-center">
        <div
          className={`flex h-20 w-20 items-center justify-center rounded-2xl text-4xl font-extrabold text-white shadow-lg sm:h-24 sm:w-24 sm:text-5xl`}
          style={{ background: `linear-gradient(135deg, ${PRIMARY}, ${SECONDARY})` }}
        >
          {unit.value}
        </div>
        <span className={`mt-2 text-xs font-semibold uppercase tracking-widest ${textMuted}`}>{unit.label}</span>
      </div>
    );
  }

  switch (variant) {

    case 'banner':
      return (
        <section
          className="relative overflow-hidden px-6 py-10"
          style={{ background: `linear-gradient(135deg, ${PRIMARY}, ${SECONDARY})` }}
        >
          <div className="mx-auto flex max-w-5xl flex-wrap items-center justify-between gap-6">
            <div>
              {title && <h2 className="text-xl font-extrabold text-white sm:text-2xl">{title}</h2>}
              {subtitle && <p className="mt-1 text-sm text-white/80">{subtitle}</p>}
            </div>
            {started ? (
              <span className="text-lg font-bold text-white">🎉 The event has started!</span>
            ) : (
              <div className="flex gap-4">
                {units.map((u, i) => (
                  <div key={i} className="flex flex-col items-center">
                    <span className={`${cardBg} rounded-xl px-4 py-2 text-3xl font-extrabold backdrop-blur`} style={{ color: PRIMARY }}>{u.value}</span>
                    <span className="mt-1 text-xs font-semibold uppercase tracking-wide text-white/70">{u.label}</span>
                  </div>
                ))}
              </div>
            )}
            {ctaText && (
              <a href="#" className={`rounded-full ${cardBg} px-6 py-3 text-sm font-bold backdrop-blur transition-opacity hover:opacity-90`} style={{ color: PRIMARY }}>
                {ctaText}
              </a>
            )}
          </div>
        </section>
      );

    case 'minimal':
      return (
        <section className="px-6 py-14">
          <div className="mx-auto max-w-3xl text-center">
            {title && <h2 className={`mb-6 text-2xl font-extrabold ${textPrimary}`}>{title}</h2>}
            {started ? (
              <p className={`text-lg font-semibold ${textMuted}`}>🎉 The event has started!</p>
            ) : (
              <div className="flex items-center justify-center gap-6">
                {units.map((u, i) => (
                  <div key={i} className="text-center">
                    <span className={`block text-5xl font-extrabold ${textPrimary}`} style={{ color: PRIMARY }}>{u.value}</span>
                    <span className={`text-xs uppercase tracking-widest ${textMuted}`}>{u.label}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </section>
      );

    case 'centered':
    default:
      return (
        <section className={`relative overflow-hidden px-6 py-24 ${altBg} text-center sm:py-32`}>
          <div
            className="pointer-events-none absolute inset-0 -z-10 opacity-10"
            style={{ background: `radial-gradient(ellipse 80% 60% at 50% 0%, ${PRIMARY}, transparent)` }}
          />
          {title && <h2 className={`mb-4 text-4xl font-extrabold ${textPrimary} sm:text-5xl`}>{title}</h2>}
          {subtitle && <p className={`mb-12 text-lg ${textMuted}`}>{subtitle}</p>}
          {started ? (
            <p className={`text-2xl font-bold ${textPrimary}`}>🎉 The event has started!</p>
          ) : (
            <div className="flex flex-wrap items-end justify-center gap-4 sm:gap-6">
              {units.map((u, i) => (
                <div key={i}>
                  <Digits unit={u} />
                </div>
              ))}
            </div>
          )}
          {ctaText && (
            <a
              href="#"
              className="mt-12 inline-block rounded-full px-8 py-4 text-sm font-semibold text-white shadow-lg transition-opacity hover:opacity-90"
              style={{ backgroundColor: PRIMARY }}
            >
              {ctaText}
            </a>
          )}
        </section>
      );
  }
}
