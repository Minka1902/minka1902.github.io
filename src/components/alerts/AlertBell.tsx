import { useState } from 'react';
import { Bell } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { useDog } from '@/contexts/DogContext';
import { useAlerts } from '@/hooks/useAlerts';
import AlertPanel from './AlertPanel';

export default function AlertBell() {
  const { activeDog } = useDog();
  const alerts = useAlerts(activeDog?.id ?? '');
  const count = alerts.length;
  const [open, setOpen] = useState(false);

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <button
          className="relative p-2 rounded-md hover:bg-muted transition-colors"
          aria-label={count > 0 ? `${count} alerts` : 'No alerts'}
        >
          <Bell className="h-5 w-5" />
          {count > 0 && (
            <Badge className="absolute -top-0.5 -right-0.5 h-5 w-5 p-0 flex items-center justify-center text-xs">
              {count > 9 ? '9+' : count}
            </Badge>
          )}
        </button>
      </PopoverTrigger>
      <PopoverContent align="end" className="w-80 p-0">
        <AlertPanel alerts={alerts} onClose={() => setOpen(false)} />
      </PopoverContent>
    </Popover>
  );
}
