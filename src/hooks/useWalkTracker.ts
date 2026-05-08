import { useState, useEffect, useRef, useCallback } from 'react';

export interface WalkCoord {
  lat: number;
  lng: number;
  timestamp: number;
}

function haversineKm(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371;
  const toRad = (v: number) => (v * Math.PI) / 180;
  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLon / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

export function useWalkTracker() {
  const [coords, setCoords] = useState<WalkCoord[]>([]);
  const [elapsedSeconds, setElapsedSeconds] = useState(0);
  const [distanceKm, setDistanceKm] = useState(0);
  const [currentSpeedKmh, setCurrentSpeedKmh] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [isTracking, setIsTracking] = useState(false);

  const watchIdRef = useRef<number | null>(null);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const startTimeRef = useRef<number>(0);
  const distanceRef = useRef(0);

  const start = useCallback(() => {
    if (!navigator.geolocation) {
      setError('Geolocation is not supported by this browser.');
      return;
    }
    setIsTracking(true);
    setCoords([]);
    setDistanceKm(0);
    setElapsedSeconds(0);
    distanceRef.current = 0;
    startTimeRef.current = Date.now();

    timerRef.current = setInterval(() => {
      setElapsedSeconds(Math.floor((Date.now() - startTimeRef.current) / 1000));
    }, 1000);

    watchIdRef.current = navigator.geolocation.watchPosition(
      (pos) => {
        const newCoord: WalkCoord = {
          lat: pos.coords.latitude,
          lng: pos.coords.longitude,
          timestamp: pos.timestamp,
        };
        setCoords(prev => {
          if (prev.length > 0) {
            const last = prev[prev.length - 1];
            const segKm = haversineKm(last.lat, last.lng, newCoord.lat, newCoord.lng);
            if (segKm < 0.003) return prev; // filter noise < 3 m
            const timeDiffH = (newCoord.timestamp - last.timestamp) / 3_600_000;
            if (timeDiffH > 0) setCurrentSpeedKmh(Math.min(segKm / timeDiffH, 25));
            distanceRef.current += segKm;
            setDistanceKm(distanceRef.current);
          }
          return [...prev, newCoord];
        });
      },
      (err) => setError(err.message),
      { enableHighAccuracy: true, timeout: 15000, maximumAge: 2000 },
    );
  }, []);

  const stop = useCallback(() => {
    setIsTracking(false);
    if (timerRef.current) { clearInterval(timerRef.current); timerRef.current = null; }
    if (watchIdRef.current !== null) {
      navigator.geolocation.clearWatch(watchIdRef.current);
      watchIdRef.current = null;
    }
  }, []);

  useEffect(() => () => {
    if (timerRef.current) clearInterval(timerRef.current);
    if (watchIdRef.current !== null) navigator.geolocation.clearWatch(watchIdRef.current);
  }, []);

  const avgSpeedKmh =
    elapsedSeconds > 30 && distanceKm > 0
      ? distanceKm / (elapsedSeconds / 3600)
      : currentSpeedKmh;

  return { coords, elapsedSeconds, distanceKm, avgSpeedKmh, currentSpeedKmh, error, isTracking, start, stop };
}
