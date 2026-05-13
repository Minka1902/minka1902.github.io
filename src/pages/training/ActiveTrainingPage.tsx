import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { X, MapPin, Square } from 'lucide-react';
import { useDog } from '@/contexts/DogContext';

function fmt(seconds: number): string {
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = seconds % 60;
  return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
}

export default function ActiveTrainingPage() {
  const navigate = useNavigate();
  const { activeDog } = useDog();
  const [elapsed, setElapsed] = useState(0);
  const [notes, setNotes] = useState('');
  const [gpsEnabled, setGpsEnabled] = useState(false);
  const [gpsError, setGpsError] = useState<string | null>(null);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const watchRef = useRef<number | null>(null);

  useEffect(() => {
    intervalRef.current = setInterval(() => setElapsed(e => e + 1), 1000);
    return () => { if (intervalRef.current) clearInterval(intervalRef.current); };
  }, []);

  const toggleGPS = () => {
    if (gpsEnabled) {
      if (watchRef.current !== null) navigator.geolocation.clearWatch(watchRef.current);
      watchRef.current = null;
      setGpsEnabled(false);
    } else {
      if (!navigator.geolocation) { setGpsError('GPS not available'); return; }
      setGpsError(null);
      setGpsEnabled(true);
      watchRef.current = navigator.geolocation.watchPosition(
        () => {},
        err => setGpsError(err.message),
        { enableHighAccuracy: true },
      );
    }
  };

  useEffect(() => {
    return () => {
      if (watchRef.current !== null) navigator.geolocation.clearWatch(watchRef.current);
    };
  }, []);

  const handleStop = () => {
    if (intervalRef.current) clearInterval(intervalRef.current);
    if (watchRef.current !== null) navigator.geolocation.clearWatch(watchRef.current);
    navigate('/training/new', {
      replace: true,
      state: { elapsedSeconds: elapsed, quickNotes: notes },
    });
  };

  const handleCancel = () => {
    if (elapsed > 30 && !window.confirm('Cancel this session? Progress will be lost.')) return;
    if (intervalRef.current) clearInterval(intervalRef.current);
    if (watchRef.current !== null) navigator.geolocation.clearWatch(watchRef.current);
    navigate('/training');
  };

  return (
    <div className="fixed inset-0 z-[100] flex flex-col" style={{ backgroundColor: '#0f0f12' }}>
      {/* Top bar */}
      <div className="flex items-center justify-between px-5 pt-safe pt-4 pb-3"
        style={{ borderBottom: '1px solid oklch(1 0 0 / 8%)' }}>
        <div className="flex items-center gap-2">
          <span className="text-base">🎯</span>
          <span className="text-sm font-semibold capitalize" style={{ color: '#f0ece4' }}>
            {activeDog?.name ?? 'Training'} session
          </span>
        </div>
        <button onClick={handleCancel} className="p-1.5 rounded-full transition-colors"
          style={{ color: 'oklch(0.5 0 0)', backgroundColor: 'oklch(1 0 0 / 6%)' }}>
          <X className="h-4 w-4" />
        </button>
      </div>

      <div className="flex-1 flex flex-col items-center justify-between px-5 py-8 max-w-sm mx-auto w-full">
        {/* Timer */}
        <div className="flex flex-col items-center gap-4 pt-8">
          <div
            className="tabular-nums font-bold leading-none"
            style={{
              fontFamily: 'var(--font-heading)',
              fontSize: '72px',
              letterSpacing: '-0.04em',
              color: '#f0ece4',
            }}
          >
            {fmt(elapsed)}
          </div>
          <div className="flex items-center gap-1.5">
            <div className="h-2 w-2 rounded-full animate-pulse" style={{ backgroundColor: '#22c55e' }} />
            <span className="text-xs font-medium" style={{ color: 'oklch(0.45 0 0)' }}>Session active</span>
          </div>
        </div>

        {/* GPS toggle */}
        <div className="w-full space-y-2">
          <button
            onClick={toggleGPS}
            className="w-full flex items-center justify-between px-4 py-3 rounded-xl transition-all"
            style={{
              backgroundColor: gpsEnabled ? 'oklch(0.55 0.15 280 / 0.15)' : 'oklch(1 0 0 / 5%)',
              border: `1px solid ${gpsEnabled ? 'oklch(0.55 0.15 280 / 0.4)' : 'oklch(1 0 0 / 8%)'}`,
            }}
          >
            <div className="flex items-center gap-2">
              <MapPin className="h-4 w-4" style={{ color: gpsEnabled ? 'oklch(0.72 0.15 280)' : 'oklch(0.5 0 0)' }} />
              <span className="text-sm font-medium" style={{ color: gpsEnabled ? 'oklch(0.85 0.08 280)' : 'oklch(0.6 0 0)' }}>
                {gpsEnabled ? 'GPS tracking on' : 'Enable GPS tracking'}
              </span>
            </div>
            <div
              className="h-5 w-9 rounded-full relative transition-all"
              style={{ backgroundColor: gpsEnabled ? 'oklch(0.55 0.15 280)' : 'oklch(1 0 0 / 15%)' }}
            >
              <div
                className="absolute top-0.5 h-4 w-4 rounded-full transition-all"
                style={{
                  left: gpsEnabled ? 'calc(100% - 18px)' : '2px',
                  backgroundColor: 'white',
                }}
              />
            </div>
          </button>
          {gpsError && (
            <p className="text-xs text-red-400 px-1">{gpsError}</p>
          )}

          {/* Quick notes */}
          <textarea
            value={notes}
            onChange={e => setNotes(e.target.value)}
            rows={3}
            placeholder="Quick notes (dog's focus, incidents, observations…)"
            className="w-full text-sm rounded-xl px-4 py-3 resize-none outline-none transition-colors"
            style={{
              backgroundColor: 'oklch(1 0 0 / 5%)',
              border: '1px solid oklch(1 0 0 / 8%)',
              color: '#f0ece4',
            }}
          />
        </div>

        {/* Stop button */}
        <button
          onClick={handleStop}
          className="w-full h-14 rounded-2xl text-sm font-bold flex items-center justify-center gap-2 transition-all active:scale-[0.98]"
          style={{ backgroundColor: 'oklch(0.55 0.15 280)', color: 'white' }}
        >
          <Square className="h-4 w-4 fill-current" />
          Stop & Log Session
        </button>
      </div>
    </div>
  );
}
