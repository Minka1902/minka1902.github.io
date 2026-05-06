import { useState } from 'react';
import { useDog } from '@/contexts/DogContext';
import { useDevices } from '@/hooks/useDevice';
import DeviceCard from '@/components/devices/DeviceCard';
import DeviceLinkForm from '@/components/devices/DeviceLinkForm';
import DeviceActivitySummary from '@/components/devices/DeviceActivitySummary';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';

export default function DevicesPage() {
  const { activeDog } = useDog();
  const dogId = activeDog?.id ?? '';
  const { devices, unlinkDevice, getStubActivity } = useDevices(dogId);
  const [showForm, setShowForm] = useState(false);

  if (!activeDog) {
    return <p className="text-muted-foreground">No dog selected.</p>;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Devices</h1>
        <Button onClick={() => setShowForm(true)}>Link Device</Button>
      </div>

      {devices.length === 0 ? (
        <Card>
          <CardContent className="py-8 text-center text-muted-foreground">
            No devices linked yet. Link a GPS collar or activity tracker.
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2">
          {devices.map(device => (
            <div key={device.id} className="space-y-2">
              <DeviceCard device={device} onUnlink={unlinkDevice} />
              <Card>
                <CardHeader className="pb-1 pt-3">
                  <CardTitle className="text-xs text-muted-foreground">Latest Activity (stub)</CardTitle>
                </CardHeader>
                <CardContent className="pb-3">
                  {getStubActivity(device.id).map(a => (
                    <DeviceActivitySummary key={a.timestamp} activity={a} />
                  ))}
                </CardContent>
              </Card>
            </div>
          ))}
        </div>
      )}

      <Dialog open={showForm} onOpenChange={setShowForm}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Link a Device</DialogTitle>
          </DialogHeader>
          <DeviceLinkForm dogId={dogId} onSaved={() => setShowForm(false)} />
        </DialogContent>
      </Dialog>
    </div>
  );
}
