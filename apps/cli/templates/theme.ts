export type Colors = { primary: string; secondary: string };
export type ThemeMode = 'light' | 'dark' | 'midnight';
export type FontFamily = 'sans' | 'serif' | 'mono';

export interface Theme {
  colors: Colors;
  themeMode: ThemeMode;
  fontFamily: FontFamily;
}

export function isDark(themeMode: ThemeMode): boolean {
  return themeMode === 'dark' || themeMode === 'midnight';
}

/** Slightly elevated background for alternating section rhythm. */
export function sectionAltBg(themeMode: ThemeMode): string {
  switch (themeMode) {
    case 'light':    return 'bg-gray-50';
    case 'dark':     return 'bg-gray-800/30';
    case 'midnight': return 'bg-slate-900/50';
  }
}
