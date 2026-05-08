import { AlertTriangle, Info, XCircle, Bell } from 'lucide-react';
import { Link } from 'react-router-dom';
import { cn } from '@/lib/utils';
import type { Alert } from '@/types';

interface Props {
  alerts: Alert[];
  onClose?: () => void;
}

const SEVERITY_CONFIG = {
  critical: { icon: XCircle,       bg: 'bg-destructive/10', text: 'text-destructive',   iconColor: 'text-destructive' },
  warning:  { icon: AlertTriangle, bg: 'bg-amber-50 dark:bg-amber-950/30', text: 'text-amber-800 dark:text-amber-300', iconColor: 'text-amber-500' },
  info:     { icon: Info,          bg: 'bg-blue-50 dark:bg-blue-950/30',   text: 'text-blue-800 dark:text-blue-300',  iconColor: 'text-blue-500' },
};

export default function AlertPanel({ alerts, onClose }: Props) {
  return (
    <div className="flex flex-col">
      <div className="flex items-center gap-2 px-4 py-3 border-b">
        <Bell className="h-4 w-4 text-muted-foreground" />
        <span className="text-sm font-semibold">Alerts</span>
        {alerts.length > 0 && (
          <span className="ml-auto text-xs text-muted-foreground">{alerts.length} active</span>
        )}
      </div>

      {alerts.length === 0 ? (
        <div className="px-4 py-8 text-center text-sm text-muted-foreground">
          All clear — no alerts right now.
        </div>
      ) : (
        <div className="max-h-80 overflow-y-auto divide-y">
          {alerts.map(alert => {
            const { icon: Icon, bg, text, iconColor } = SEVERITY_CONFIG[alert.severity];
            const inner = (
              <div className={cn('flex items-start gap-3 px-4 py-3 transition-colors hover:bg-muted/50', bg)}>
                <Icon className={cn('h-4 w-4 mt-0.5 shrink-0', iconColor)} />
                <p className={cn('text-sm leading-snug', text)}>{alert.message}</p>
              </div>
            );
            return alert.actionRoute
              ? <Link key={alert.id} to={alert.actionRoute} onClick={onClose}>{inner}</Link>
              : <div key={alert.id}>{inner}</div>;
          })}
        </div>
      )}
    </div>
  );
}
