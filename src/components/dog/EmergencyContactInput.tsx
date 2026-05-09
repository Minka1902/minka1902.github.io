import { useState, useRef, useEffect } from 'react';
import { ChevronDown, Search } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { PHONE_COUNTRIES } from '@/lib/phoneCodes';
import type { EmergencyContact } from '@/types';

interface Props {
  value: EmergencyContact;
  onChange: (contact: EmergencyContact) => void;
}

export default function EmergencyContactInput({ value, onChange }: Props) {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState('');
  const searchRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (open) setTimeout(() => searchRef.current?.focus(), 50);
    else setSearch('');
  }, [open]);

  const filtered = search.trim()
    ? PHONE_COUNTRIES.filter(c =>
        c.name.toLowerCase().includes(search.toLowerCase()) ||
        c.code.includes(search)
      )
    : PHONE_COUNTRIES;

  const selected = PHONE_COUNTRIES.find(c => c.code === value.countryCode && c.name !== 'Canada') ??
    PHONE_COUNTRIES.find(c => c.code === value.countryCode) ??
    PHONE_COUNTRIES[0];

  return (
    <div className="space-y-3">
      <div className="space-y-1.5">
        <Label htmlFor="ec-name">Name</Label>
        <Input
          id="ec-name"
          value={value.name}
          onChange={e => onChange({ ...value, name: e.target.value })}
          placeholder="Full name"
        />
      </div>

      <div className="space-y-1.5">
        <Label>Phone</Label>
        <div className="flex items-center gap-2">
          {/* Country code picker */}
          <Popover open={open} onOpenChange={setOpen}>
            <PopoverTrigger asChild>
              <button
                type="button"
                className="flex items-center gap-1.5 h-9 px-2.5 rounded-lg border border-input bg-transparent text-sm font-medium hover:bg-muted transition-colors shrink-0 min-w-[80px]"
              >
                <span className="text-base leading-none">{selected.flag}</span>
                <span className="text-muted-foreground tabular-nums">{selected.code}</span>
                <ChevronDown className="h-3 w-3 text-muted-foreground/60 shrink-0" />
              </button>
            </PopoverTrigger>
            <PopoverContent className="w-64 p-0" align="start">
              {/* Search */}
              <div className="flex items-center gap-2 px-3 py-2 border-b border-border/50">
                <Search className="h-3.5 w-3.5 text-muted-foreground/60 shrink-0" />
                <input
                  ref={searchRef}
                  value={search}
                  onChange={e => setSearch(e.target.value)}
                  placeholder="Search country…"
                  className="flex-1 bg-transparent text-sm outline-none placeholder:text-muted-foreground/60"
                />
              </div>
              {/* List */}
              <div className="max-h-48 overflow-y-auto py-1">
                {filtered.length === 0 ? (
                  <p className="px-3 py-2 text-xs text-muted-foreground">No results</p>
                ) : (
                  filtered.map((c, i) => (
                    <button
                      key={`${c.code}-${c.name}-${i}`}
                      type="button"
                      onClick={() => { onChange({ ...value, countryCode: c.code }); setOpen(false); }}
                      className="w-full flex items-center gap-2.5 px-3 py-1.5 text-sm hover:bg-muted transition-colors text-left"
                    >
                      <span className="text-base leading-none shrink-0">{c.flag}</span>
                      <span className="flex-1 truncate">{c.name}</span>
                      <span className="text-muted-foreground tabular-nums text-xs shrink-0">{c.code}</span>
                    </button>
                  ))
                )}
              </div>
            </PopoverContent>
          </Popover>

          {/* Phone number input */}
          <Input
            type="tel"
            value={value.phone}
            onChange={e => onChange({ ...value, phone: e.target.value })}
            placeholder="Phone number"
            className="flex-1"
          />
        </div>
      </div>
    </div>
  );
}
