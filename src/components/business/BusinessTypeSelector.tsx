import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { BUSINESS_TYPES, type BusinessType } from '@/types';

interface Props {
  value: BusinessType;
  onChange: (value: BusinessType) => void;
  id?: string;
}

export default function BusinessTypeSelector({ value, onChange, id }: Props) {
  return (
    <Select value={value} onValueChange={v => onChange(v as BusinessType)}>
      <SelectTrigger id={id} className="w-full">
        <SelectValue />
      </SelectTrigger>
      <SelectContent>
        {BUSINESS_TYPES.map(t => (
          <SelectItem key={t.type} value={t.type}>{t.label}</SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}
