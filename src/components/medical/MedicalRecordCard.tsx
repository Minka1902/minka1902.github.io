import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { fmtDate } from '@/lib/utils';
import type { MedicalRecord } from '@/types';

interface Props {
  record: MedicalRecord;
  onDelete?: (id: string) => void;
}

export default function MedicalRecordCard({ record, onDelete }: Props) {
  const isOverdue = record.nextDueDate && record.nextDueDate < Date.now();
  return (
    <Card>
      <CardContent className="p-4 flex items-start gap-3">
        <div className="flex-1 space-y-1">
          <div className="flex items-center gap-2">
            <p className="font-medium text-sm">{record.title}</p>
            {isOverdue && <Badge variant="destructive" className="text-xs">Overdue</Badge>}
          </div>
          <p className="text-xs text-muted-foreground">
            {fmtDate(record.date)}
            {record.nextDueDate && ` · Due: ${fmtDate(record.nextDueDate)}`}
            {record.provider && ` · ${record.provider}`}
          </p>
          {record.notes && <p className="text-xs text-muted-foreground">{record.notes}</p>}
        </div>
        {onDelete && (
          <Button variant="ghost" size="sm" className="text-muted-foreground hover:text-destructive" onClick={() => onDelete(record.id)}>
            ×
          </Button>
        )}
      </CardContent>
    </Card>
  );
}
