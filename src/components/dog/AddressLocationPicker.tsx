import 'leaflet/dist/leaflet.css';
import L from 'leaflet';
import { useState, useCallback, useEffect } from 'react';
import { MapContainer, TileLayer, Marker, useMapEvents, useMap } from 'react-leaflet';
import { Search, LocateFixed, Loader2, MapPin, X } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import type { HomeLocation } from '@/types';

interface Props {
  value: HomeLocation;
  onChange: (location: HomeLocation) => void;
}

const PIN_ICON = L.divIcon({
  html: `<svg width="28" height="36" viewBox="0 0 28 36" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M14 0C6.268 0 0 6.268 0 14c0 5.28 2.88 9.888 7.14 12.36L14 36l6.86-9.64C25.12 23.888 28 19.28 28 14 28 6.268 21.732 0 14 0z" fill="oklch(0.64 0.168 48)"/>
    <circle cx="14" cy="14" r="6" fill="white" fill-opacity="0.95"/>
    <circle cx="14" cy="14" r="3" fill="oklch(0.64 0.168 48)"/>
  </svg>`,
  className: '',
  iconSize: [28, 36],
  iconAnchor: [14, 36],
});

async function reverseGeocode(lat: number, lng: number): Promise<string> {
  const res = await fetch(
    `https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lng}&format=json`,
    { headers: { 'Accept-Language': 'en' } }
  );
  const data = await res.json();
  return data.display_name ?? '';
}

async function forwardGeocode(query: string): Promise<{ lat: number; lng: number; display_name: string } | null> {
  const res = await fetch(
    `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(query)}&format=json&limit=1`,
    { headers: { 'Accept-Language': 'en' } }
  );
  const results = await res.json();
  if (!results.length) return null;
  return { lat: parseFloat(results[0].lat), lng: parseFloat(results[0].lon), display_name: results[0].display_name };
}

function MapController({ lat, lng }: { lat: number; lng: number }) {
  const map = useMap();
  useEffect(() => {
    map.flyTo([lat, lng], 15, { duration: 0.8 });
  }, [lat, lng, map]);
  return null;
}

function MapClickHandler({ onPick }: { onPick: (lat: number, lng: number) => void }) {
  useMapEvents({
    click(e) { onPick(e.latlng.lat, e.latlng.lng); },
  });
  return null;
}

const DEFAULT_CENTER: [number, number] = [20, 0];
const DEFAULT_ZOOM = 2;

export default function AddressLocationPicker({ value, onChange }: Props) {
  const [searching, setSearching] = useState(false);
  const [locating, setLocating] = useState(false);
  const [searchErr, setSearchErr] = useState('');

  const hasPin = value.lat !== undefined && value.lng !== undefined;

  const handleSearch = useCallback(async () => {
    if (!value.address.trim()) return;
    setSearching(true);
    setSearchErr('');
    try {
      const result = await forwardGeocode(value.address.trim());
      if (!result) { setSearchErr('Address not found'); return; }
      onChange({ address: result.display_name, lat: result.lat, lng: result.lng });
    } catch {
      setSearchErr('Search failed');
    } finally {
      setSearching(false);
    }
  }, [value.address, onChange]);

  const handleGPS = useCallback(() => {
    if (!navigator.geolocation) { setSearchErr('Geolocation not supported'); return; }
    setLocating(true);
    setSearchErr('');
    navigator.geolocation.getCurrentPosition(
      async pos => {
        const { latitude: lat, longitude: lng } = pos.coords;
        try {
          const addr = await reverseGeocode(lat, lng);
          onChange({ address: addr, lat, lng });
        } catch {
          onChange({ ...value, lat, lng });
        } finally {
          setLocating(false);
        }
      },
      () => { setSearchErr('Could not get location'); setLocating(false); },
      { timeout: 10000 }
    );
  }, [onChange, value]);

  const handleMapPick = useCallback(async (lat: number, lng: number) => {
    onChange({ ...value, lat, lng });
    try {
      const addr = await reverseGeocode(lat, lng);
      if (addr) onChange({ address: addr, lat, lng });
    } catch { /* keep existing address */ }
  }, [value, onChange]);

  const handleMarkerDrag = useCallback(async (lat: number, lng: number) => {
    onChange({ ...value, lat, lng });
    try {
      const addr = await reverseGeocode(lat, lng);
      if (addr) onChange({ address: addr, lat, lng });
    } catch { /* keep existing address */ }
  }, [value, onChange]);

  const clearPin = useCallback(() => {
    onChange({ address: value.address, lat: undefined, lng: undefined });
  }, [value.address, onChange]);

  return (
    <div className="space-y-2">
      <Label htmlFor="home-address">Home Address</Label>

      {/* Address input + search */}
      <div className="flex gap-2">
        <Input
          id="home-address"
          value={value.address}
          onChange={e => onChange({ ...value, address: e.target.value })}
          onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); handleSearch(); } }}
          placeholder="Street address…"
          className="flex-1"
        />
        <button
          type="button"
          onClick={handleSearch}
          disabled={searching || !value.address.trim()}
          className="flex items-center gap-1.5 h-9 px-3 rounded-lg border border-input bg-transparent text-sm text-muted-foreground hover:text-foreground hover:bg-muted transition-colors disabled:opacity-40 shrink-0"
          aria-label="Search address"
        >
          {searching ? <Loader2 className="h-4 w-4 animate-spin" /> : <Search className="h-4 w-4" />}
        </button>
      </div>

      {/* GPS button */}
      <button
        type="button"
        onClick={handleGPS}
        disabled={locating}
        className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors disabled:opacity-50"
      >
        {locating
          ? <Loader2 className="h-3.5 w-3.5 animate-spin" />
          : <LocateFixed className="h-3.5 w-3.5" />}
        {locating ? 'Detecting location…' : 'Use my current location'}
      </button>

      {searchErr && (
        <p className="text-xs text-destructive">{searchErr}</p>
      )}

      {/* Map */}
      <div className="relative rounded-xl overflow-hidden border border-border/60 shadow-sm" style={{ height: 200 }}>
        <MapContainer
          center={hasPin ? [value.lat!, value.lng!] : DEFAULT_CENTER}
          zoom={hasPin ? 15 : DEFAULT_ZOOM}
          style={{ height: '100%', width: '100%' }}
          zoomControl={false}
          attributionControl={false}
        >
          <TileLayer
            url="https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png"
          />
          <MapClickHandler onPick={handleMapPick} />
          {hasPin && (
            <>
              <MapController lat={value.lat!} lng={value.lng!} />
              <Marker
                position={[value.lat!, value.lng!]}
                icon={PIN_ICON}
                draggable
                eventHandlers={{
                  dragend(e) {
                    const { lat, lng } = (e.target as L.Marker).getLatLng();
                    handleMarkerDrag(lat, lng);
                  },
                }}
              />
            </>
          )}
        </MapContainer>

        {/* Overlay hint when no pin */}
        {!hasPin && (
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-[500]">
            <div className="flex items-center gap-1.5 bg-background/90 backdrop-blur-sm border border-border/60 rounded-full px-3 py-1.5 text-xs text-muted-foreground shadow-sm">
              <MapPin className="h-3 w-3" />
              Click map to pin location
            </div>
          </div>
        )}

        {/* Clear pin button */}
        {hasPin && (
          <button
            type="button"
            onClick={clearPin}
            className="absolute top-2 right-2 z-[500] flex items-center gap-1 bg-background/90 backdrop-blur-sm border border-border/60 rounded-full px-2 py-1 text-[10px] text-muted-foreground hover:text-foreground transition-colors shadow-sm"
          >
            <X className="h-2.5 w-2.5" /> Clear pin
          </button>
        )}
      </div>

      {hasPin && (
        <p className="text-[11px] text-muted-foreground/70 tabular-nums">
          {value.lat!.toFixed(5)}, {value.lng!.toFixed(5)} · drag pin to adjust
        </p>
      )}
    </div>
  );
}
