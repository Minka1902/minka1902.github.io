import { useMemo, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useCustomers } from '@/hooks/useBusiness';
import { computeInvoiceTotals, type InvoiceLineItem, type Invoice, type PaymentStatus } from '@/types';
import InvoiceLineItemEditor from './InvoiceLineItemEditor';

export interface InvoiceFormData {
  customerId: string;
  customerName: string;
  lineItems: InvoiceLineItem[];
  taxRate?: number;
  status: PaymentStatus;
  notes?: string;
}

interface Props {
  bid: string;
  currency: string;
  initial?: Partial<Invoice>;
  onSubmit: (data: InvoiceFormData) => Promise<void>;
  onCancel: () => void;
}

const STATUSES: { value: PaymentStatus; label: string }[] = [
  { value: 'draft', label: 'Draft' },
  { value: 'sent', label: 'Sent' },
];

export default function InvoiceForm({ bid, currency, initial, onSubmit, onCancel }: Props) {
  const { customers } = useCustomers(bid);
  const [customerId, setCustomerId] = useState(initial?.customerId ?? '');
  const [lineItems, setLineItems] = useState<InvoiceLineItem[]>(
    initial?.lineItems ?? [{ description: '', quantity: 1, unitPrice: 0 }],
  );
  const [taxRate, setTaxRate] = useState(initial?.taxRate?.toString() ?? '');
  const [status, setStatus] = useState<PaymentStatus>(initial?.status ?? 'draft');
  const [notes, setNotes] = useState(initial?.notes ?? '');
  const [saving, setSaving] = useState(false);

  const parsedTax = taxRate ? Number(taxRate) : undefined;
  const totals = useMemo(() => computeInvoiceTotals(lineItems, parsedTax), [lineItems, parsedTax]);
  const money = (n: number) => `${currency} ${n.toFixed(2)}`;

  const selectedCustomer = customers.find(c => c.id === customerId);
  const valid = customerId && lineItems.some(li => li.description.trim() && li.quantity > 0);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!valid) return;
    setSaving(true);
    try {
      await onSubmit({
        customerId,
        customerName: selectedCustomer?.name ?? '',
        lineItems: lineItems.filter(li => li.description.trim()),
        taxRate: parsedTax,
        status,
        notes: notes.trim() || undefined,
      });
    } finally {
      setSaving(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="space-y-1.5">
        <Label>Customer <span className="text-destructive">*</span></Label>
        <Select value={customerId} onValueChange={v => setCustomerId(v ?? '')}>
          <SelectTrigger className="w-full"><SelectValue placeholder="Select a customer" /></SelectTrigger>
          <SelectContent>
            {customers.map(c => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}
          </SelectContent>
        </Select>
      </div>

      <InvoiceLineItemEditor items={lineItems} onChange={setLineItems} currency={currency} />

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div className="space-y-1.5">
          <Label htmlFor="inv-tax">Tax rate (%)</Label>
          <Input id="inv-tax" type="number" min="0" step="0.01" value={taxRate} onChange={e => setTaxRate(e.target.value)} placeholder="0" />
        </div>
        <div className="space-y-1.5">
          <Label>Status</Label>
          <Select value={status} onValueChange={v => setStatus(v as PaymentStatus)}>
            <SelectTrigger className="w-full"><SelectValue /></SelectTrigger>
            <SelectContent>
              {STATUSES.map(s => <SelectItem key={s.value} value={s.value}>{s.label}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="inv-notes">Notes</Label>
        <Textarea id="inv-notes" value={notes} onChange={e => setNotes(e.target.value)} rows={2} />
      </div>

      <div className="rounded-lg border bg-muted/30 p-3 text-sm">
        <div className="flex justify-between"><span className="text-muted-foreground">Subtotal</span><span>{money(totals.subtotal)}</span></div>
        <div className="mt-1 flex justify-between font-medium"><span>Total</span><span>{money(totals.total)}</span></div>
      </div>

      <div className="flex justify-end gap-2">
        <Button type="button" variant="outline" onClick={onCancel}>Cancel</Button>
        <Button type="submit" disabled={saving || !valid}>{saving ? 'Saving…' : 'Save'}</Button>
      </div>
    </form>
  );
}
