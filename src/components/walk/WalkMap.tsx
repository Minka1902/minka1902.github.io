import { useEffect } from 'react';
import { MapContainer, TileLayer, Polyline, CircleMarker, useMap } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import type { WalkCoord } from '@/hooks/useWalkTracker';

const AMBER = '#D97706';

function MapFollower({ coord }: { coord: WalkCoord | null }) {
  const map = useMap();
  useEffect(() => {
    if (!coord) return;
    const zoom = map.getZoom() < 17 ? 17 : map.getZoom();
    map.setView([coord.lat, coord.lng], zoom, { animate: true, duration: 0.6 });
  }, [coord, map]);
  return null;
}

interface Props {
  coords: WalkCoord[];
}

export default function WalkMap({ coords }: Props) {
  const first = coords[0];
  const current = coords.length > 0 ? coords[coords.length - 1] : null;
  const path = coords.map(c => [c.lat, c.lng] as [number, number]);

  // Sensible fallback center (overridden by MapFollower once GPS kicks in)
  const initialCenter: [number, number] = first ? [first.lat, first.lng] : [32.0853, 34.7818];

  return (
    <MapContainer
      center={initialCenter}
      zoom={17}
      zoomControl={false}
      attributionControl={false}
      className="w-full h-full"
      style={{ background: '#e8e4dc' }}
    >
      <TileLayer
        url="https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png"
        subdomains="abcd"
        maxZoom={20}
      />

      {/* Route trail */}
      {path.length > 1 && (
        <Polyline
          positions={path}
          pathOptions={{ color: AMBER, weight: 5, opacity: 0.9, lineCap: 'round', lineJoin: 'round' }}
        />
      )}

      {/* Start dot */}
      {path.length > 0 && (
        <CircleMarker
          center={path[0]}
          radius={6}
          pathOptions={{ color: 'white', fillColor: '#6B7280', fillOpacity: 1, weight: 2 }}
        />
      )}

      {/* Current position pulse */}
      {current && (
        <>
          <CircleMarker
            center={[current.lat, current.lng]}
            radius={22}
            pathOptions={{ color: AMBER, fillColor: AMBER, fillOpacity: 0.15, weight: 0 }}
          />
          <CircleMarker
            center={[current.lat, current.lng]}
            radius={10}
            pathOptions={{ color: 'white', fillColor: AMBER, fillOpacity: 1, weight: 3 }}
          />
        </>
      )}

      <MapFollower coord={current} />
    </MapContainer>
  );
}
