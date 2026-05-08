import { useState } from 'react';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { CheckCircle2 } from 'lucide-react';

export interface WalkResult {
  elapsedSeconds: number;
  distanceKm: number;
  avgSpeedKmh: number;
}

interface Props {
  open: boolean;
  dogName: string;
  result: WalkResult;
  onSave: (peed: boolean, pooped: boolean) => Promise<void>;
}

function fmt(seconds: number): string {
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = seconds % 60;
  if (h > 0) return `${h}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
  return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
}

function pace(distanceKm: number, seconds: number): string {
  if (distanceKm < 0.05) return '—';
  const mpk = seconds / 60 / distanceKm;
  return `${Math.floor(mpk)}:${String(Math.round((mpk % 1) * 60)).padStart(2, '0')}`;
}

function StatCard({ label, value, sub }: { label: string; value: string; sub?: string }) {
  return (
    <div className="bg-muted/60 rounded-xl p-4 text-center space-y-1">
      <p className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground">{label}</p>
      <p className="text-2xl font-bold leading-none" style={{ fontFamily: 'var(--font-heading)', letterSpacing: '-0.02em' }}>
        {value}
      </p>
      {sub && <p className="text-xs text-muted-foreground">{sub}</p>}
    </div>
  );
}

export default function WalkSummarySheet({ open, dogName, result, onSave }: Props) {
  const [peed, setPeed] = useState(false);
  const [pooped, setPooped] = useState(false);
  const [saving, setSaving] = useState(false);

  const handleSave = async () => {
    setSaving(true);
    await onSave(peed, pooped);
  };

  const { elapsedSeconds, distanceKm, avgSpeedKmh } = result;
  const distStr = distanceKm >= 0.05 ? `${distanceKm.toFixed(2)} km` : '< 50 m';
  const speedStr = avgSpeedKmh >= 0.5 ? `${avgSpeedKmh.toFixed(1)} km/h` : '—';
  const paceStr = pace(distanceKm, elapsedSeconds);

  return (
    <Sheet open={open}>
      <SheetContent side="bottom" className="rounded-t-2xl max-h-[90vh] overflow-y-auto pb-8" showCloseButton={false}>
        <SheetHeader className="pt-2 pb-5">
          <div className="flex flex-col items-center gap-2">
            <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
              <CheckCircle2 className="h-5 w-5 text-primary" />
            </div>
            <SheetTitle className="text-xl" style={{ fontFamily: 'var(--font-heading)' }}>
              Walk complete
            </SheetTitle>
          </div>
        </SheetHeader>

        {/* Stats grid */}
        <div className="grid grid-cols-2 gap-3 mb-6">
          <StatCard label="Duration" value={fmt(elapsedSeconds)} />
          <StatCard label="Distance" value={distStr} />
          <StatCard label="Avg Speed" value={speedStr} />
          <StatCard label="Pace" value={paceStr} sub="min / km" />
        </div>

        {/* Pee / poop toggles */}
        <div className="rounded-xl border bg-card px-4 py-3 mb-6 space-y-3">
          <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">
            Did {dogName} also…
          </p>
          <div className="flex items-center justify-between">
            <Label htmlFor="peed" className="text-sm cursor-pointer">Go pee? 🌿</Label>
            <Switch id="peed" checked={peed} onCheckedChange={setPeed} />
          </div>
          <div className="flex items-center justify-between">
            <Label htmlFor="pooped" className="text-sm cursor-pointer">Go poop? 💩</Label>
            <Switch id="pooped" checked={pooped} onCheckedChange={setPooped} />
          </div>
        </div>

        <Button className="w-full h-12 text-sm font-semibold" onClick={handleSave} disabled={saving}>
          {saving ? 'Saving…' : 'Save Walk'}
        </Button>
      </SheetContent>
    </Sheet>
  );
}
