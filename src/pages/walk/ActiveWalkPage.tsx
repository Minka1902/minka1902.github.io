import { useEffect, lazy, Suspense } from 'react';
import { useNavigate } from 'react-router-dom';
import { useDog } from '@/contexts/DogContext';
import { useWalkTracker } from '@/hooks/useWalkTracker';
import { X, PawPrint, MapPin, Loader2 } from 'lucide-react';

// Lazy-load the map so Leaflet doesn't pollute the main bundle
const WalkMap = lazy(() => import('@/components/walk/WalkMap'));

function fmt(seconds: number): string {
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = seconds % 60;
  if (h > 0) return `${h}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
  return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
}

export default function ActiveWalkPage() {
  const navigate = useNavigate();
  const { activeDog } = useDog();
  const tracker = useWalkTracker();

  useEffect(() => {
    tracker.start();

    // Keep screen on during walk (where supported)
    let wakeLock: WakeLockSentinel | null = null;
    if ('wakeLock' in navigator) {
      (navigator.wakeLock as WakeLock).request('screen').then(l => { wakeLock = l; }).catch(() => {});
    }

    return () => {
      tracker.stop();
      wakeLock?.release();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleStop = (e: React.MouseEvent) => {
    e.stopPropagation();
    tracker.stop();
    navigate('/walk/summary', {
      replace: true,
      state: {
        elapsedSeconds: tracker.elapsedSeconds,
        distanceKm: tracker.distanceKm,
        avgSpeedKmh: tracker.avgSpeedKmh,
      },
    });
  };

  const handleCancel = () => {
    if (tracker.elapsedSeconds > 5 && !window.confirm('Cancel this walk? Progress will be lost.')) return;
    tracker.stop();
    navigate('/');
  };

  const hasGPS = tracker.coords.length > 0;
  const distStr = tracker.distanceKm >= 0.05 ? `${tracker.distanceKm.toFixed(2)} km` : null;
  const speedStr = tracker.currentSpeedKmh >= 0.5 ? `${tracker.currentSpeedKmh.toFixed(1)} km/h` : null;

  return (
    <div className="fixed inset-0 z-[100] overflow-hidden" style={{ backgroundColor: '#1a1612' }}>
      {/* Map */}
      <Suspense fallback={
        <div className="w-full h-full flex items-center justify-center" style={{ backgroundColor: '#e8e4dc' }}>
          <Loader2 className="h-8 w-8 animate-spin text-amber-600" />
        </div>
      }>
        <WalkMap coords={tracker.coords} />
      </Suspense>

      {/* Top bar */}
      <div className="absolute top-0 inset-x-0 z-[800] pt-safe">
        <div
          className="flex items-center justify-between px-4 py-3"
          style={{ background: 'linear-gradient(to bottom, rgba(0,0,0,0.65) 0%, transparent 100%)' }}
        >
          <div className="flex items-center gap-2">
            <PawPrint className="h-4 w-4" style={{ color: '#F59E0B' }} />
            <span className="text-white text-sm font-semibold capitalize">
              {activeDog?.name ?? 'Walk'}
            </span>
            {!hasGPS && (
              <span className="text-xs text-white/50 flex items-center gap-1">
                <MapPin className="h-3 w-3" /> Finding location…
              </span>
            )}
          </div>
          <button
            onClick={handleCancel}
            className="rounded-full p-2 text-white transition-colors"
            style={{ backgroundColor: 'rgba(0,0,0,0.35)' }}
            aria-label="Cancel walk"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      </div>

      {/* GPS error */}
      {tracker.error && (
        <div className="absolute top-16 inset-x-4 z-[800] rounded-lg px-4 py-3 text-sm text-white" style={{ backgroundColor: 'rgba(220,38,38,0.85)' }}>
          {tracker.error}
        </div>
      )}

      {/* Bottom panel */}
      <div className="absolute bottom-0 inset-x-0 z-[800] px-3 pb-safe pb-4">
        <div
          className="rounded-2xl px-5 pt-5 pb-5"
          style={{ backgroundColor: 'var(--sidebar)' }}
        >
          {/* Timer */}
          <div className="text-center mb-5">
            <p
              className="font-bold leading-none tabular-nums"
              style={{
                fontFamily: 'var(--font-heading)',
                fontSize: 'clamp(3rem, 12vw, 4.5rem)',
                color: 'var(--sidebar-foreground)',
                letterSpacing: '-0.03em',
              }}
            >
              {fmt(tracker.elapsedSeconds)}
            </p>
            <p className="text-xs uppercase tracking-widest mt-1.5" style={{ color: 'oklch(0.50 0.01 55)' }}>
              Duration
            </p>
          </div>

          {/* Stats row */}
          <div className="flex items-center justify-around mb-5 py-3 rounded-xl" style={{ backgroundColor: 'oklch(0.20 0.014 55)' }}>
            <div className="text-center">
              <p className="text-xs uppercase tracking-wider mb-0.5" style={{ color: 'oklch(0.50 0.01 55)' }}>Distance</p>
              <p className="text-lg font-bold tabular-nums" style={{ color: '#F59E0B', fontFamily: 'var(--font-heading)' }}>
                {distStr ?? '—'}
              </p>
            </div>
            <div className="w-px h-8" style={{ backgroundColor: 'oklch(1 0 0 / 8%)' }} />
            <div className="text-center">
              <p className="text-xs uppercase tracking-wider mb-0.5" style={{ color: 'oklch(0.50 0.01 55)' }}>Speed</p>
              <p className="text-lg font-bold tabular-nums" style={{ color: '#F59E0B', fontFamily: 'var(--font-heading)' }}>
                {speedStr ?? '—'}
              </p>
            </div>
          </div>

          {/* Stop button */}
          <button
            onClick={handleStop}
            className="w-full rounded-xl py-3.5 text-sm font-bold tracking-wide transition-opacity active:opacity-80"
            style={{ backgroundColor: '#D97706', color: 'oklch(0.14 0.014 55)' }}
          >
            Stop Walk
          </button>
        </div>
      </div>

    </div>
  );
}
