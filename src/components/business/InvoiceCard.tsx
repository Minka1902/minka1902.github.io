import { CreditCard, Trash2, XCircle } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { fmtDate } from '@/lib/utils';
import type { Invoice, PaymentStatus } from '@/types';

const STATUS_VARIANT: Record<PaymentStatus, 'default' | 'secondary' | 'outline' | 'destructive'> = {
  draft: 'outline',
  sent: 'secondary',
  partial: 'secondary',
  paid: 'default',
  void: 'destructive',
};

interface Props {
  invoice: Invoice;
  currency: string;
  canRecordPayment: boolean;
  canManage: boolean;
  onRecordPayment: () => void;
  onVoid: () => void;
  onDelete: () => void;
}

export default function InvoiceCard({
  invoice, currency, canRecordPayment, canManage, onRecordPayment, onVoid, onDelete,
}: Props) {
  const money = (n: number) => `${currency} ${n.toFixed(2)}`;
  const canPay = invoice.status !== 'paid' && invoice.status !== 'void';

  return (
    <Card>
      <CardContent className="space-y-3 p-3">
        <div className="flex flex-wrap items-start justify-between gap-2">
          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <p className="truncate text-sm font-medium">{invoice.number}</p>
              <Badge variant={STATUS_VARIANT[invoice.status]} className="capitalize">{invoice.status}</Badge>
            </div>
            <p className="truncate text-xs text-muted-foreground">{invoice.customerName}</p>
          </div>
          <div className="text-right">
            <p className="text-sm font-semibold">{money(invoice.total)}</p>
            {invoice.amountPaid > 0 && invoice.amountPaid < invoice.total && (
              <p className="text-xs text-muted-foreground">Paid {money(invoice.amountPaid)}</p>
            )}
          </div>
        </div>

        <div className="space-y-1 border-t pt-2">
          {invoice.lineItems.map((li, i) => (
            <div key={i} className="flex justify-between text-xs text-muted-foreground">
              <span className="truncate">{li.description} × {li.quantity}</span>
              <span>{money(li.quantity * li.unitPrice)}</span>
            </div>
          ))}
          {invoice.dueAt && <p className="text-xs text-muted-foreground">Due {fmtDate(invoice.dueAt)}</p>}
        </div>

        <div className="flex flex-wrap justify-end gap-1">
          {canRecordPayment && canPay && (
            <Button variant="outline" size="sm" onClick={onRecordPayment} className="gap-1">
              <CreditCard className="h-3.5 w-3.5" /> Record payment
            </Button>
          )}
          {canManage && invoice.status !== 'void' && (
            <Button variant="ghost" size="sm" onClick={onVoid} className="gap-1">
              <XCircle className="h-3.5 w-3.5" /> Void
            </Button>
          )}
          {canManage && (
            <Button variant="ghost" size="icon-sm" onClick={onDelete} aria-label="Delete invoice">
              <Trash2 className="h-3.5 w-3.5" />
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
