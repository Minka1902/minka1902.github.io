import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { TRAINING_TYPES } from '@/lib/constants';
import type { TrainingType } from '@/types';

interface Props {
  value: TrainingType;
  onChange: (value: TrainingType) => void;
}

export default function TrainingTypeSelector({ value, onChange }: Props) {
  return (
    <Select value={value} onValueChange={v => onChange(v as TrainingType)}>
      <SelectTrigger><SelectValue /></SelectTrigger>
      <SelectContent>
        {TRAINING_TYPES.map(t => (
          <SelectItem key={t.type} value={t.type}>{t.label}</SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}
