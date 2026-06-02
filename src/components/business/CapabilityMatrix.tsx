import { useMemo } from 'react';
import { CAPABILITY_CATALOG, type Capability } from '@/types';

interface Props {
  value: Capability[];
  onChange: (caps: Capability[]) => void;
  disabled?: boolean;
}

export default function CapabilityMatrix({ value, onChange, disabled }: Props) {
  const groups = useMemo(() => {
    const map = new Map<string, typeof CAPABILITY_CATALOG>();
    for (const meta of CAPABILITY_CATALOG) {
      const arr = map.get(meta.group) ?? [];
      arr.push(meta);
      map.set(meta.group, arr);
    }
    return Array.from(map.entries());
  }, []);

  const toggle = (cap: Capability) => {
    if (disabled) return;
    onChange(value.includes(cap) ? value.filter(c => c !== cap) : [...value, cap]);
  };

  return (
    <div className="space-y-4">
      {groups.map(([group, metas]) => (
        <div key={group} className="space-y-2">
          <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">{group}</p>
          <div className="grid grid-cols-1 gap-1.5 sm:grid-cols-2">
            {metas.map(meta => (
              <label
                key={meta.capability}
                className="flex cursor-pointer items-center gap-2 rounded-lg border px-3 py-2 text-sm has-[:disabled]:cursor-not-allowed has-[:disabled]:opacity-60"
              >
                <input
                  type="checkbox"
                  className="h-4 w-4 accent-primary"
                  checked={value.includes(meta.capability)}
                  onChange={() => toggle(meta.capability)}
                  disabled={disabled}
                />
                <span>{meta.label}</span>
              </label>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}
