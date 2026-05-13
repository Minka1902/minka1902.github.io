interface PayloadItem {
  name?: unknown;
  value?: unknown;
  color?: string;
}

export interface ChartTooltipProps {
  active?: boolean;
  payload?: readonly PayloadItem[];
  label?: unknown;
  formatEntry?: (value: number, name: string) => [string, string];
}

export function ChartTooltip({ active, payload, label, formatEntry }: ChartTooltipProps) {
  if (!active || !payload?.length) return null;
  return (
    <div className="rounded-lg border bg-popover text-popover-foreground shadow-md px-3 py-2 text-xs">
      {label != null && <p className="font-semibold mb-1">{String(label)}</p>}
      {payload.map((entry, i) => {
        const rawVal = Array.isArray(entry.value) ? entry.value[0] : entry.value;
        const val = Number(rawVal ?? 0);
        const name = String(entry.name ?? '');
        const [displayVal, displayName] = formatEntry
          ? formatEntry(val, name)
          : [`${val}`, name];
        return (
          <p key={i} style={{ color: entry.color }}>
            <span className="font-medium">{displayName}:</span> {displayVal}
          </p>
        );
      })}
    </div>
  );
}
