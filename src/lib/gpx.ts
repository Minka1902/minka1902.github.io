import type { TrackPoint } from '@/types';
import { haversineM } from './geoUtils';

export function parseGpx(gpxText: string): TrackPoint[] {
  const doc = new DOMParser().parseFromString(gpxText, 'application/xml');
  if (doc.querySelector('parsererror')) throw new Error('Invalid GPX file');

  const trkpts = Array.from(doc.querySelectorAll('trkpt'));
  const points: TrackPoint[] = [];

  for (const pt of trkpts) {
    const lat = parseFloat(pt.getAttribute('lat') ?? '');
    const lng = parseFloat(pt.getAttribute('lon') ?? '');
    if (isNaN(lat) || isNaN(lng)) continue;

    const timeEl = pt.querySelector('time');
    const eleEl  = pt.querySelector('ele');
    const timestamp = timeEl?.textContent ? new Date(timeEl.textContent).getTime() : Date.now();
    const alt = eleEl?.textContent ? parseFloat(eleEl.textContent) : undefined;

    points.push({ lat, lng, timestamp, alt });
  }

  // Calculate per-point speeds from adjacent points
  for (let i = 1; i < points.length; i++) {
    const dt = (points[i].timestamp - points[i - 1].timestamp) / 1000;
    if (dt > 0) {
      const dist = haversineM(points[i - 1].lat, points[i - 1].lng, points[i].lat, points[i].lng);
      points[i].speed = dist / dt; // m/s
    }
  }

  // Decimate to max 600 points to stay within Firestore doc limits
  if (points.length > 600) {
    const step = Math.ceil(points.length / 600);
    return points.filter((_, i) => i % step === 0 || i === points.length - 1);
  }

  return points;
}

export function gpxFromTrack(points: TrackPoint[], name = 'Handler Track'): string {
  const trkpts = points.map(p =>
    `    <trkpt lat="${p.lat}" lon="${p.lng}">` +
    (p.alt != null ? `<ele>${p.alt.toFixed(1)}</ele>` : '') +
    `<time>${new Date(p.timestamp).toISOString()}</time>` +
    `</trkpt>`
  ).join('\n');

  return `<?xml version="1.0" encoding="UTF-8"?>
<gpx version="1.1" creator="PackOps" xmlns="http://www.topografix.com/GPX/1/1">
  <trk><name>${name}</name><trkseg>
${trkpts}
  </trkseg></trk>
</gpx>`;
}
