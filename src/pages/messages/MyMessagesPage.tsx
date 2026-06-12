import { useEffect, useRef, useState } from 'react';
import { MessageSquare, Send } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Skeleton } from '@/components/ui/skeleton';
import { useCustomerMessaging, useCustomerThreadMessages, useMyThreads } from '@/hooks/useDirectory';
import { cn } from '@/lib/utils';
import type { MessageThread } from '@/types';

// The pet parent's inbox: one thread per business they've ordered from, booked
// with, or boarded at. Status updates from those businesses land here too.
export default function MyMessagesPage() {
  const { threads, loading } = useMyThreads();
  const { sendToBusiness, markReadByCustomer } = useCustomerMessaging();

  const [selected, setSelected] = useState<MessageThread | null>(null);
  const [draft, setDraft] = useState('');
  const { messages } = useCustomerThreadMessages(selected?.businessId ?? null, selected?.id ?? null);
  const endRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages.length]);

  useEffect(() => {
    if (selected && (selected.unreadByCustomer ?? 0) > 0) void markReadByCustomer(selected.businessId);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selected?.businessId, selected?.unreadByCustomer]);

  const send = async () => {
    if (!selected || !draft.trim()) return;
    const text = draft.trim();
    setDraft('');
    await sendToBusiness(selected.businessId, selected.businessName, text);
  };

  return (
    <div className="mx-auto max-w-3xl space-y-4 lg:flex-1 lg:overflow-y-auto lg:p-4">
      <h1 className="text-xl font-bold tracking-tight sm:text-2xl">Messages</h1>

      {loading ? (
        <div className="space-y-2">{[1, 2, 3].map(i => <Skeleton key={i} className="h-14 w-full rounded-xl" />)}</div>
      ) : threads.length === 0 ? (
        <div className="flex flex-col items-center justify-center gap-3 rounded-xl border border-dashed bg-background py-14">
          <div className="flex h-12 w-12 items-center justify-center rounded-full bg-muted">
            <MessageSquare className="h-6 w-6 text-muted-foreground" />
          </div>
          <div className="text-center">
            <p className="text-sm font-medium">No messages yet</p>
            <p className="mt-1 text-sm text-muted-foreground">
              Order, book or request a stay from Discover and the conversation starts here.
            </p>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-[260px_1fr]">
          <div className="space-y-1.5 md:max-h-[60vh] md:overflow-y-auto">
            {threads.map(t => (
              <button
                key={`${t.businessId}-${t.id}`}
                onClick={() => setSelected(t)}
                className={cn(
                  'w-full rounded-lg border px-3 py-2 text-left text-sm transition-colors',
                  selected?.businessId === t.businessId ? 'border-primary bg-primary/5' : 'hover:bg-muted',
                )}
              >
                <div className="flex items-center justify-between gap-2">
                  <span className="truncate font-medium">{t.businessName || 'Business'}</span>
                  {(t.unreadByCustomer ?? 0) > 0 && <Badge>{t.unreadByCustomer}</Badge>}
                </div>
                <p className="mt-0.5 truncate text-xs text-muted-foreground">{t.lastMessageText}</p>
              </button>
            ))}
          </div>

          <div className="flex min-h-[40vh] flex-col rounded-xl border">
            {!selected ? (
              <div className="flex flex-1 items-center justify-center text-sm text-muted-foreground">
                Pick a conversation.
              </div>
            ) : (
              <>
                <div className="border-b px-4 py-2 text-sm font-medium">{selected.businessName}</div>
                <div className="flex-1 space-y-2 overflow-y-auto p-3">
                  {messages.map(m => (
                    <div
                      key={m.id}
                      className={cn(
                        'max-w-[80%] rounded-lg px-3 py-1.5 text-sm',
                        m.kind === 'system'
                          ? 'mx-auto bg-muted text-center text-xs text-muted-foreground'
                          : m.fromSide === 'customer'
                            ? 'ml-auto bg-primary text-primary-foreground'
                            : 'bg-muted',
                      )}
                    >
                      {m.text}
                    </div>
                  ))}
                  <div ref={endRef} />
                </div>
                <div className="flex gap-2 border-t p-2">
                  <Input
                    value={draft}
                    onChange={e => setDraft(e.target.value)}
                    placeholder="Message…"
                    onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); void send(); } }}
                  />
                  <Button size="icon" onClick={send} disabled={!draft.trim()} aria-label="Send">
                    <Send className="h-4 w-4" />
                  </Button>
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
