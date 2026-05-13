import { useEffect, useState } from 'react';

type Theme = 'light' | 'dark';

function getInitial(): Theme {
  // Read from DOM — the inline script in index.html already applied the class
  return document.documentElement.classList.contains('dark') ? 'dark' : 'light';
}

export function useTheme() {
  const [theme, setTheme] = useState<Theme>(getInitial);

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

  return { theme, toggle };
}
