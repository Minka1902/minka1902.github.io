import { AlertTriangle, Info, XCircle } from 'lucide-react';
import { Link } from 'react-router-dom';
import { cn } from '@/lib/utils';
import type { Alert } from '@/types';

interface Props {
  alerts: Alert[];
  onClose?: () => void;
}

const SEVERITY_CONFIG = {
  critical: { icon: XCircle,       bg: 'bg-destructive/10 border-destructive/30', text: 'text-destructive',     iconColor: 'text-destructive' },
  warning:  { icon: AlertTriangle, bg: 'bg-amber-50 border-amber-200',            text: 'text-amber-800',       iconColor: 'text-amber-500' },
  info:     { icon: Info,          bg: 'bg-blue-50 border-blue-200',              text: 'text-blue-800',        iconColor: 'text-blue-500' },
};

export default function AlertPanel({ alerts }: Props) {
  if (alerts.length === 0) return null;

  return (
    <div className="space-y-2">
      {alerts.map(alert => {
        const { icon: Icon, bg, text, iconColor } = SEVERITY_CONFIG[alert.severity];
        const inner = (
          <div className={cn('flex items-start gap-3 rounded-lg border px-4 py-3', bg)}>
            <Icon className={cn('h-4 w-4 mt-0.5 shrink-0', iconColor)} />
            <p className={cn('text-sm', text)}>{alert.message}</p>
          </div>
        );
        return alert.actionRoute
          ? <Link key={alert.id} to={alert.actionRoute} className="block hover:opacity-90 transition-opacity">{inner}</Link>
          : <div key={alert.id}>{inner}</div>;
      })}
    </div>
  );
}
