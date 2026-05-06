import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import AlertItem from './AlertItem';
import type { Alert } from '@/types';

interface Props {
  alerts: Alert[];
  onClose?: () => void;
}

export default function AlertPanel({ alerts, onClose }: Props) {
  return (
    <Card className="shadow-lg">
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <CardTitle className="text-sm font-semibold">Alerts</CardTitle>
          {onClose && (
            <button onClick={onClose} className="text-muted-foreground hover:text-foreground text-lg leading-none">×</button>
          )}
        </div>
      </CardHeader>
      <CardContent className="space-y-2 pb-3">
        {alerts.length === 0
          ? <p className="text-sm text-muted-foreground">All clear!</p>
          : alerts.map(a => <AlertItem key={a.id} alert={a} />)
        }
      </CardContent>
    </Card>
  );
}
