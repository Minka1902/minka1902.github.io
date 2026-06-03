import { useState } from 'react';
import { Plus, Receipt } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { useBusiness, useInvoices } from '@/hooks/useBusiness';
import { usePermissions } from '@/hooks/usePermissions';
import InvoiceCard from '@/components/business/InvoiceCard';
import InvoiceForm, { type InvoiceFormData } from '@/components/business/InvoiceForm';
import PaymentDialog from '@/components/business/PaymentDialog';
import type { Invoice, InvoicePayment } from '@/types';

export default function InvoicesPage() {
  const { activeBusiness } = useBusiness();
  const { can } = usePermissions();
  const bid = activeBusiness?.id ?? '';
  const currency = activeBusiness?.currency ?? 'USD';
  const { invoices, loading, createInvoice, updateInvoice, recordPayment, deleteInvoice } = useInvoices(bid);

  const [addOpen, setAddOpen] = useState(false);
  const [payInvoice, setPayInvoice] = useState<Invoice | null>(null);

  const canView = can('view_invoices');
  const canManage = can('manage_invoices');
  const canRecord = can('record_payments');

  if (!activeBusiness) {
    return <div className="mx-auto max-w-2xl py-14 text-center text-sm text-muted-foreground">No business selected.</div>;
  }
  if (!canView && !canManage) {
    return <div className="mx-auto max-w-2xl py-14 text-center text-sm text-muted-foreground">You don't have access to invoices.</div>;
  }

  return (
    <div className="mx-auto max-w-2xl space-y-6 lg:flex-1 lg:overflow-y-auto lg:p-4">
      <div className="flex flex-wrap items-center justify-between gap-y-2">
        <h1 className="text-xl font-bold tracking-tight sm:text-2xl">Invoices</h1>
        {canManage && (
          <Button size="sm" className="gap-1.5" onClick={() => setAddOpen(true)}>
            <Plus className="h-3.5 w-3.5" /> New invoice
          </Button>
        )}
      </div>

      {loading ? (
        <div className="space-y-2">{[1, 2, 3].map(i => <Skeleton key={i} className="h-24 w-full rounded-xl" />)}</div>
      ) : invoices.length === 0 ? (
        <div className="flex flex-col items-center justify-center gap-3 rounded-xl border border-dashed bg-background py-14">
          <div className="flex h-12 w-12 items-center justify-center rounded-full bg-muted">
            <Receipt className="h-6 w-6 text-muted-foreground" />
          </div>
          <div className="text-center">
            <p className="text-sm font-medium">No invoices</p>
            <p className="mt-1 text-sm text-muted-foreground">Create your first invoice.</p>
          </div>
        </div>
      ) : (
        <div className="space-y-2">
          {invoices.map(inv => (
            <InvoiceCard
              key={inv.id}
              invoice={inv}
              currency={currency}
              canRecordPayment={canRecord}
              canManage={canManage}
              onRecordPayment={() => setPayInvoice(inv)}
              onVoid={() => { if (confirm('Void this invoice?')) updateInvoice(inv.id, { status: 'void' }); }}
              onDelete={() => { if (confirm('Delete this invoice?')) deleteInvoice(inv.id); }}
            />
          ))}
        </div>
      )}

      <Dialog open={addOpen} onOpenChange={setAddOpen}>
        <DialogContent className="max-h-[85vh] overflow-y-auto">
          <DialogHeader><DialogTitle>New invoice</DialogTitle></DialogHeader>
          <InvoiceForm
            bid={bid}
            currency={currency}
            onSubmit={async (data: InvoiceFormData) => { await createInvoice(data); setAddOpen(false); }}
            onCancel={() => setAddOpen(false)}
          />
        </DialogContent>
      </Dialog>

      {payInvoice && (
        <PaymentDialog
          invoice={payInvoice}
          open={!!payInvoice}
          onOpenChange={o => { if (!o) setPayInvoice(null); }}
          currency={currency}
          onRecord={async (amount: number, method: InvoicePayment['method']) => {
            await recordPayment(payInvoice, amount, method);
            setPayInvoice(null);
          }}
        />
      )}
    </div>
  );
}
