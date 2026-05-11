import 'leaflet/dist/leaflet.css';
import L from 'leaflet';
import { MapContainer, TileLayer, Polyline, Marker, LayersControl, useMapEvents, Popup } from 'react-leaflet';
import { useEffect, useRef } from 'react';
import type { TrackPoint, TargetLocation } from '@/types';

// ── Custom divIcon markers ────────────────────────────────────────────────────

function divIcon(html: string, size: [number, number] = [24, 24]) {
  return L.divIcon({ html, className: '', iconSize: size, iconAnchor: [size[0] / 2, size[1] / 2] });
}

const handlerIcon = divIcon(`
  <div style="
    width:20px;height:20px;border-radius:50%;
    background:oklch(0.58 0.18 250);
    border:3px solid white;
    box-shadow:0 0 0 2px oklch(0.58 0.18 250),0 2px 8px rgba(0,0,0,0.5);
    animation:pulse-handler 2s ease-in-out infinite;">
  </div>
  <style>
    @keyframes pulse-handler {
      0%,100%{box-shadow:0 0 0 2px oklch(0.58 0.18 250),0 2px 8px rgba(0,0,0,0.5)}
      50%{box-shadow:0 0 0 6px oklch(0.58 0.18 250 / 0.3),0 2px 8px rgba(0,0,0,0.5)}
    }
  </style>
`);

const dogIcon = divIcon(`
  <div style="
    width:20px;height:20px;border-radius:50%;
    background:oklch(0.72 0.158 50);
    border:3px solid white;
    box-shadow:0 0 0 2px oklch(0.72 0.158 50),0 2px 8px rgba(0,0,0,0.5);
    animation:pulse-dog 1.6s ease-in-out infinite;">
  </div>
  <style>
    @keyframes pulse-dog {
      0%,100%{box-shadow:0 0 0 2px oklch(0.72 0.158 50),0 2px 8px rgba(0,0,0,0.5)}
      50%{box-shadow:0 0 0 8px oklch(0.72 0.158 50 / 0.25),0 2px 8px rgba(0,0,0,0.5)}
    }
  </style>
`);

function targetIcon(n: number, status: TargetLocation['status']) {
  const bg = status === 'found' ? 'oklch(0.62 0.14 150)' : status === 'missed' ? 'oklch(0.577 0.245 27)' : 'oklch(0.72 0.158 50)';
  return divIcon(`
    <div style="
      width:28px;height:28px;border-radius:50% 50% 50% 0;
      transform:rotate(-45deg);
      background:${bg};
      border:2px solid white;
      box-shadow:0 2px 8px rgba(0,0,0,0.4);
      display:flex;align-items:center;justify-content:center;">
      <span style="transform:rotate(45deg);font-size:11px;font-weight:700;color:white;display:block;text-align:center;line-height:24px;">${n}</span>
    </div>
  `, [28, 28]);
}

// ── Map click handler ─────────────────────────────────────────────────────────

function MapClickHandler({ addTargetMode, onMapClick }: {
  addTargetMode: boolean;
  onMapClick: (lat: number, lng: number) => void;
}) {
  useMapEvents({
    click(e) {
      if (addTargetMode) onMapClick(e.latlng.lat, e.latlng.lng);
    },
  });
  return null;
}

// ── Auto-center on handler position ──────────────────────────────────────────

function AutoCenter({ position }: { position: [number, number] | null }) {
  const map = useMapEvents({});
  const hascentered = useRef(false);
  useEffect(() => {
    if (position && !hascentered.current) {
      map.setView(position, 17);
      hascentered.current = true;
    }
  }, [position, map]);
  return null;
}

// ── Main map component ────────────────────────────────────────────────────────

interface Props {
  handlerTrack: TrackPoint[];
  dogTrack: TrackPoint[];
  targets: TargetLocation[];
  addTargetMode: boolean;
  onMapClick: (lat: number, lng: number) => void;
  onTargetClick: (id: string) => void;
}

export default function TrackingMap({
  handlerTrack, dogTrack, targets,
  addTargetMode, onMapClick, onTargetClick,
}: Props) {
  const handlerPos = handlerTrack.length > 0
    ? [handlerTrack[handlerTrack.length - 1].lat, handlerTrack[handlerTrack.length - 1].lng] as [number, number]
    : null;
  const dogPos = dogTrack.length > 0
    ? [dogTrack[dogTrack.length - 1].lat, dogTrack[dogTrack.length - 1].lng] as [number, number]
    : null;

  const handlerPolyline = handlerTrack.map(p => [p.lat, p.lng] as [number, number]);
  const dogPolyline     = dogTrack.map(p => [p.lat, p.lng] as [number, number]);

  return (
    <MapContainer
      center={handlerPos ?? [51.505, -0.09]}
      zoom={handlerPos ? 17 : 13}
      style={{ width: '100%', height: '100%' }}
      zoomControl={false}
      cursor={addTargetMode ? 'crosshair' : undefined}
    >
      <LayersControl position="topright">
        <LayersControl.BaseLayer name="Satellite" checked>
          <TileLayer
            url="https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}"
            attribution="Esri, Maxar, Earthstar Geographics"
            maxZoom={19}
          />
        </LayersControl.BaseLayer>
        <LayersControl.BaseLayer name="Streets">
          <TileLayer
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            attribution="© OpenStreetMap contributors"
            maxZoom={19}
          />
        </LayersControl.BaseLayer>
      </LayersControl>

      <MapClickHandler addTargetMode={addTargetMode} onMapClick={onMapClick} />
      <AutoCenter position={handlerPos} />

      {/* Handler track */}
      {handlerPolyline.length > 1 && (
        <Polyline
          positions={handlerPolyline}
          pathOptions={{ color: 'oklch(0.58 0.18 250)', weight: 3, opacity: 0.8 }}
        />
      )}

      {/* Dog track */}
      {dogPolyline.length > 1 && (
        <Polyline
          positions={dogPolyline}
          pathOptions={{ color: 'oklch(0.72 0.158 50)', weight: 3, opacity: 0.8, dashArray: '8 4' }}
        />
      )}

      {/* Handler position marker */}
      {handlerPos && <Marker position={handlerPos} icon={handlerIcon} />}

      {/* Dog position marker */}
      {dogPos && <Marker position={dogPos} icon={dogIcon} />}

      {/* Target markers */}
      {targets.map((t, i) => (
        <Marker
          key={t.id}
          position={[t.lat, t.lng]}
          icon={targetIcon(i + 1, t.status)}
          eventHandlers={{ click: () => onTargetClick(t.id) }}
        >
          <Popup>
            <strong>{t.name}</strong>
            {t.description && <><br /><span style={{ fontSize: 12 }}>{t.description}</span></>}
          </Popup>
        </Marker>
      ))}
    </MapContainer>
  );
}
