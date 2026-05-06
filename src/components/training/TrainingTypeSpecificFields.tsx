import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { TRAINING_TYPE_FIELDS } from '@/lib/trainingFields';
import type { TrainingType } from '@/types';

interface Props {
  trainingType: TrainingType;
  values: Record<string, string | number | boolean>;
  onChange: (values: Record<string, string | number | boolean>) => void;
  readOnly?: boolean;
}

export default function TrainingTypeSpecificFields({ trainingType, values, onChange, readOnly }: Props) {
  const fields = TRAINING_TYPE_FIELDS[trainingType];
  if (!fields || fields.length === 0) return null;

  const set = (name: string, value: string | number | boolean) => {
    onChange({ ...values, [name]: value });
  };

  return (
    <div className="space-y-3 border-t pt-4">
      <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Type-specific data</p>
      {fields.map(field => (
        <div key={field.name} className="space-y-1">
          <Label htmlFor={`tsf-${field.name}`}>{field.label}</Label>

          {field.inputType === 'boolean' && (
            <div className="flex items-center gap-2 pt-1">
              <input
                id={`tsf-${field.name}`}
                type="checkbox"
                checked={Boolean(values[field.name])}
                onChange={e => !readOnly && set(field.name, e.target.checked)}
                disabled={readOnly}
                className="h-4 w-4"
              />
            </div>
          )}

          {field.inputType === 'number' && (
            <Input
              id={`tsf-${field.name}`}
              type="number"
              step="any"
              value={values[field.name] as number ?? ''}
              onChange={e => set(field.name, e.target.value === '' ? '' : Number(e.target.value))}
              readOnly={readOnly}
            />
          )}

          {field.inputType === 'text' && (
            <Input
              id={`tsf-${field.name}`}
              value={values[field.name] as string ?? ''}
              onChange={e => set(field.name, e.target.value)}
              readOnly={readOnly}
            />
          )}

          {field.inputType === 'select' && (
            readOnly ? (
              <p className="text-sm py-2">{values[field.name] as string ?? '—'}</p>
            ) : (
              <Select
                value={(values[field.name] as string) ?? ''}
                onValueChange={(v: string | null) => v && set(field.name, v)}
              >
                <SelectTrigger id={`tsf-${field.name}`}>
                  <SelectValue placeholder="Select…" />
                </SelectTrigger>
                <SelectContent>
                  {field.options!.map(opt => (
                    <SelectItem key={opt} value={opt}>{opt}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )
          )}
        </div>
      ))}
    </div>
  );
}
