import 'leaflet/dist/leaflet.css';
import L from 'leaflet';
import { useState, useCallback, useEffect } from 'react';
import { MapContainer, TileLayer, Marker, useMapEvents, useMap } from 'react-leaflet';
import { Search, LocateFixed, Loader2, MapPin, X, Map } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from '@/components/ui/dialog';
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
  useEffect(() => { map.flyTo([lat, lng], 15, { duration: 0.8 }); }, [lat, lng, map]);
  return null;
}

function MapClickHandler({ onPick }: { onPick: (lat: number, lng: number) => void }) {
  useMapEvents({ click(e) { onPick(e.latlng.lat, e.latlng.lng); } });
  return null;
}

const DEFAULT_CENTER: [number, number] = [20, 0];
const DEFAULT_ZOOM = 2;

interface MapPickerDialogProps {
  open: boolean;
  onClose: () => void;
  value: HomeLocation;
  onConfirm: (location: HomeLocation) => void;
}

export function MapPickerDialog({ open, onClose, value, onConfirm }: MapPickerDialogProps) {
  const [draft, setDraft] = useState<HomeLocation>(value);
  const [searching, setSearching] = useState(false);
  const [locating, setLocating] = useState(false);
  const [searchErr, setSearchErr] = useState('');

  useEffect(() => { if (open) setDraft(value); }, [open, value]);

  const hasPin = draft.lat !== undefined && draft.lng !== undefined;

  const handleSearch = useCallback(async () => {
    if (!draft.address.trim()) return;
    setSearching(true);
    setSearchErr('');
    try {
      const result = await forwardGeocode(draft.address.trim());
      if (!result) { setSearchErr('Address not found'); return; }
      setDraft({ address: result.display_name, lat: result.lat, lng: result.lng });
    } catch {
      setSearchErr('Search failed');
    } finally {
      setSearching(false);
    }
  }, [draft.address]);

  const handleGPS = useCallback(() => {
    if (!navigator.geolocation) { setSearchErr('Geolocation not supported'); return; }
    setLocating(true);
    setSearchErr('');
    navigator.geolocation.getCurrentPosition(
      async pos => {
        const { latitude: lat, longitude: lng } = pos.coords;
        try {
          const addr = await reverseGeocode(lat, lng);
          setDraft({ address: addr, lat, lng });
        } catch {
          setDraft(d => ({ ...d, lat, lng }));
        } finally {
          setLocating(false);
        }
      },
      () => { setSearchErr('Could not get location'); setLocating(false); },
      { timeout: 10000 }
    );
  }, []);

  const handleMapPick = useCallback(async (lat: number, lng: number) => {
    setDraft(d => ({ ...d, lat, lng }));
    try {
      const addr = await reverseGeocode(lat, lng);
      if (addr) setDraft({ address: addr, lat, lng });
    } catch { /* keep existing address */ }
  }, []);

  const handleMarkerDrag = useCallback(async (lat: number, lng: number) => {
    setDraft(d => ({ ...d, lat, lng }));
    try {
      const addr = await reverseGeocode(lat, lng);
      if (addr) setDraft({ address: addr, lat, lng });
    } catch { /* keep existing address */ }
  }, []);

  return (
    <Dialog open={open} onOpenChange={v => { if (!v) onClose(); }}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Pick Location</DialogTitle>
        </DialogHeader>

        <div className="space-y-3">
          <div className="flex gap-2">
            <Input
              value={draft.address}
              onChange={e => setDraft(d => ({ ...d, address: e.target.value }))}
              onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); handleSearch(); } }}
              placeholder="Search address…"
              className="flex-1"
            />
            <button
              type="button"
              onClick={handleSearch}
              disabled={searching || !draft.address.trim()}
              className="flex items-center gap-1.5 h-9 px-3 rounded-lg border border-input bg-transparent text-sm text-muted-foreground hover:text-foreground hover:bg-muted transition-colors disabled:opacity-40 shrink-0"
              aria-label="Search"
            >
              {searching ? <Loader2 className="h-4 w-4 animate-spin" /> : <Search className="h-4 w-4" />}
            </button>
          </div>

          <button
            type="button"
            onClick={handleGPS}
            disabled={locating}
            className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors disabled:opacity-50"
          >
            {locating ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <LocateFixed className="h-3.5 w-3.5" />}
            {locating ? 'Detecting location…' : 'Use my current location'}
          </button>

          {searchErr && <p className="text-xs text-destructive">{searchErr}</p>}

          <div className="relative rounded-xl overflow-hidden border border-border/60 shadow-sm" style={{ height: 320 }}>
            <MapContainer
              center={hasPin ? [draft.lat!, draft.lng!] : DEFAULT_CENTER}
              zoom={hasPin ? 15 : DEFAULT_ZOOM}
              style={{ height: '100%', width: '100%' }}
              zoomControl={true}
              attributionControl={false}
            >
              <TileLayer url="https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png" />
              <MapClickHandler onPick={handleMapPick} />
              {hasPin && (
                <>
                  <MapController lat={draft.lat!} lng={draft.lng!} />
                  <Marker
                    position={[draft.lat!, draft.lng!]}
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

            {!hasPin && (
              <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-[500]">
                <div className="flex items-center gap-1.5 bg-background/90 backdrop-blur-sm border border-border/60 rounded-full px-3 py-1.5 text-xs text-muted-foreground shadow-sm">
                  <MapPin className="h-3 w-3" />
                  Click map to pin location
                </div>
              </div>
            )}

            {hasPin && (
              <button
                type="button"
                onClick={() => setDraft(d => ({ ...d, lat: undefined, lng: undefined }))}
                className="absolute top-2 right-2 z-[500] flex items-center gap-1 bg-background/90 backdrop-blur-sm border border-border/60 rounded-full px-2 py-1 text-[10px] text-muted-foreground hover:text-foreground transition-colors shadow-sm"
              >
                <X className="h-2.5 w-2.5" /> Clear pin
              </button>
            )}
          </div>

          {hasPin && (
            <p className="text-[11px] text-muted-foreground/70 tabular-nums">
              {draft.lat!.toFixed(5)}, {draft.lng!.toFixed(5)} · drag pin to adjust
            </p>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" type="button" onClick={onClose}>Cancel</Button>
          <Button type="button" onClick={() => { onConfirm(draft); onClose(); }}>
            Confirm Location
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

export default function AddressLocationPicker({ value, onChange }: Props) {
  const [mapOpen, setMapOpen] = useState(false);
  const [locating, setLocating] = useState(false);
  const [gpsErr, setGpsErr] = useState('');

  const handleGPS = useCallback(() => {
    if (!navigator.geolocation) { setGpsErr('Geolocation not supported'); return; }
    setLocating(true);
    setGpsErr('');
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
      () => { setGpsErr('Could not get location'); setLocating(false); },
      { timeout: 10000 }
    );
  }, [onChange, value]);

  const hasPin = value.lat !== undefined && value.lng !== undefined;

  return (
    <div className="space-y-2">
      <Label htmlFor="home-address">Home Address</Label>

      <div className="flex gap-2">
        <Input
          id="home-address"
          value={value.address}
          onChange={e => onChange({ ...value, address: e.target.value })}
          placeholder="Street address…"
          className="flex-1"
        />
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={() => setMapOpen(true)}
          className="shrink-0 gap-1.5"
        >
          <Map className="h-3.5 w-3.5" />
          {hasPin ? 'Edit on Map' : 'Open Map'}
        </Button>
      </div>

      <button
        type="button"
        onClick={handleGPS}
        disabled={locating}
        className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors disabled:opacity-50"
      >
        {locating ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <LocateFixed className="h-3.5 w-3.5" />}
        {locating ? 'Detecting location…' : 'Use my current location'}
      </button>

      {gpsErr && <p className="text-xs text-destructive">{gpsErr}</p>}

      {hasPin && (
        <p className="text-[11px] text-muted-foreground/70 tabular-nums">
          📍 {value.lat!.toFixed(5)}, {value.lng!.toFixed(5)} ·{' '}
          <button type="button" className="underline" onClick={() => setMapOpen(true)}>
            adjust on map
          </button>
        </p>
      )}

      <MapPickerDialog
        open={mapOpen}
        onClose={() => setMapOpen(false)}
        value={value}
        onConfirm={onChange}
      />
    </div>
  );
}
