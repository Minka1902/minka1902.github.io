import type { TrackPoint } from '@/types';

export function haversineM(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371000;
  const toR = (v: number) => v * Math.PI / 180;
  const dLat = toR(lat2 - lat1);
  const dLon = toR(lon2 - lon1);
  const a = Math.sin(dLat / 2) ** 2 +
    Math.cos(toR(lat1)) * Math.cos(toR(lat2)) * Math.sin(dLon / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

export function totalDistanceM(points: TrackPoint[]): number {
  let d = 0;
  for (let i = 1; i < points.length; i++) {
    d += haversineM(points[i - 1].lat, points[i - 1].lng, points[i].lat, points[i].lng);
  }
  return d;
}

export function withSpeeds(points: TrackPoint[]): TrackPoint[] {
  return points.map((pt, i) => {
    if (i === 0) return pt;
    const prev = points[i - 1];
    const dt = (pt.timestamp - prev.timestamp) / 1000;
    if (dt <= 0) return pt;
    const dist = haversineM(prev.lat, prev.lng, pt.lat, pt.lng);
    return { ...pt, speed: dist / dt };
  });
}

export function speedSeriesKmh(points: TrackPoint[], startMs: number): { t: number; v: number }[] {
  return points
    .filter(p => p.speed !== undefined)
    .map(p => ({ t: (p.timestamp - startMs) / 1000, v: (p.speed ?? 0) * 3.6 }));
}

export function maxSpeedKmh(points: TrackPoint[]): number {
  return Math.max(0, ...points.map(p => (p.speed ?? 0) * 3.6));
}

export function avgSpeedKmh(points: TrackPoint[], durationMs: number): number {
  if (durationMs <= 0) return 0;
  return (totalDistanceM(points) / 1000) / (durationMs / 3_600_000);
}

export function fmtDistance(m: number): string {
  return m < 1000 ? `${Math.round(m)} m` : `${(m / 1000).toFixed(2)} km`;
}

export function fmtDuration(ms: number): string {
  const s = Math.floor(ms / 1000);
  const m = Math.floor(s / 60);
  const h = Math.floor(m / 60);
  if (h > 0) return `${h}:${String(m % 60).padStart(2, '0')}:${String(s % 60).padStart(2, '0')}`;
  return `${String(m).padStart(2, '0')}:${String(s % 60).padStart(2, '0')}`;
}
