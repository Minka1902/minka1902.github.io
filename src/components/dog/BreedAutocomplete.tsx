import { useState, useRef, useEffect } from 'react';
import { fuzzySearchBreeds, isValidDogBreed } from 'validog';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';

interface Props {
  value: string;
  onChange: (value: string) => void;
  id?: string;
}

export default function BreedAutocomplete({ value, onChange, id }: Props) {
  const [query, setQuery] = useState(value);
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [open, setOpen] = useState(false);
  const [activeIdx, setActiveIdx] = useState(-1);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => { setQuery(value); }, [value]);

  const search = (q: string) => {
    setQuery(q);
    onChange(q);
    if (q.length < 2) { setSuggestions([]); setOpen(false); return; }
    const results = fuzzySearchBreeds(q).slice(0, 8).map((b: { name: string }) => b.name);
    setSuggestions(results);
    setOpen(results.length > 0);
    setActiveIdx(-1);
  };

  const select = (name: string) => {
    setQuery(name);
    onChange(name);
    setSuggestions([]);
    setOpen(false);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (!open) return;
    if (e.key === 'ArrowDown') { e.preventDefault(); setActiveIdx(i => Math.min(i + 1, suggestions.length - 1)); }
    if (e.key === 'ArrowUp')   { e.preventDefault(); setActiveIdx(i => Math.max(i - 1, -1)); }
    if (e.key === 'Enter' && activeIdx >= 0) { e.preventDefault(); select(suggestions[activeIdx]); }
    if (e.key === 'Escape') { setOpen(false); }
  };

  // Close on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const isValid = query === '' || isValidDogBreed(query);

  return (
    <div ref={containerRef} className="relative">
      <Input
        id={id}
        value={query}
        onChange={e => search(e.target.value)}
        onKeyDown={handleKeyDown}
        onFocus={() => query.length >= 2 && setOpen(suggestions.length > 0)}
        placeholder="e.g. Labrador Retriever"
        autoComplete="off"
        className={cn(!isValid && query.length > 2 && 'border-amber-400 focus-visible:ring-amber-400')}
      />
      {!isValid && query.length > 2 && (
        <p className="text-xs text-amber-600 mt-1">Breed not recognized — you can still save it.</p>
      )}
      {open && (
        <ul className="absolute z-50 mt-1 w-full rounded-md border bg-popover shadow-md overflow-auto max-h-56">
          {suggestions.map((name, i) => (
            <li
              key={name}
              onMouseDown={() => select(name)}
              className={cn(
                'px-3 py-2 text-sm cursor-pointer',
                i === activeIdx ? 'bg-accent text-accent-foreground' : 'hover:bg-accent hover:text-accent-foreground'
              )}
            >
              {name}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
