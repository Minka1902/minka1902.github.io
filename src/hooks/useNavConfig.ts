import { useState, useEffect } from 'react';
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

  useEffect(() => {
    const onStorage = (e: StorageEvent) => {
      if (e.key === STORAGE_KEY) setSelected(load());
    };
    window.addEventListener('storage', onStorage);
    return () => window.removeEventListener('storage', onStorage);
  }, []);

  const save = (keys: string[]) => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(keys));
    setSelected(keys);
    window.dispatchEvent(new StorageEvent('storage', { key: STORAGE_KEY }));
  };

  const toggle = (to: string) => {
    if (selected.includes(to)) {
      if (selected.length > 1) save(selected.filter(k => k !== to));
    } else if (selected.length < MAX) {
      save([...selected, to]);
    }
  };

  return { selected, toggle, max: MAX };
}
