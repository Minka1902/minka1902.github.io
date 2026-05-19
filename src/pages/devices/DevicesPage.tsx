import { useState } from 'react';
import { Cpu, PlusCircle } from 'lucide-react';
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
    <div className="space-y-5 max-w-3xl mx-auto lg:flex-1 lg:overflow-y-auto lg:p-4">
      <div className="flex flex-wrap items-center justify-between gap-y-2">
        <h1 className="text-xl sm:text-2xl font-bold tracking-tight">Devices</h1>
        <Button size="sm" onClick={() => setShowForm(true)} className="gap-1.5">
          <PlusCircle className="h-4 w-4" /> Link Device
        </Button>
      </div>

      {devices.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-12 sm:py-20 gap-4 rounded-xl border border-dashed bg-background">
          <div className="flex h-14 w-14 items-center justify-center rounded-full bg-muted">
            <Cpu className="h-7 w-7 text-muted-foreground" />
          </div>
          <div className="text-center">
            <p className="font-semibold">No devices linked</p>
            <p className="text-sm text-muted-foreground mt-1">Link a GPS collar or activity tracker to see <span className="capitalize">{activeDog.name}</span>'s data here.</p>
          </div>
          <Button variant="outline" size="sm" onClick={() => setShowForm(true)} className="gap-1.5">
            <PlusCircle className="h-4 w-4" /> Link First Device
          </Button>
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2">
          {devices.map(device => (
            <div key={device.id} className="space-y-2">
              <DeviceCard device={device} onUnlink={unlinkDevice} />
              <Card className="border-dashed">
                <CardHeader className="pb-1 pt-3 px-4">
                  <CardTitle className="text-xs font-medium text-muted-foreground">Latest Activity</CardTitle>
                </CardHeader>
                <CardContent className="pb-3 px-4">
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
