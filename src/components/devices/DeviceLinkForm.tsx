import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useDevices } from '@/hooks/useDevice';
import type { DeviceProvider } from '@/types';

interface Props {
  dogId: string;
  onSaved: () => void;
}

const PROVIDERS: { value: DeviceProvider; label: string }[] = [
  { value: 'airtag',  label: 'Apple AirTag' },
  { value: 'fi',      label: 'Fi' },
  { value: 'whistle', label: 'Whistle' },
  { value: 'tractive',label: 'Tractive' },
  { value: 'link_ak', label: 'Link AKC' },
  { value: 'other',   label: 'Other' },
];

export default function DeviceLinkForm({ dogId, onSaved }: Props) {
  const { linkDevice } = useDevices(dogId);
  const [provider, setProvider]       = useState<DeviceProvider>('airtag');
  const [deviceName, setDeviceName]   = useState('');
  const [serialNumber, setSerial]     = useState('');
  const [submitting, setSubmitting]   = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    await linkDevice({ provider, deviceName, serialNumber: serialNumber || undefined, isActive: true });
    setSubmitting(false);
    onSaved();
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="space-y-1">
        <Label>Provider</Label>
        <Select value={provider} onValueChange={v => setProvider(v as DeviceProvider)}>
          <SelectTrigger><SelectValue /></SelectTrigger>
          <SelectContent>
            {PROVIDERS.map(p => (
              <SelectItem key={p.value} value={p.value}>{p.label}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      <div className="space-y-1">
        <Label htmlFor="deviceName">Device Name</Label>
        <Input id="deviceName" value={deviceName} onChange={e => setDeviceName(e.target.value)} required placeholder={provider === 'airtag' ? "e.g. Rex's AirTag" : "e.g. Rex's Fi Collar"} />
      </div>
      <div className="space-y-1">
        <Label htmlFor="serial">Serial Number (optional)</Label>
        <Input id="serial" value={serialNumber} onChange={e => setSerial(e.target.value)} />
      </div>
      {provider === 'airtag' && (
        <p className="rounded-lg bg-muted/60 px-3 py-2 text-xs text-muted-foreground">
          Apple doesn't offer a public location API for AirTags, so PackOps can't read it
          automatically. After linking, update your dog's last-known location here from the
          Devices page — pin it on the map or use your phone's current location while your dog
          is with you. Open Apple's <span className="font-medium">Find My</span> app to locate the AirTag live.
        </p>
      )}
      <Button type="submit" className="w-full sm:w-auto" disabled={submitting}>{submitting ? 'Linking…' : 'Link Device'}</Button>
    </form>
  );
}
