import 'leaflet/dist/leaflet.css';
import L from 'leaflet';
import { useState } from 'react';
import { MapContainer, TileLayer, Marker } from 'react-leaflet';
import { MapPin, LocateFixed, Loader2, Navigation } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { MapPickerDialog } from '@/components/dog/AddressLocationPicker';
import { useDevices } from '@/hooks/useDevice';
import { timeAgo } from '@/lib/utils';
import type { Device, HomeLocation } from '@/types';

const DOG_PIN = L.divIcon({
  html: `<svg width="28" height="36" viewBox="0 0 28 36" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M14 0C6.268 0 0 6.268 0 14c0 5.28 2.88 9.888 7.14 12.36L14 36l6.86-9.64C25.12 23.888 28 19.28 28 14 28 6.268 21.732 0 14 0z" fill="oklch(0.62 0.158 48)"/>
    <circle cx="14" cy="14" r="6" fill="white" fill-opacity="0.95"/>
    <circle cx="14" cy="14" r="3" fill="oklch(0.62 0.158 48)"/>
  </svg>`,
  className: '',
  iconSize: [28, 36],
  iconAnchor: [14, 36],
});

interface Props {
  device: Device;
  dogId: string;
  dogName: string;
}

export default function DeviceLocationPanel({ device, dogId, dogName }: Props) {
  const { updateDeviceLocation } = useDevices(dogId);
  const [pickerOpen, setPickerOpen] = useState(false);
  const [locating, setLocating] = useState(false);
  const [error, setError] = useState('');
  const loc = device.lastLocation;

  const handleUseCurrent = () => {
    if (!navigator.geolocation) { setError('Geolocation not supported.'); return; }
    setLocating(true);
    setError('');
    navigator.geolocation.getCurrentPosition(
      async pos => {
        try {
          await updateDeviceLocation(device.id, { lat: pos.coords.latitude, lng: pos.coords.longitude });
        } finally {
          setLocating(false);
        }
      },
      () => { setError('Could not get your location.'); setLocating(false); },
      { timeout: 10000 },
    );
  };

  const handleConfirm = async (next: HomeLocation) => {
    if (next.lat === undefined || next.lng === undefined) return;
    await updateDeviceLocation(device.id, { lat: next.lat, lng: next.lng, address: next.address || undefined });
  };

  return (
    <Card className="border-dashed">
      <CardHeader className="pb-1 pt-3 px-4">
        <CardTitle className="text-xs font-medium text-muted-foreground flex items-center gap-1.5">
          <Navigation className="h-3.5 w-3.5" /> Location
        </CardTitle>
      </CardHeader>
      <CardContent className="px-4 pb-3 space-y-2">
        {loc ? (
          <>
            <div className="relative h-40 w-full overflow-hidden rounded-lg border border-border/60">
              <MapContainer
                key={`${loc.lat},${loc.lng}`}
                center={[loc.lat, loc.lng]}
                zoom={15}
                style={{ height: '100%', width: '100%' }}
                zoomControl={false}
                attributionControl={false}
                dragging={false}
                scrollWheelZoom={false}
                doubleClickZoom={false}
              >
                <TileLayer url="https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png" />
                <Marker position={[loc.lat, loc.lng]} icon={DOG_PIN} />
              </MapContainer>
            </div>
            {loc.address && <p className="text-xs text-muted-foreground">{loc.address}</p>}
            <p className="text-[11px] text-muted-foreground/70">
              Updated {timeAgo(loc.updatedAt)}{loc.updatedByName ? ` by ${loc.updatedByName}` : ''}
            </p>
          </>
        ) : (
          <div className="flex flex-col items-center gap-1 py-4 text-center">
            <MapPin className="h-5 w-5 text-muted-foreground" />
            <p className="text-xs text-muted-foreground">No location yet for {dogName}.</p>
          </div>
        )}

        <div className="flex flex-wrap gap-2 pt-1">
          <Button type="button" variant="outline" size="sm" className="gap-1.5" onClick={handleUseCurrent} disabled={locating}>
            {locating ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <LocateFixed className="h-3.5 w-3.5" />}
            Use current location
          </Button>
          <Button type="button" variant="outline" size="sm" className="gap-1.5" onClick={() => setPickerOpen(true)}>
            <MapPin className="h-3.5 w-3.5" /> {loc ? 'Update on map' : 'Set on map'}
          </Button>
        </div>
        {error && <p className="text-xs text-destructive">{error}</p>}
      </CardContent>

      <MapPickerDialog
        open={pickerOpen}
        onClose={() => setPickerOpen(false)}
        value={{ address: loc?.address ?? '', lat: loc?.lat, lng: loc?.lng }}
        onConfirm={handleConfirm}
      />
    </Card>
  );
}
