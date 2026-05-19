import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { X } from 'lucide-react';
import { useDog } from '@/contexts/DogContext';

interface Props {
  onClose: () => void;
}

export default function DogSelectForWalkDialog({ onClose }: Props) {
  const navigate = useNavigate();
  const { dogs, activeDog } = useDog();
  const [selectedIds, setSelectedIds] = useState<Set<string>>(
    () => new Set(activeDog ? [activeDog.id] : []),
  );

  const toggleDog = (id: string) =>
    setSelectedIds(prev => {
      const next = new Set(prev);
      if (next.has(id)) { if (next.size > 1) next.delete(id); }
      else next.add(id);
      return next;
    });

  const handleStart = () => {
    const dogIds = Array.from(selectedIds);
    onClose();
    navigate('/walk/active', { state: { dogIds } });
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center"
      onTouchStart={e => e.stopPropagation()}
      style={{ touchAction: 'none' }}
    >
      <div
        className="absolute inset-0 bg-black/40"
        onClick={onClose}
        onTouchStart={e => e.stopPropagation()}
        style={{ touchAction: 'none' }}
      />
      <div className="relative w-full max-w-sm bg-card rounded-t-2xl sm:rounded-2xl shadow-2xl mx-auto max-h-[calc(100dvh-68px)] sm:max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between px-5 pt-5 pb-3">
          <h2 className="font-semibold text-base">Who's coming on the walk?</h2>
          <button onClick={onClose} className="p-1.5 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted transition-colors">
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="px-5 pb-[72px] sm:pb-5 space-y-2">
          {dogs.map(dog => {
            const selected = selectedIds.has(dog.id);
            return (
              <button
                key={dog.id}
                onClick={() => toggleDog(dog.id)}
                className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl border transition-all text-left"
                style={selected ? {
                  borderColor: 'oklch(0.64 0.168 48 / 0.6)',
                  backgroundColor: 'oklch(0.64 0.168 48 / 0.08)',
                } : undefined}
              >
                {dog.photoURL ? (
                  <img src={dog.photoURL} alt={dog.name} className="h-9 w-9 rounded-full object-cover shrink-0" />
                ) : (
                  <div className="h-9 w-9 rounded-full bg-primary/10 flex items-center justify-center text-sm font-semibold text-primary shrink-0">
                    {dog.name.slice(0, 1).toUpperCase()}
                  </div>
                )}
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium capitalize truncate">{dog.name}</p>
                  {dog.breed && <p className="text-xs text-muted-foreground capitalize truncate">{dog.breed}</p>}
                </div>
                <div
                  className="h-5 w-5 rounded-full flex items-center justify-center shrink-0 transition-all"
                  style={{
                    backgroundColor: selected ? 'oklch(0.64 0.168 48)' : 'transparent',
                    border: `1.5px solid ${selected ? 'oklch(0.64 0.168 48)' : 'oklch(0.7 0 0 / 0.3)'}`,
                  }}
                >
                  {selected && <span className="text-[9px] font-bold" style={{ color: 'oklch(0.14 0.014 55)' }}>✓</span>}
                </div>
              </button>
            );
          })}

          <button
            onClick={handleStart}
            disabled={selectedIds.size === 0}
            className="w-full h-11 mt-2 rounded-xl text-sm font-bold transition-all disabled:opacity-40"
            style={{ backgroundColor: 'oklch(0.64 0.168 48)', color: 'oklch(0.14 0.014 55)' }}
          >
            Start Walk{selectedIds.size > 1 ? ` with ${selectedIds.size} dogs` : ''}
          </button>
        </div>
      </div>
    </div>
  );
}
