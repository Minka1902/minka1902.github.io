import { useState } from 'react';
import { Bell } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { useDog } from '@/contexts/DogContext';
import { useAlerts } from '@/hooks/useAlerts';
import AlertPanel from './AlertPanel';

export default function AlertBell() {
  const { activeDog } = useDog();
  const alerts = useAlerts(activeDog?.id ?? '');
  const [open, setOpen] = useState(false);
  const count = alerts.length;

  return (
    <div className="relative">
      <button
        onClick={() => setOpen(v => !v)}
        className="relative p-2 rounded-md hover:bg-muted transition-colors"
        aria-label={`${count} alerts`}
      >
        <Bell className="h-5 w-5" />
        {count > 0 && (
          <Badge className="absolute -top-0.5 -right-0.5 h-5 w-5 p-0 flex items-center justify-center text-xs">
            {count > 9 ? '9+' : count}
          </Badge>
        )}
      </button>
      {open && (
        <div className="absolute right-0 top-full mt-2 z-50 w-80">
          <AlertPanel alerts={alerts} onClose={() => setOpen(false)} />
        </div>
      )}
    </div>
  );
}
