import { useEffect } from 'react';
import { MapContainer, TileLayer, Polyline, CircleMarker, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

// Lightweight point shape — works for both live WalkCoord[] and persisted routes.
export interface LatLngPoint { lat: number; lng: number }

const AMBER = '#D97706';

function MapFollower({ coord }: { coord: LatLngPoint | null }) {
  const map = useMap();
  useEffect(() => {
    if (!coord) return;
    const zoom = map.getZoom() < 17 ? 17 : map.getZoom();
    map.setView([coord.lat, coord.lng], zoom, { animate: true, duration: 0.6 });
  }, [coord, map]);
  return null;
}

// Fit the whole route into view once (used for a completed walk overview).
function FitToRoute({ path }: { path: [number, number][] }) {
  const map = useMap();
  useEffect(() => {
    if (path.length === 0) return;
    if (path.length === 1) { map.setView(path[0], 16); return; }
    map.fitBounds(L.latLngBounds(path), { padding: [28, 28] });
  }, [path, map]);
  return null;
}

interface Props {
  coords: LatLngPoint[];
  /** Render a finished route (fit-to-bounds, start+end markers, no follow). */
  completed?: boolean;
}

export default function WalkMap({ coords, completed = false }: Props) {
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

      {/* End / current position */}
      {current && completed ? (
        <CircleMarker
          center={[current.lat, current.lng]}
          radius={6}
          pathOptions={{ color: 'white', fillColor: AMBER, fillOpacity: 1, weight: 2 }}
        />
      ) : current && (
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

      {completed ? <FitToRoute path={path} /> : <MapFollower coord={current} />}
    </MapContainer>
  );
}
