import { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { addDoc } from 'firebase/firestore';
import { MapPin, Clock, Zap, TrendingUp } from 'lucide-react';
import { useDog } from '@/contexts/DogContext';
import { useRoutine } from '@/hooks/useRoutine';
import { useAuth } from '@/hooks/useAuth';
import { routinesCol } from '@/lib/firestore';
import { stripUndefined } from '@/lib/utils';

interface WalkState {
  elapsedSeconds: number;
  distanceKm: number;
  avgSpeedKmh: number;
  dogIds?: string[];
}

function fmtDuration(seconds: number): string {
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

interface StatProps { icon: React.ReactNode; label: string; value: string; sub?: string }
function Stat({ icon, label, value, sub }: StatProps) {
  return (
    <div
      className="flex flex-col items-center gap-2 p-5 rounded-2xl"
      style={{ backgroundColor: 'oklch(0.18 0.014 55)', border: '1px solid oklch(1 0 0 / 6%)' }}
    >
      <div className="text-amber-400 opacity-70">{icon}</div>
      <div
        className="text-3xl font-bold tabular-nums leading-none"
        style={{ fontFamily: 'var(--font-heading)', color: '#F8F0E3', letterSpacing: '-0.03em' }}
      >
        {value}
      </div>
      <div className="text-center">
        <p className="text-[10px] uppercase tracking-widest font-semibold" style={{ color: 'oklch(0.52 0.01 55)' }}>
          {label}
        </p>
        {sub && <p className="text-[10px]" style={{ color: 'oklch(0.42 0.01 55)' }}>{sub}</p>}
      </div>
    </div>
  );
}

export default function WalkSummaryPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const { activeDog } = useDog();
  const { user } = useAuth();
  const { logRoutine } = useRoutine(activeDog?.id ?? '');

  const state = location.state as WalkState | null;
  const dogIds = state?.dogIds;
  const extraDogIds = dogIds ? dogIds.filter(id => id !== activeDog?.id) : [];
  const [peed, setPeed] = useState(false);
  const [pooped, setPooped] = useState(false);
  const [saving, setSaving] = useState(false);

  // If no state, this page was reached directly — redirect home
  if (!state || !activeDog) {
    navigate('/', { replace: true });
    return null;
  }

  const { elapsedSeconds, distanceKm, avgSpeedKmh } = state;
  const distStr = distanceKm >= 0.05 ? `${distanceKm.toFixed(2)}` : '<0.05';
  const speedStr = avgSpeedKmh >= 0.5 ? `${avgSpeedKmh.toFixed(1)}` : '—';
  const paceStr = pace(distanceKm, elapsedSeconds);

  const handleSave = async () => {
    setSaving(true);
    const now = Date.now();
    const walkStats = {
      walkDurationMin: Math.round(elapsedSeconds / 60 * 10) / 10,
      walkDistanceKm: parseFloat(distanceKm.toFixed(3)),
      walkAvgSpeedKmh: parseFloat(avgSpeedKmh.toFixed(2)),
      timestamp: now,
    };
    const walkId = await logRoutine('walk', walkStats);
    if (peed)   await logRoutine('pee',  { timestamp: now, parentLogId: walkId });
    if (pooped) await logRoutine('poop', { timestamp: now, parentLogId: walkId });

    // Log for additional dogs sharing the walk
    await Promise.all(extraDogIds.map(async dogId => {
      const ref = await addDoc(routinesCol(dogId), stripUndefined({
        dogId, type: 'walk', source: 'manual',
        loggedBy: user!.uid, loggedByName: user!.displayName,
        ...walkStats,
      }));
      if (peed)   await addDoc(routinesCol(dogId), stripUndefined({ dogId, type: 'pee',  timestamp: now, source: 'manual', loggedBy: user!.uid, loggedByName: user!.displayName, parentLogId: ref.id }));
      if (pooped) await addDoc(routinesCol(dogId), stripUndefined({ dogId, type: 'poop', timestamp: now, source: 'manual', loggedBy: user!.uid, loggedByName: user!.displayName, parentLogId: ref.id }));
    }));

    navigate('/routine', { replace: true });
  };

  return (
    <div
      className="fixed inset-0 z-[100] flex flex-col overflow-y-auto"
      style={{ backgroundColor: 'oklch(0.14 0.014 55)' }}
    >
      <div className="flex-1 flex flex-col max-w-md mx-auto w-full px-5 pt-12 pb-8">

        {/* Header */}
        <div className="flex flex-col items-center mb-10">
          <div
            className="h-16 w-16 rounded-full flex items-center justify-center mb-4"
            style={{ backgroundColor: '#F59E0B18', border: '2px solid #F59E0B40' }}
          >
            <span className="text-3xl">🐾</span>
          </div>
          <h1
            className="text-3xl font-bold"
            style={{ fontFamily: 'var(--font-heading)', color: '#F8F0E3', letterSpacing: '-0.02em' }}
          >
            Walk Complete
          </h1>
          <p className="text-sm mt-1.5 capitalize" style={{ color: 'oklch(0.52 0.01 55)' }}>
            {dogIds && dogIds.length > 1 ? `${dogIds.length} dogs` : activeDog.name} · great job!
          </p>
        </div>

        {/* Stats grid */}
        <div className="grid grid-cols-2 gap-3 mb-8">
          <Stat icon={<Clock className="h-5 w-5" />} label="Duration" value={fmtDuration(elapsedSeconds)} />
          <Stat icon={<MapPin className="h-5 w-5" />} label="Distance" value={distStr} sub="km" />
          <Stat icon={<Zap className="h-5 w-5" />} label="Avg Speed" value={speedStr} sub="km/h" />
          <Stat icon={<TrendingUp className="h-5 w-5" />} label="Pace" value={paceStr} sub="min/km" />
        </div>

        {/* Pee / poop */}
        <div
          className="rounded-2xl p-4 mb-8 space-y-3"
          style={{ backgroundColor: 'oklch(0.18 0.014 55)', border: '1px solid oklch(1 0 0 / 6%)' }}
        >
          <p
            className="text-[10px] uppercase tracking-widest font-semibold"
            style={{ color: 'oklch(0.52 0.01 55)' }}
          >
            Also log for {activeDog.name}
          </p>

          <button
            onClick={() => setPeed(p => !p)}
            className="w-full flex items-center justify-between py-2.5 px-3 rounded-xl transition-all"
            style={{
              backgroundColor: peed ? '#84CC1618' : 'transparent',
              border: `1.5px solid ${peed ? '#84CC1660' : 'oklch(1 0 0 / 8%)'}`,
            }}
          >
            <span className="text-sm font-medium" style={{ color: '#F8F0E3' }}>🌿 Went pee</span>
            <div
              className="h-5 w-5 rounded-full flex items-center justify-center transition-all"
              style={{
                backgroundColor: peed ? '#84CC16' : 'oklch(1 0 0 / 8%)',
                border: `1.5px solid ${peed ? '#84CC16' : 'oklch(1 0 0 / 20%)'}`,
              }}
            >
              {peed && <span className="text-[10px] text-black font-bold">✓</span>}
            </div>
          </button>

          <button
            onClick={() => setPooped(p => !p)}
            className="w-full flex items-center justify-between py-2.5 px-3 rounded-xl transition-all"
            style={{
              backgroundColor: pooped ? '#A78BFA18' : 'transparent',
              border: `1.5px solid ${pooped ? '#A78BFA60' : 'oklch(1 0 0 / 8%)'}`,
            }}
          >
            <span className="text-sm font-medium" style={{ color: '#F8F0E3' }}>💩 Went poop</span>
            <div
              className="h-5 w-5 rounded-full flex items-center justify-center transition-all"
              style={{
                backgroundColor: pooped ? '#A78BFA' : 'oklch(1 0 0 / 8%)',
                border: `1.5px solid ${pooped ? '#A78BFA' : 'oklch(1 0 0 / 20%)'}`,
              }}
            >
              {pooped && <span className="text-[10px] text-black font-bold">✓</span>}
            </div>
          </button>
        </div>

        {/* Save */}
        <button
          onClick={handleSave}
          disabled={saving}
          className="w-full h-14 rounded-2xl text-sm font-bold tracking-wide transition-opacity disabled:opacity-60 active:scale-[0.98]"
          style={{ backgroundColor: '#F59E0B', color: 'oklch(0.14 0.014 55)' }}
        >
          {saving ? 'Saving…' : 'Save Walk'}
        </button>

        <button
          onClick={() => navigate('/', { replace: true })}
          className="mt-3 w-full h-10 text-sm transition-opacity"
          style={{ color: 'oklch(0.42 0.01 55)' }}
          disabled={saving}
        >
          Discard walk
        </button>
      </div>
    </div>
  );
}
