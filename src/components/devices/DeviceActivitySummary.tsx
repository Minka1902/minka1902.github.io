import { Footprints, Moon, MapPin } from 'lucide-react';
import type { DeviceActivity } from '@/types';

interface Props {
  activity: DeviceActivity;
}

export default function DeviceActivitySummary({ activity }: Props) {
  return (
    <div className="flex gap-4 text-sm text-muted-foreground flex-wrap">
      {activity.stepCount !== undefined && (
        <span className="flex items-center gap-1">
          <Footprints className="h-4 w-4" />
          {activity.stepCount.toLocaleString()} steps
        </span>
      )}
      {activity.sleepMin !== undefined && (
        <span className="flex items-center gap-1">
          <Moon className="h-4 w-4" />
          {Math.round(activity.sleepMin / 60)}h sleep
        </span>
      )}
      {activity.distanceKm !== undefined && (
        <span className="flex items-center gap-1">
          <MapPin className="h-4 w-4" />
          {activity.distanceKm.toFixed(1)} km
        </span>
      )}
    </div>
  );
}
