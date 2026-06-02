import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import {
  Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle,
} from '@/components/ui/dialog';
import type { Invoice, InvoicePayment } from '@/types';

type Method = InvoicePayment['method'];

const METHODS: { value: Method; label: string }[] = [
  { value: 'cash', label: 'Cash' },
  { value: 'card', label: 'Card' },
  { value: 'transfer', label: 'Transfer' },
  { value: 'other', label: 'Other' },
];

interface Props {
  invoice: Invoice;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  currency: string;
  onRecord: (amount: number, method: Method) => Promise<void>;
}

export default function PaymentDialog({ invoice, open, onOpenChange, currency, onRecord }: Props) {
  const due = Math.max(0, Math.round((invoice.total - invoice.amountPaid) * 100) / 100);
  const [amount, setAmount] = useState(due.toString());
  const [method, setMethod] = useState<Method>('cash');
  const [saving, setSaving] = useState(false);

  const handleOpenChange = (next: boolean) => {
    if (next) {
      setAmount(due.toString());
      setMethod('cash');
    }
    onOpenChange(next);
  };

  const handleRecord = async () => {
    const value = Number(amount);
    if (!value || value <= 0) return;
    setSaving(true);
    try {
      await onRecord(value, method);
      onOpenChange(false);
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Record payment</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <p className="text-sm text-muted-foreground">
            Amount due: {currency} {due.toFixed(2)}
          </p>
          <div className="space-y-1.5">
            <Label htmlFor="pay-amount">Amount</Label>
            <Input id="pay-amount" type="number" min="0" step="0.01" value={amount} onChange={e => setAmount(e.target.value)} />
          </div>
          <div className="space-y-1.5">
            <Label>Method</Label>
            <Select value={method} onValueChange={v => setMethod(v as Method)}>
              <SelectTrigger className="w-full"><SelectValue /></SelectTrigger>
              <SelectContent>
                {METHODS.map(m => <SelectItem key={m.value} value={m.value}>{m.label}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
          <Button onClick={handleRecord} disabled={saving || !Number(amount)}>{saving ? 'Saving…' : 'Record'}</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
