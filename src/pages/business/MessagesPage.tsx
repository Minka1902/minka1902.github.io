import { useEffect, useRef, useState } from 'react';
import { MessageSquare, Send } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Skeleton } from '@/components/ui/skeleton';
import { useBusiness, useThreads, useThreadMessages } from '@/hooks/useBusiness';
import { usePermissions } from '@/hooks/usePermissions';
import { cn } from '@/lib/utils';

export default function MessagesPage() {
  const { activeBusiness } = useBusiness();
  const { can } = usePermissions();
  const bid = activeBusiness?.id ?? '';
  const { threads, loading, sendStaffMessage, markReadByStaff } = useThreads(bid);

  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [draft, setDraft] = useState('');
  const { messages } = useThreadMessages(bid, selectedId);
  const endRef = useRef<HTMLDivElement>(null);

  const canView = can('view_messages');
  const canManage = can('manage_messages');
  const selected = threads.find(t => t.id === selectedId) ?? null;

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages.length]);

  useEffect(() => {
    if (selected && (selected.unreadByStaff ?? 0) > 0) void markReadByStaff(selected.id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedId, selected?.unreadByStaff]);

  if (!activeBusiness) {
    return <div className="mx-auto max-w-2xl py-14 text-center text-sm text-muted-foreground">No business selected.</div>;
  }
  if (!canView && !canManage) {
    return <div className="mx-auto max-w-2xl py-14 text-center text-sm text-muted-foreground">You don't have access to messages.</div>;
  }

  const send = async () => {
    if (!selected || !draft.trim()) return;
    const text = draft.trim();
    setDraft('');
    await sendStaffMessage(selected, text);
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
            <p className="text-sm font-medium">No conversations yet</p>
            <p className="mt-1 text-sm text-muted-foreground">
              Threads open automatically when customers order, book or request a stay.
            </p>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-[260px_1fr]">
          <div className="space-y-1.5 md:max-h-[60vh] md:overflow-y-auto">
            {threads.map(t => (
              <button
                key={t.id}
                onClick={() => setSelectedId(t.id)}
                className={cn(
                  'w-full rounded-lg border px-3 py-2 text-left text-sm transition-colors',
                  selectedId === t.id ? 'border-primary bg-primary/5' : 'hover:bg-muted',
                )}
              >
                <div className="flex items-center justify-between gap-2">
                  <span className="truncate font-medium">{t.customerName}</span>
                  {(t.unreadByStaff ?? 0) > 0 && <Badge>{t.unreadByStaff}</Badge>}
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
                <div className="border-b px-4 py-2 text-sm font-medium">{selected.customerName}</div>
                <div className="flex-1 space-y-2 overflow-y-auto p-3">
                  {messages.map(m => (
                    <div
                      key={m.id}
                      className={cn(
                        'max-w-[80%] rounded-lg px-3 py-1.5 text-sm',
                        m.kind === 'system'
                          ? 'mx-auto bg-muted text-center text-xs text-muted-foreground'
                          : m.fromSide === 'staff'
                            ? 'ml-auto bg-primary text-primary-foreground'
                            : 'bg-muted',
                      )}
                    >
                      {m.text}
                    </div>
                  ))}
                  <div ref={endRef} />
                </div>
                {canManage && (
                  <div className="flex gap-2 border-t p-2">
                    <Input
                      value={draft}
                      onChange={e => setDraft(e.target.value)}
                      placeholder="Reply…"
                      onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); void send(); } }}
                    />
                    <Button size="icon" onClick={send} disabled={!draft.trim()} aria-label="Send">
                      <Send className="h-4 w-4" />
                    </Button>
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
