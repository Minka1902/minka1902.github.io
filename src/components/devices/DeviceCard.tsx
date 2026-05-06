import { Cpu, Battery, WifiOff } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { fmtDate, timeAgo } from '@/lib/utils';
import type { Device } from '@/types';

interface Props {
  device: Device;
  onUnlink: (deviceId: string) => void;
}

const PROVIDER_LABELS: Record<string, string> = {
  fi: 'Fi',
  whistle: 'Whistle',
  tractive: 'Tractive',
  link_ak: 'Link AKC',
  other: 'Other',
};

export default function DeviceCard({ device, onUnlink }: Props) {
  const isStale = device.lastSyncAt ? Date.now() - device.lastSyncAt > 2 * 60 * 60 * 1000 : false;
  const lowBattery = device.batteryPercent !== undefined && device.batteryPercent < 20;

  return (
    <Card>
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <CardTitle className="text-sm flex items-center gap-2">
            <Cpu className="h-4 w-4" />
            {device.deviceName}
          </CardTitle>
          <span className="text-xs text-muted-foreground">{PROVIDER_LABELS[device.provider] ?? device.provider}</span>
        </div>
      </CardHeader>
      <CardContent className="space-y-1 text-sm">
        {device.serialNumber && (
          <p className="text-muted-foreground">S/N: {device.serialNumber}</p>
        )}
        <div className="flex items-center gap-4 text-xs text-muted-foreground">
          {device.batteryPercent !== undefined && (
            <span className={lowBattery ? 'text-destructive' : ''}>
              <Battery className="inline h-3 w-3 mr-1" />
              {device.batteryPercent}%
            </span>
          )}
          {isStale && (
            <span className="text-amber-600 flex items-center gap-1">
              <WifiOff className="h-3 w-3" /> Disconnected
            </span>
          )}
          {device.lastSyncAt && (
            <span>Last sync: {timeAgo(device.lastSyncAt)}</span>
          )}
        </div>
        <p className="text-xs text-muted-foreground">Linked {fmtDate(device.linkedAt)} by {device.linkedByName}</p>
        <Button
          variant="destructive"
          size="sm"
          className="mt-2"
          onClick={() => onUnlink(device.id)}
        >
          Unlink
        </Button>
      </CardContent>
    </Card>
  );
}
