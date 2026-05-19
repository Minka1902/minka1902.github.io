import { useState, useRef, lazy, Suspense, useCallback } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import {
  MapPin, Play, Pause, Square, Target, Upload,
  ChevronDown, ChevronUp, Check, X, Download, AlertTriangle,
} from 'lucide-react';
import { useDog } from '@/contexts/DogContext';
import { useTrackingSession } from '@/hooks/useTrackingSession';
import SpeedChart from '@/components/training/SpeedChart';
import { fmtDistance, fmtDuration, maxSpeedKmh, avgSpeedKmh } from '@/lib/geoUtils';
import { gpxFromTrack } from '@/lib/gpx';
import { TRAINING_TYPES, TRACKING_TRAINING_TYPES } from '@/lib/constants';
import type { TrainingType, TargetLocation } from '@/types';

const TrackingMap = lazy(() => import('@/components/training/TrackingMap'));

// ── Helpers ───────────────────────────────────────────────────────────────────

function StatPill({ label, value, sub }: { label: string; value: string; sub?: string }) {
  return (
    <div className="flex flex-col items-center">
      <span className="text-[10px] font-bold uppercase tracking-[0.14em]" style={{ color: 'oklch(1 0 0 / 0.35)' }}>
        {label}
      </span>
      <span className="text-xl font-bold tabular-nums leading-none mt-0.5" style={{ color: 'oklch(0.94 0.012 72)', fontFamily: 'var(--font-heading)' }}>
        {value}
      </span>
      {sub && <span className="text-[10px] leading-none mt-0.5" style={{ color: 'oklch(1 0 0 / 0.25)' }}>{sub}</span>}
    </div>
  );
}

// ── Target editor ─────────────────────────────────────────────────────────────

function TargetCard({
  target, index, onUpdate, onRemove, onMarkFound,
}: {
  target: TargetLocation; index: number;
  onUpdate: (id: string, u: Partial<TargetLocation>) => void;
  onRemove: (id: string) => void;
  onMarkFound: (id: string) => void;
}) {
  const statusColor = target.status === 'found' ? 'oklch(0.62 0.14 150)' : target.status === 'missed' ? 'oklch(0.577 0.245 27)' : 'oklch(0.72 0.158 50)';
  return (
    <div className="rounded-xl border bg-card p-3 space-y-2">
      <div className="flex items-center gap-2">
        <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-xs font-bold text-white"
          style={{ backgroundColor: statusColor }}>
          {index + 1}
        </div>
        <input
          value={target.name}
          onChange={e => onUpdate(target.id, { name: e.target.value })}
          className="flex-1 bg-transparent text-sm font-semibold outline-none"
          placeholder="Target name…"
        />
        <button onClick={() => onRemove(target.id)}
          className="p-1 rounded text-muted-foreground hover:text-destructive transition-colors" aria-label="Remove">
          <X className="h-3.5 w-3.5" />
        </button>
      </div>
      <input
        value={target.description ?? ''}
        onChange={e => onUpdate(target.id, { description: e.target.value })}
        className="w-full bg-muted/50 rounded-lg px-2.5 py-1.5 text-xs outline-none placeholder:text-muted-foreground/50"
        placeholder="Description / notes…"
      />
      {target.status === 'active' && (
        <div className="flex gap-2">
          <button onClick={() => onMarkFound(target.id)}
            className="flex-1 flex items-center justify-center gap-1.5 py-1.5 rounded-lg text-xs font-semibold transition-all"
            style={{ backgroundColor: 'oklch(0.62 0.14 150 / 0.12)', color: 'oklch(0.62 0.14 150)' }}>
            <Check className="h-3 w-3" /> Found
          </button>
          <button onClick={() => onUpdate(target.id, { status: 'missed' })}
            className="flex-1 flex items-center justify-center gap-1.5 py-1.5 rounded-lg text-xs font-semibold transition-all"
            style={{ backgroundColor: 'oklch(0.577 0.245 27 / 0.10)', color: 'oklch(0.577 0.245 27)' }}>
            <X className="h-3 w-3" /> Missed
          </button>
        </div>
      )}
      {target.status !== 'active' && (
        <p className="text-xs font-semibold" style={{ color: statusColor }}>
          {target.status === 'found' ? '✓ Found' : '✗ Missed'}
          {target.foundAt ? ` at ${new Date(target.foundAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}` : ''}
        </p>
      )}
    </div>
  );
}

// ── Training type selector ────────────────────────────────────────────────────

const TRACKING_TYPES_META = TRAINING_TYPES.filter(t => TRACKING_TRAINING_TYPES.includes(t.type as TrainingType));

// ── Main page ─────────────────────────────────────────────────────────────────

type Tab = 'live' | 'targets' | 'report';

export default function TrackingSessionPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { activeDog } = useDog();

  const initType = (searchParams.get('type') ?? 'tracking') as TrainingType;

  const sess = useTrackingSession(activeDog?.id ?? '');

  const [selectedType, setSelectedType] = useState<TrainingType>(initType);
  const [addTargetMode, setAddTargetMode] = useState(false);
  const [tab, setTab] = useState<Tab>('live');
  const [panelOpen, setPanelOpen] = useState(false);
  const [ending, setEnding] = useState(false);
  const [notes, setNotes] = useState('');
  const [gpxError, setGpxError] = useState<string | null>(null);
  const gpxInputRef = useRef<HTMLInputElement>(null);

  const handleStart = useCallback(() => {
    sess.start(selectedType);
    setPanelOpen(false);
  }, [sess, selectedType]);

  const handleEnd = useCallback(async () => {
    setEnding(true);
    await sess.end(notes);
    setEnding(false);
    setTab('report');
    setPanelOpen(true);
  }, [sess, notes]);

  const handleMapClick = useCallback((lat: number, lng: number) => {
    if (!addTargetMode) return;
    sess.addTarget(lat, lng);
    setAddTargetMode(false);
    setTab('targets');
    setPanelOpen(true);
  }, [addTargetMode, sess]);

  const handleGpxImport = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setGpxError(null);
    const reader = new FileReader();
    reader.onload = ev => {
      try {
        sess.importDogGpx(ev.target?.result as string);
      } catch {
        setGpxError('Could not read GPX file. Ensure it was exported from Garmin Connect.');
      }
    };
    reader.readAsText(file);
    e.target.value = '';
  }, [sess]);

  const handleExportGpx = useCallback(() => {
    if (sess.handlerTrack.length === 0) return;
    const gpx = gpxFromTrack(sess.handlerTrack, `${activeDog?.name ?? 'Handler'} - ${selectedType}`);
    const blob = new Blob([gpx], { type: 'application/gpx+xml' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = `packops-${selectedType}-${Date.now()}.gpx`;
    a.click();
  }, [sess.handlerTrack, activeDog?.name, selectedType]);

  if (!activeDog) {
    return (
      <div className="flex h-screen items-center justify-center text-muted-foreground">
        No active dog selected.
      </div>
    );
  }

  const isActive  = sess.status === 'active';
  const isPaused  = sess.status === 'paused';
  const isRunning = isActive || isPaused;
  const isEnded   = sess.status === 'ended';

  return (
    <div className="fixed inset-0 flex flex-col" style={{ background: 'oklch(0.135 0.016 50)' }}>

      {/* ── Top HUD ── */}
      <div
        className="relative z-20 flex-none px-4 pt-safe pt-4 pb-3"
        style={{ background: 'oklch(0.135 0.016 50)' }}
      >
        {/* Row 1: back + type + end */}
        <div className="flex items-center gap-3 mb-3">
          <button
            onClick={() => navigate(-1)}
            className="flex h-9 w-9 items-center justify-center rounded-xl text-sm shrink-0 transition-all active:scale-95"
            style={{ backgroundColor: 'oklch(1 0 0 / 0.08)', color: 'oklch(1 0 0 / 0.55)' }}
            aria-label="Back"
          >
            ←
          </button>

          {/* Type selector — only shown before session starts */}
          {!isRunning && !isEnded ? (
            <select
              value={selectedType}
              onChange={e => setSelectedType(e.target.value as TrainingType)}
              className="flex-1 rounded-xl px-3 h-9 text-sm font-medium border-0 outline-none appearance-none"
              style={{ background: 'oklch(1 0 0 / 0.08)', color: 'oklch(0.94 0.012 72)' }}
            >
              {TRACKING_TYPES_META.map(t => (
                <option key={t.type} value={t.type}>{t.label}</option>
              ))}
            </select>
          ) : (
            <div className="flex-1">
              <p className="text-xs font-semibold" style={{ color: 'oklch(0.94 0.012 72)' }}>
                {TRAINING_TYPES.find(t => t.type === sess.trainingType)?.label ?? sess.trainingType}
              </p>
              <p className="text-[9px] uppercase tracking-wider" style={{ color: isEnded ? 'oklch(0.62 0.14 150)' : isActive ? 'oklch(0.72 0.158 50)' : 'oklch(1 0 0 / 0.35)' }}>
                {isEnded ? '● Session ended' : isActive ? '● Recording' : '⏸ Paused'}
              </p>
            </div>
          )}

          {isRunning && (
            <button
              onClick={handleEnd}
              disabled={ending}
              className="flex items-center gap-1.5 px-3 h-9 rounded-xl text-xs font-bold transition-all active:scale-95 disabled:opacity-60"
              style={{ backgroundColor: 'oklch(0.577 0.245 27 / 0.18)', color: 'oklch(0.577 0.245 27)' }}
            >
              <Square className="h-3.5 w-3.5" />
              {ending ? 'Saving…' : 'End'}
            </button>
          )}
        </div>

        {/* Row 2: stats */}
        {sess.status !== 'idle' && (
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-px sm:gap-0 sm:divide-x" style={{ borderColor: 'oklch(1 0 0 / 0.1)', backgroundColor: 'oklch(1 0 0 / 0.1)' }}>
            <StatPill label="Time" value={fmtDuration(sess.elapsedMs)} />
            <StatPill label="Handler" value={fmtDistance(sess.handlerDistanceM)} />
            <StatPill label="Dog GPS" value={sess.dogTrack.length > 0 ? fmtDistance(sess.dogDistanceM) : '—'} />
            <StatPill label="Speed" value={`${sess.currentSpeedKmh.toFixed(1)}`} sub="km/h" />
          </div>
        )}

        {/* Start button */}
        {sess.status === 'idle' && (
          <button
            onClick={handleStart}
            className="w-full h-12 rounded-2xl flex items-center justify-center gap-2 font-bold text-sm transition-all active:scale-95"
            style={{ background: 'oklch(0.72 0.158 50)', color: 'oklch(0.13 0.016 50)' }}
          >
            <Play className="h-4 w-4 fill-current" />
            Start {TRACKING_TYPES_META.find(t => t.type === selectedType)?.label ?? 'Session'}
          </button>
        )}
      </div>

      {/* ── Map (fills remaining space) ── */}
      <div
        className="relative flex-1 z-10"
        style={{ cursor: addTargetMode ? 'crosshair' : undefined }}
      >
        <Suspense fallback={
          <div className="flex h-full items-center justify-center text-muted-foreground text-sm">
            Loading map…
          </div>
        }>
          <TrackingMap
            handlerTrack={sess.handlerTrack}
            dogTrack={sess.dogTrack}
            targets={sess.targets}
            addTargetMode={addTargetMode}
            onMapClick={handleMapClick}
            onTargetClick={id => { sess.updateTarget(id, {}); setTab('targets'); setPanelOpen(true); }}
          />
        </Suspense>

        {/* Floating controls over map */}
        <div className="absolute bottom-4 left-4 right-4 z-30 flex items-end gap-2 pointer-events-none">
          {/* GPS error */}
          {sess.gpsError && (
            <div className="pointer-events-auto flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-medium"
              style={{ background: 'oklch(0.577 0.245 27 / 0.9)', color: 'white' }}>
              <AlertTriangle className="h-3.5 w-3.5 shrink-0" />
              {sess.gpsError}
            </div>
          )}

          <div className="ml-auto flex flex-col gap-2 pointer-events-auto">
            {/* Pause/Resume */}
            {isRunning && (
              <button
                onClick={isActive ? sess.pause : sess.resume}
                className="flex h-12 w-12 items-center justify-center rounded-2xl shadow-lg transition-all active:scale-95"
                style={{ background: 'oklch(0.135 0.016 50)', color: 'oklch(0.92 0.010 72)' }}
                aria-label={isActive ? 'Pause' : 'Resume'}
              >
                {isActive ? <Pause className="h-5 w-5" /> : <Play className="h-5 w-5" />}
              </button>
            )}

            {/* Add target */}
            {isRunning && (
              <button
                onClick={() => setAddTargetMode(v => !v)}
                className="flex h-12 w-12 items-center justify-center rounded-2xl shadow-lg transition-all active:scale-95"
                style={{
                  background: addTargetMode ? 'oklch(0.72 0.158 50)' : 'oklch(0.135 0.016 50)',
                  color: addTargetMode ? 'oklch(0.13 0.016 50)' : 'oklch(0.92 0.010 72)',
                }}
                aria-label="Add target"
              >
                <Target className="h-5 w-5" />
              </button>
            )}

            {/* Import dog GPX */}
            {isRunning && (
              <>
                <button
                  onClick={() => gpxInputRef.current?.click()}
                  className="flex h-12 w-12 items-center justify-center rounded-2xl shadow-lg transition-all active:scale-95"
                  style={{ background: 'oklch(0.135 0.016 50)', color: 'oklch(0.92 0.010 72)' }}
                  aria-label="Import dog GPX"
                >
                  <Upload className="h-4.5 w-4.5" />
                </button>
                <input ref={gpxInputRef} type="file" accept=".gpx" className="hidden" onChange={handleGpxImport} />
              </>
            )}
          </div>
        </div>

        {/* "Add target" instruction */}
        {addTargetMode && (
          <div className="absolute top-3 left-1/2 -translate-x-1/2 z-30 px-4 py-2 rounded-2xl text-xs font-semibold shadow-lg"
            style={{ background: 'oklch(0.72 0.158 50)', color: 'oklch(0.13 0.016 50)' }}>
            <MapPin className="inline h-3.5 w-3.5 mr-1" />
            Tap map to place target
          </div>
        )}

        {sess.dogTrack.length > 0 && (
          <div className="absolute top-3 left-3 z-30 flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl text-xs font-medium shadow"
            style={{ background: 'oklch(0.135 0.016 50 / 0.85)', color: 'oklch(0.72 0.158 50)' }}>
            <div className="h-2 w-2 rounded-full" style={{ background: 'oklch(0.72 0.158 50)' }} />
            Dog track loaded · {sess.dogTrack.length} pts
          </div>
        )}

        {gpxError && (
          <div className="absolute top-12 left-3 z-30 px-3 py-2 rounded-xl text-xs text-white shadow"
            style={{ background: 'oklch(0.577 0.245 27 / 0.9)' }}>
            {gpxError}
          </div>
        )}
      </div>

      {/* ── Bottom panel ── */}
      {sess.status !== 'idle' && (
        <div
          className="relative z-20 rounded-t-3xl flex-none"
          style={{ background: 'oklch(0.16 0.018 50)', boxShadow: '0 -4px 24px oklch(0 0 0 / 0.4)' }}
        >
          {/* Drag handle + tab bar */}
          <button
            className="w-full flex flex-col items-center pt-3 pb-0"
            onClick={() => setPanelOpen(v => !v)}
            aria-label={panelOpen ? 'Collapse panel' : 'Expand panel'}
          >
            <div className="w-10 h-1 rounded-full mb-3" style={{ background: 'oklch(1 0 0 / 0.18)' }} />
          </button>

          <div className="flex items-center gap-1 px-4 pb-1">
            {(['live', 'targets', 'report'] as Tab[]).map(t => (
              <button
                key={t}
                onClick={() => { setTab(t); setPanelOpen(true); }}
                className="flex-1 py-2 rounded-xl text-xs font-semibold capitalize transition-all"
                style={{
                  background: tab === t ? 'oklch(1 0 0 / 0.08)' : 'transparent',
                  color: tab === t ? 'oklch(0.94 0.012 72)' : 'oklch(1 0 0 / 0.35)',
                }}
              >
                {t === 'targets' ? `Targets (${sess.targets.length})` : t.charAt(0).toUpperCase() + t.slice(1)}
              </button>
            ))}
            <button
              onClick={() => setPanelOpen(v => !v)}
              className="ml-1 p-1.5 rounded-lg transition-colors"
              style={{ color: 'oklch(1 0 0 / 0.3)' }}
            >
              {panelOpen ? <ChevronDown className="h-4 w-4" /> : <ChevronUp className="h-4 w-4" />}
            </button>
          </div>

          {/* Tab content */}
          {panelOpen && (
            <div className="px-4 pt-2 pb-[88px] max-h-[42vh] overflow-y-auto">

              {/* ── Live tab ── */}
              {tab === 'live' && (
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-3">
                    {[
                      { label: 'Handler distance', value: fmtDistance(sess.handlerDistanceM) },
                      { label: 'Dog distance',     value: sess.dogTrack.length > 0 ? fmtDistance(sess.dogDistanceM) : '—' },
                      { label: 'Targets placed',   value: String(sess.targets.length) },
                      { label: 'Targets found',    value: String(sess.targets.filter(t => t.status === 'found').length) },
                    ].map(({ label, value }) => (
                      <div key={label} className="rounded-2xl p-3" style={{ background: 'oklch(1 0 0 / 0.05)' }}>
                        <p className="text-[10px] uppercase tracking-wider mb-1" style={{ color: 'oklch(1 0 0 / 0.35)' }}>{label}</p>
                        <p className="text-lg font-bold tabular-nums" style={{ fontFamily: 'var(--font-heading)', color: 'oklch(0.94 0.012 72)' }}>{value}</p>
                      </div>
                    ))}
                  </div>

                  {/* Speed chart */}
                  {sess.handlerTrack.length > 5 && (
                    <div className="rounded-2xl p-3" style={{ background: 'oklch(1 0 0 / 0.05)' }}>
                      <p className="text-[10px] uppercase tracking-wider mb-2" style={{ color: 'oklch(1 0 0 / 0.35)' }}>Speed (km/h)</p>
                      <SpeedChart
                        handlerTrack={sess.handlerTrack}
                        dogTrack={sess.dogTrack}
                        startMs={sess.handlerTrack[0]?.timestamp ?? Date.now()}
                        height={100}
                      />
                    </div>
                  )}

                  {/* Dog GPS status */}
                  <div className="rounded-xl border p-3 flex items-start gap-3"
                    style={{ borderColor: 'oklch(1 0 0 / 0.08)', background: 'oklch(1 0 0 / 0.03)' }}>
                    <div className={`h-2.5 w-2.5 rounded-full mt-0.5 shrink-0 ${sess.dogTrack.length > 0 ? '' : 'opacity-30'}`}
                      style={{ background: 'oklch(0.72 0.158 50)' }} />
                    <div className="flex-1">
                      <p className="text-xs font-semibold" style={{ color: 'oklch(0.94 0.012 72)' }}>
                        Dog collar GPS
                      </p>
                      <p className="text-[11px] mt-0.5" style={{ color: 'oklch(1 0 0 / 0.35)' }}>
                        {sess.dogTrack.length > 0
                          ? `Track loaded · ${sess.dogTrack.length} points`
                          : 'Import a GPX file from Garmin Connect after your session (↑ button on map)'}
                      </p>
                    </div>
                  </div>
                </div>
              )}

              {/* ── Targets tab ── */}
              {tab === 'targets' && (
                <div className="space-y-3">
                  {sess.targets.length === 0 ? (
                    <div className="py-8 text-center">
                      <Target className="h-8 w-8 mx-auto mb-2 opacity-20" style={{ color: 'oklch(0.72 0.158 50)' }} />
                      <p className="text-sm text-muted-foreground">No targets placed yet</p>
                      <p className="text-xs text-muted-foreground/60 mt-1">
                        Tap the target icon on the map, then tap a location
                      </p>
                    </div>
                  ) : (
                    sess.targets.map((t, i) => (
                      <TargetCard
                        key={t.id}
                        target={t}
                        index={i}
                        onUpdate={sess.updateTarget}
                        onRemove={sess.removeTarget}
                        onMarkFound={sess.markTargetFound}
                      />
                    ))
                  )}
                </div>
              )}

              {/* ── Report tab ── */}
              {tab === 'report' && (
                <div className="space-y-4">
                  {/* Duration + distance summary */}
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                    {[
                      { label: 'Duration',       value: fmtDuration(sess.elapsedMs) },
                      { label: 'Handler dist.',  value: fmtDistance(sess.handlerDistanceM) },
                      { label: 'Dog dist.',      value: sess.dogTrack.length > 0 ? fmtDistance(sess.dogDistanceM) : '—' },
                    ].map(({ label, value }) => (
                      <div key={label} className="rounded-2xl p-3 text-center" style={{ background: 'oklch(1 0 0 / 0.05)' }}>
                        <p className="text-[9px] uppercase tracking-wider mb-1" style={{ color: 'oklch(1 0 0 / 0.35)' }}>{label}</p>
                        <p className="text-base font-bold tabular-nums" style={{ fontFamily: 'var(--font-heading)', color: 'oklch(0.94 0.012 72)' }}>{value}</p>
                      </div>
                    ))}
                  </div>

                  {/* Speed stats */}
                  <div className="rounded-2xl p-3 space-y-2" style={{ background: 'oklch(1 0 0 / 0.05)' }}>
                    <p className="text-[10px] uppercase tracking-wider" style={{ color: 'oklch(1 0 0 / 0.35)' }}>Handler speed</p>
                    <div className="grid grid-cols-2 gap-2 text-sm">
                      <div>
                        <span className="text-xs" style={{ color: 'oklch(1 0 0 / 0.35)' }}>Max </span>
                        <span className="font-bold tabular-nums" style={{ color: 'oklch(0.94 0.012 72)' }}>
                          {maxSpeedKmh(sess.handlerTrack).toFixed(1)} km/h
                        </span>
                      </div>
                      <div>
                        <span className="text-xs" style={{ color: 'oklch(1 0 0 / 0.35)' }}>Avg </span>
                        <span className="font-bold tabular-nums" style={{ color: 'oklch(0.94 0.012 72)' }}>
                          {avgSpeedKmh(sess.handlerTrack, sess.elapsedMs).toFixed(1)} km/h
                        </span>
                      </div>
                    </div>
                    {sess.dogTrack.length > 0 && (
                      <>
                        <p className="text-[10px] uppercase tracking-wider pt-1" style={{ color: 'oklch(0.72 0.158 50 / 0.7)' }}>Dog collar speed</p>
                        <div className="grid grid-cols-2 gap-2 text-sm">
                          <div>
                            <span className="text-xs" style={{ color: 'oklch(1 0 0 / 0.35)' }}>Max </span>
                            <span className="font-bold tabular-nums" style={{ color: 'oklch(0.72 0.158 50)' }}>
                              {maxSpeedKmh(sess.dogTrack).toFixed(1)} km/h
                            </span>
                          </div>
                          <div>
                            <span className="text-xs" style={{ color: 'oklch(1 0 0 / 0.35)' }}>Avg </span>
                            <span className="font-bold tabular-nums" style={{ color: 'oklch(0.72 0.158 50)' }}>
                              {avgSpeedKmh(sess.dogTrack, sess.elapsedMs).toFixed(1)} km/h
                            </span>
                          </div>
                        </div>
                      </>
                    )}
                  </div>

                  {/* Speed chart */}
                  {sess.handlerTrack.length > 5 && (
                    <div className="rounded-2xl p-3" style={{ background: 'oklch(1 0 0 / 0.05)' }}>
                      <p className="text-[10px] uppercase tracking-wider mb-2" style={{ color: 'oklch(1 0 0 / 0.35)' }}>Speed over time (km/h)</p>
                      <SpeedChart
                        handlerTrack={sess.handlerTrack}
                        dogTrack={sess.dogTrack}
                        startMs={sess.handlerTrack[0]?.timestamp ?? Date.now()}
                        height={120}
                      />
                    </div>
                  )}

                  {/* Targets summary */}
                  {sess.targets.length > 0 && (
                    <div className="rounded-2xl p-3 space-y-2" style={{ background: 'oklch(1 0 0 / 0.05)' }}>
                      <p className="text-[10px] uppercase tracking-wider" style={{ color: 'oklch(1 0 0 / 0.35)' }}>
                        Targets — {sess.targets.filter(t => t.status === 'found').length}/{sess.targets.length} found
                      </p>
                      {sess.targets.map((t, i) => (
                        <div key={t.id} className="flex items-center gap-2 text-xs">
                          <span className="font-bold tabular-nums w-5 text-center"
                            style={{ color: t.status === 'found' ? 'oklch(0.62 0.14 150)' : t.status === 'missed' ? 'oklch(0.577 0.245 27)' : 'oklch(0.72 0.158 50)' }}>
                            {i + 1}
                          </span>
                          <span style={{ color: 'oklch(0.94 0.012 72)' }}>{t.name}</span>
                          <span className="ml-auto font-medium" style={{ color: t.status === 'found' ? 'oklch(0.62 0.14 150)' : 'oklch(0.577 0.245 27)' }}>
                            {t.status}
                          </span>
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Notes */}
                  <div>
                    <p className="text-[10px] uppercase tracking-wider mb-1.5" style={{ color: 'oklch(1 0 0 / 0.35)' }}>Session notes</p>
                    <textarea
                      value={notes}
                      onChange={e => setNotes(e.target.value)}
                      rows={3}
                      placeholder="Observations, conditions, dog performance…"
                      className="w-full rounded-xl px-3 py-2 text-sm resize-none outline-none placeholder:text-muted-foreground/40"
                      style={{ background: 'oklch(1 0 0 / 0.06)', color: 'oklch(0.94 0.012 72)' }}
                      disabled={!isEnded}
                    />
                  </div>

                  {/* Export GPX */}
                  {sess.handlerTrack.length > 0 && (
                    <button
                      onClick={handleExportGpx}
                      className="w-full flex items-center justify-center gap-2 py-3 rounded-2xl text-sm font-semibold transition-all active:scale-95"
                      style={{ background: 'oklch(1 0 0 / 0.06)', color: 'oklch(0.94 0.012 72)' }}
                    >
                      <Download className="h-4 w-4" />
                      Export handler track as GPX
                    </button>
                  )}

                  {/* Back to training */}
                  {isEnded && (
                    <button
                      onClick={() => navigate('/training')}
                      className="w-full py-3 rounded-2xl text-sm font-bold transition-all active:scale-95"
                      style={{ background: 'oklch(0.72 0.158 50)', color: 'oklch(0.13 0.016 50)' }}
                    >
                      Back to Training
                    </button>
                  )}
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
