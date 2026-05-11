import { useState, useRef, useCallback, useEffect } from 'react';
import { addDoc, doc, updateDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { trackingSessionsCol } from '@/lib/firestore';
import { haversineM, totalDistanceM, maxSpeedKmh, avgSpeedKmh } from '@/lib/geoUtils';
import { parseGpx } from '@/lib/gpx';
import { useAuth } from '@/hooks/useAuth';
import type { TrackPoint, TargetLocation, TrackingSessionData } from '@/types';
import type { TrainingType } from '@/types';

export type SessionStatus = 'idle' | 'active' | 'paused' | 'ended';

let _targetSeq = 0;
const nextTargetId = () => `t${++_targetSeq}_${Date.now()}`;

export function useTrackingSession(dogId: string) {
  const { user } = useAuth();

  const [status, setStatus]              = useState<SessionStatus>('idle');
  const [trainingType, setTrainingType]  = useState<TrainingType>('tracking');
  const [handlerTrack, setHandlerTrack]  = useState<TrackPoint[]>([]);
  const [dogTrack, setDogTrack]          = useState<TrackPoint[]>([]);
  const [targets, setTargets]            = useState<TargetLocation[]>([]);
  const [elapsedMs, setElapsedMs]        = useState(0);
  const [currentSpeedKmh, setCurrentSpeedKmh] = useState(0);
  const [gpsError, setGpsError]          = useState<string | null>(null);
  const [savedId, setSavedId]            = useState<string | null>(null);

  const watchIdRef   = useRef<number | null>(null);
  const timerRef     = useRef<ReturnType<typeof setInterval> | null>(null);
  const startMsRef   = useRef(0);
  const pausedMsRef  = useRef(0); // accumulated paused time
  const pauseStartRef = useRef(0);
  const docIdRef     = useRef<string | null>(null);

  const stopGeo = () => {
    if (watchIdRef.current != null) {
      navigator.geolocation.clearWatch(watchIdRef.current);
      watchIdRef.current = null;
    }
  };

  const stopTimer = () => {
    if (timerRef.current) { clearInterval(timerRef.current); timerRef.current = null; }
  };

  const startGeo = useCallback((appendTrack: (pt: TrackPoint) => void) => {
    if (!navigator.geolocation) { setGpsError('Geolocation not supported'); return; }
    watchIdRef.current = navigator.geolocation.watchPosition(
      pos => {
        const pt: TrackPoint = {
          lat: pos.coords.latitude,
          lng: pos.coords.longitude,
          timestamp: pos.timestamp,
          alt: pos.coords.altitude ?? undefined,
        };
        appendTrack(pt);
      },
      err => setGpsError(err.message),
      { enableHighAccuracy: true, timeout: 15000, maximumAge: 2000 },
    );
  }, []);

  const start = useCallback((type: TrainingType) => {
    setTrainingType(type);
    setHandlerTrack([]);
    setDogTrack([]);
    setTargets([]);
    setElapsedMs(0);
    setCurrentSpeedKmh(0);
    setGpsError(null);
    setSavedId(null);
    docIdRef.current = null;
    pausedMsRef.current = 0;
    startMsRef.current = Date.now();

    timerRef.current = setInterval(() => {
      setElapsedMs(Date.now() - startMsRef.current - pausedMsRef.current);
    }, 1000);

    startGeo(pt => {
      setHandlerTrack(prev => {
        if (prev.length > 0) {
          const last = prev[prev.length - 1];
          const dist = haversineM(last.lat, last.lng, pt.lat, pt.lng);
          if (dist < 2) return prev; // filter GPS noise < 2 m
          const dt = (pt.timestamp - last.timestamp) / 1000;
          if (dt > 0) {
            pt.speed = dist / dt;
            setCurrentSpeedKmh(Math.min(pt.speed * 3.6, 60));
          }
        }
        return [...prev, pt];
      });
    });

    setStatus('active');
  }, [startGeo]);

  const pause = useCallback(() => {
    stopGeo();
    stopTimer();
    pauseStartRef.current = Date.now();
    setStatus('paused');
  }, []);

  const resume = useCallback(() => {
    pausedMsRef.current += Date.now() - pauseStartRef.current;
    timerRef.current = setInterval(() => {
      setElapsedMs(Date.now() - startMsRef.current - pausedMsRef.current);
    }, 1000);
    startGeo(pt => {
      setHandlerTrack(prev => [...prev, pt]);
    });
    setStatus('active');
  }, [startGeo]);

  const end = useCallback(async (notes?: string): Promise<string> => {
    stopGeo();
    stopTimer();
    setStatus('ended');

    const endedAt = Date.now();
    const durationMs = endedAt - startMsRef.current - pausedMsRef.current;

    // Snapshot current state via a Promise-wrapped setState callback
    return new Promise(resolve => {
      setHandlerTrack(ht => {
        setDogTrack(dt => {
          setTargets(tgts => {
            const stats = {
              handlerDistanceM: totalDistanceM(ht),
              dogDistanceM: totalDistanceM(dt),
              durationMs,
              maxHandlerSpeedKmh: maxSpeedKmh(ht),
              avgHandlerSpeedKmh: avgSpeedKmh(ht, durationMs),
              maxDogSpeedKmh: maxSpeedKmh(dt),
              avgDogSpeedKmh: avgSpeedKmh(dt, durationMs),
            };

            const payload: Omit<TrackingSessionData, 'id'> = {
              dogId,
              trainingType,
              createdBy: user!.uid,
              createdByName: user!.displayName,
              startedAt: startMsRef.current,
              endedAt,
              handlerTrack: ht,
              dogTrack: dt,
              targets: tgts,
              stats,
              notes: notes ?? undefined,
            };

            if (docIdRef.current) {
              updateDoc(doc(db, 'dogs', dogId, 'trackingSessions', docIdRef.current), {
                ...payload, updatedAt: Date.now(),
              }).then(() => resolve(docIdRef.current!));
            } else {
              addDoc(trackingSessionsCol(dogId), payload).then(ref => {
                docIdRef.current = ref.id;
                setSavedId(ref.id);
                resolve(ref.id);
              });
            }

            return tgts;
          });
          return dt;
        });
        return ht;
      });
    });
  }, [dogId, trainingType, user]);

  const importDogGpx = useCallback((gpxText: string) => {
    const pts = parseGpx(gpxText);
    setDogTrack(pts);
  }, []);

  const addTarget = useCallback((lat: number, lng: number): string => {
    const id = nextTargetId();
    const n = targets.length + 1;
    setTargets(prev => [...prev, {
      id, lat, lng,
      name: `Target ${n}`,
      description: '',
      status: 'active',
    }]);
    return id;
  }, [targets.length]);

  const updateTarget = useCallback((id: string, updates: Partial<TargetLocation>) => {
    setTargets(prev => prev.map(t => t.id === id ? { ...t, ...updates } : t));
  }, []);

  const removeTarget = useCallback((id: string) => {
    setTargets(prev => prev.filter(t => t.id !== id));
  }, []);

  const markTargetFound = useCallback((id: string) => {
    setTargets(prev => prev.map(t =>
      t.id === id ? { ...t, status: 'found', foundAt: Date.now() } : t
    ));
  }, []);

  // Cleanup on unmount
  useEffect(() => () => { stopGeo(); stopTimer(); }, []);

  const handlerDistanceM = totalDistanceM(handlerTrack);
  const dogDistanceM     = totalDistanceM(dogTrack);

  return {
    status, trainingType,
    handlerTrack, dogTrack, targets,
    elapsedMs, currentSpeedKmh,
    handlerDistanceM, dogDistanceM,
    gpsError, savedId,
    start, pause, resume, end,
    importDogGpx,
    addTarget, updateTarget, removeTarget, markTargetFound,
  };
}
