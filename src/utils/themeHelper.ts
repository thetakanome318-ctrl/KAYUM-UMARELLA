/**
 * Helper function to determine if the current theme is light.
 * It checks the local storage value, matching the state logic in App.tsx.
 */
export function isLightTheme(): boolean {
  if (typeof window === 'undefined') return false;
  const stored = localStorage.getItem('app_theme');
  return stored === 'light';
}

/**
 * Returns dynamic Tailwind contrast classes based on the active theme mode.
 * 
 * @param isLight boolean indicating if light theme is active
 * @param lightClass CSS classes to apply in light mode
 * @param darkClass CSS classes to apply in dark mode
 */
export function getThemeClass(isLight: boolean, lightClass: string, darkClass: string): string {
  return isLight ? lightClass : darkClass;
}

/**
 * Returns a comprehensive object containing tailored Tailwind classes for text contrast,
 * backgrounds, borders, and interaction states based on the current 'isLight' state.
 */
export function getThemeContrastClasses(isLight: boolean) {
  return {
    cardBg: isLight ? 'bg-white border-slate-200 shadow-sm text-slate-800' : 'bg-slate-900/90 border-slate-800 text-white',
    textTitle: isLight ? 'text-slate-900 font-bold' : 'text-slate-100 font-bold',
    textBody: isLight ? 'text-slate-700' : 'text-slate-300',
    textMuted: isLight ? 'text-slate-500' : 'text-slate-400',
    textValue: isLight ? 'text-slate-800 font-mono' : 'text-slate-100 font-mono',
    border: isLight ? 'border-slate-100' : 'border-slate-800/80',
    divider: isLight ? 'border-slate-100' : 'border-slate-800/80',
    tableHeaderBg: isLight ? 'bg-slate-50 text-slate-500' : 'bg-slate-950/40 text-slate-400',
    hoverBg: isLight ? 'hover:bg-slate-50' : 'hover:bg-slate-800/50',
    inputBg: isLight ? 'bg-white border-slate-300 text-slate-900' : 'bg-slate-800 border-slate-700 text-white',
  };
}

/**
 * Standard semantic classes for Dashboard Cards and Charts.
 * Centralizing this ensures design consistency and avoids over-complicated inline ternary styles.
 */
export const themeStyles = {
  // Container card styles
  cardBg: (isLight: boolean) => getThemeClass(isLight, 'bg-white border-slate-200 shadow-sm', 'bg-slate-900/90 border-slate-800'),
  cardHeaderBg: (isLight: boolean) => getThemeClass(isLight, 'bg-slate-50/50 border-b border-slate-100', 'bg-slate-900/40 border-b border-slate-800/80'),
  
  // Text contrast classes
  textTitle: (isLight: boolean) => getThemeClass(isLight, 'text-slate-900 font-bold', 'text-white font-bold'),
  textSubtitle: (isLight: boolean) => getThemeClass(isLight, 'text-slate-500 text-xs', 'text-slate-400 text-xs'),
  textMuted: (isLight: boolean) => getThemeClass(isLight, 'text-slate-500', 'text-slate-400'),
  textValue: (isLight: boolean) => getThemeClass(isLight, 'text-slate-800 font-mono', 'text-slate-100 font-mono'),
  textBody: (isLight: boolean) => getThemeClass(isLight, 'text-slate-700', 'text-slate-300'),
  
  // Backgrounds & accents
  accentBg: (isLight: boolean) => getThemeClass(isLight, 'bg-slate-50', 'bg-slate-950'),
  hoverBg: (isLight: boolean) => getThemeClass(isLight, 'hover:bg-slate-50/50', 'hover:bg-slate-800/40'),
  divider: (isLight: boolean) => getThemeClass(isLight, 'border-slate-100', 'border-slate-800/80'),
  
  // Chart specifics
  chartGrid: (isLight: boolean) => getThemeClass(isLight, '#000000', '#FFFFFF'),
  chartText: (isLight: boolean) => getThemeClass(isLight, '#000000', '#FFFFFF'),
  chartAxis: (isLight: boolean) => getThemeClass(isLight, '#000000', '#FFFFFF'),
  chartTooltipBg: (isLight: boolean) => getThemeClass(isLight, '#ffffff', '#000000'),
  chartTooltipBorder: (isLight: boolean) => getThemeClass(isLight, '#000000', '#ffffff'),
  chartTooltipTextColor: (isLight: boolean) => getThemeClass(isLight, '#000000', '#ffffff'),
  chartCellStroke: (isLight: boolean) => getThemeClass(isLight, '#ffffff', '#000000'),
};
