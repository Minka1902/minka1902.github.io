import { useState } from 'react';
import { DEFAULT_MOBILE_NAV } from '@/lib/nav';

const STORAGE_KEY = 'packops_mobile_nav';
const MAX = 5;

function load(): string[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw) as unknown;
      if (Array.isArray(parsed) && parsed.length > 0) return (parsed as string[]).slice(0, MAX);
    }
  } catch {}
  return DEFAULT_MOBILE_NAV;
}

export function useNavConfig() {
  const [selected, setSelected] = useState<string[]>(load);

  const save = (keys: string[]) => {
    setSelected(keys);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(keys));
  };

  const toggle = (to: string) => {
    if (selected.includes(to)) {
      // Always keep at least 1
      if (selected.length > 1) save(selected.filter(k => k !== to));
    } else if (selected.length < MAX) {
      save([...selected, to]);
    }
  };

  return { selected, toggle, max: MAX };
}
