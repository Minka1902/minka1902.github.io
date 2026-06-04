import { useEffect, useState } from 'react';

type Theme = 'light' | 'dark';

export type ColorTheme = 'warm-cream' | 'white-sage' | 'neutral-slate' | 'royal-purple' | 'ruby-red';
export const COLOR_THEMES: ColorTheme[] = ['warm-cream', 'white-sage', 'neutral-slate', 'royal-purple', 'ruby-red'];

const COLOR_THEME_KEY = 'packops_color_theme';
const THEME_CLASSES: Record<ColorTheme, string> = {
  'warm-cream': 'theme-warm-cream',
  'white-sage': 'theme-white-sage',
  'neutral-slate': 'theme-neutral-slate',
  'royal-purple': 'theme-royal-purple',
  'ruby-red': 'theme-ruby-red',
};

function getInitialTheme(): Theme {
  // Read from DOM — the inline script in index.html already applied the class
  return document.documentElement.classList.contains('dark') ? 'dark' : 'light';
}

function getInitialColorTheme(): ColorTheme {
  const stored = localStorage.getItem(COLOR_THEME_KEY);
  if (stored && COLOR_THEMES.includes(stored as ColorTheme)) {
    return stored as ColorTheme;
  }
  return 'warm-cream';
}

function applyColorTheme(colorTheme: ColorTheme) {
  const html = document.documentElement;
  if (html.classList.contains(THEME_CLASSES[colorTheme])) return; // already applied, skip
  // Remove all theme-* classes
  COLOR_THEMES.forEach(t => html.classList.remove(THEME_CLASSES[t]));
  // Add the new theme class
  html.classList.add(THEME_CLASSES[colorTheme]);
}

export function useTheme() {
  const [theme, setTheme] = useState<Theme>(getInitialTheme);
  const [colorTheme, setColorThemeState] = useState<ColorTheme>(() => {
    const initial = getInitialColorTheme();
    // Apply on first render (index.html inline script only handles dark/light)
    applyColorTheme(initial);
    return initial;
  });

  useEffect(() => {
    if (theme === 'dark') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
    localStorage.setItem('packops_theme', theme);
  }, [theme]);

  const toggle = () => {
    const next: Theme = theme === 'dark' ? 'light' : 'dark';
    document.documentElement.classList.add('theme-transitioning');
    document.documentElement.classList.toggle('dark', next === 'dark');
    localStorage.setItem('packops_theme', next);
    setTimeout(() => document.documentElement.classList.remove('theme-transitioning'), 250);
    setTheme(next);
  };

  const setColorTheme = (newColorTheme: ColorTheme) => {
    const html = document.documentElement;
    html.classList.add('theme-transitioning');
    applyColorTheme(newColorTheme);
    localStorage.setItem(COLOR_THEME_KEY, newColorTheme);
    setTimeout(() => html.classList.remove('theme-transitioning'), 250);
    setColorThemeState(newColorTheme);
  };

  return { theme, toggle, colorTheme, setColorTheme };
}
