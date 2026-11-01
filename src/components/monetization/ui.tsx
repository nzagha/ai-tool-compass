import { useState, type ReactNode } from 'react';
import { Link, useRouterState } from '@tanstack/react-router';
import { AlertTriangle, CheckCircle2, Info, Inbox, Loader2, Lock } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { cn } from '@/lib/utils';
import { useAuth } from '@/components/auth-provider';
import { STATUS_TONE, type CommercialStatus } from '@/lib/monetization/model';

export const AREAS = [
  { to: '/pricing', label: 'Pricing', hint: 'Plans and offers' },
  { to: '/membership', label: 'Membership & billing', hint: 'Your plan and history' },
  { to: '/vendor-studio', label: 'Vendor', hint: 'Tools you own' },
  { to: '/creator', label: 'Creator', hint: 'Approved Creators' },
  { to: '/admin-monetization', label: 'Admin', hint: 'Reviews and access', adminOnly: true },
] as const;

/** Shared layout for all five monetization areas. Links are navigation only; every area re-checks access on the server. */
export function MonetizationShell({ eyebrow, title, intro, children, actions }: { eyebrow: string; title: string; intro?: string; children: ReactNode; actions?: ReactNode }) {
  const { isAdmin } = useAuth();
  const path = useRouterState({ select: s => s.location.pathname });
  const items = AREAS.filter(a => !('adminOnly' in a) || isAdmin);
  return <div className="max-w-[1280px] mx-auto px-5 lg:px-10 py-10">
    <nav aria-label="Monetization areas" className="lg:hidden -mx-5 px-5 mb-8 overflow-x-auto"><ul className="flex gap-2 w-max">{items.map(a => { const on = path.startsWith(a.to); return <li key={a.to}><Link to={a.to} aria-current={on ? 'page' : undefined} className={cn('block whitespace-nowrap rounded-full border px-4 py-2 text-sm font-medium', on ? 'bg-primary text-primary-foreground border-primary' : 'bg-card hover:border-primary')}>{a.label}</Link></li>; })}</ul></nav>
    <div className="grid lg:grid-cols-[230px_1fr] gap-10">
      <aside className="hidden lg:block"><nav aria-label="Monetization areas" className="sticky top-24 space-y-1"><p className="text-xs font-bold uppercase text-muted-foreground mb-3">Plans & programs</p>{items.map(a => { const on = path.startsWith(a.to); return <Link key={a.to} to={a.to} aria-current={on ? 'page' : undefined} className={cn('block rounded-lg px-3 py-2.5', on ? 'bg-primary text-primary-foreground' : 'hover:bg-muted')}><span className="block text-sm font-semibold">{a.label}</span><span className={cn('block text-xs', on ? 'opacity-80' : 'text-muted-foreground')}>{a.hint}</span></Link>; })}</nav></aside>
      <main className="min-w-0">
        <header className="border-b pb-6 mb-8 flex flex-wrap items-end justify-between gap-4"><div className="min-w-0"><p className="text-xs text-primary font-bold uppercase mb-2">{eyebrow}</p><h1 className="font-display text-3xl sm:text-4xl font-semibold break-words">{title}</h1>{intro && <p className="text-muted-foreground mt-3 max-w-2xl">{intro}</p>}</div>{actions}</header>
        {children}
      </main>
    </div>
  </div>;
}

const toneClass = { neutral: 'bg-muted text-foreground border-border', info: 'bg-primary/10 text-primary border-primary/30', success: 'bg-secondary text-secondary-foreground border-secondary', warning: 'bg-highlight/15 text-foreground border-highlight/50', danger: 'bg-destructive/10 text-destructive border-destructive/30' } as const;
export function StatusPill({ status, label }: { status: CommercialStatus; label?: string }) {
  return <span className={cn('inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold capitalize whitespace-nowrap', toneClass[STATUS_TONE[status]])}>{label ?? status.replace('_', ' ')}</span>;
}
export function Tag({ children, tone = 'neutral' }: { children: ReactNode; tone?: keyof typeof toneClass }) {
  return <span className={cn('inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold whitespace-nowrap', toneClass[tone])}>{children}</span>;
}

export function LoadingState({ label = 'Loading…' }: { label?: string }) {
  return <div role="status" aria-live="polite" className="flex items-center gap-3 py-12 text-muted-foreground"><Loader2 className="size-5 animate-spin" aria-hidden />{label}</div>;
}
export function EmptyState({ title, body, action }: { title: string; body?: string; action?: ReactNode }) {
  return <div className="rounded-xl border border-dashed p-8 text-center bg-card"><Inbox className="size-6 mx-auto text-muted-foreground" aria-hidden /><p className="font-semibold mt-3">{title}</p>{body && <p className="text-sm text-muted-foreground mt-1 max-w-md mx-auto">{body}</p>}{action && <div className="mt-4">{action}</div>}</div>;
}
export function ErrorState({ message, onRetry }: { message: string; onRetry?: () => void }) {
  return <div role="alert" className="rounded-xl border border-destructive/30 bg-destructive/5 p-6"><div className="flex gap-3"><AlertTriangle className="size-5 text-destructive shrink-0" aria-hidden /><div><p className="font-semibold">That didn't load</p><p className="text-sm text-muted-foreground mt-1">{message}</p>{onRetry && <Button size="sm" variant="outline" className="mt-3" onClick={onRetry}>Try again</Button>}</div></div></div>;
}
export function AccessDenied({ message, action }: { message: string; action?: ReactNode }) {
  return <div role="alert" className="rounded-xl border p-8 bg-card max-w-xl"><Lock className="size-6 text-primary" aria-hidden /><p className="font-display text-xl font-semibold mt-3">You can't open this area yet</p><p className="text-sm text-muted-foreground mt-2">{message}</p>{action && <div className="mt-4">{action}</div>}</div>;
}
export type Feedback = { tone: 'success' | 'error' | 'info'; text: string } | null;
export function FeedbackMessage({ feedback }: { feedback: Feedback }) {
  if (!feedback) return null;
  const Icon = feedback.tone === 'success' ? CheckCircle2 : feedback.tone === 'error' ? AlertTriangle : Info;
  return <p role={feedback.tone === 'error' ? 'alert' : 'status'} className={cn('flex items-start gap-2 rounded-lg border px-4 py-3 text-sm', feedback.tone === 'error' ? 'border-destructive/30 text-destructive bg-destructive/5' : feedback.tone === 'success' ? 'border-secondary bg-secondary/40' : 'border-primary/30 bg-primary/5')}><Icon className="size-4 mt-0.5 shrink-0" aria-hidden />{feedback.text}</p>;
}
export function Field({ id, label, hint, error, children }: { id: string; label: string; hint?: string | undefined; error?: string | undefined; children: ReactNode }) {
  return <div className="space-y-1.5"><Label htmlFor={id}>{label}</Label>{children}{hint && !error && <p id={`${id}-hint`} className="text-xs text-muted-foreground">{hint}</p>}{error && <p id={`${id}-error`} role="alert" className="text-xs text-destructive">{error}</p>}</div>;
}

export type Column<T> = { key: string; header: string; cell: (row: T) => ReactNode; className?: string };
/** Table on desktop, stacked cards on mobile so nothing overflows. */
export function DataTable<T>({ rows, columns, rowKey, caption, empty }: { rows: T[]; columns: Column<T>[]; rowKey: (r: T) => string; caption: string; empty: ReactNode }) {
  if (!rows.length) return <>{empty}</>;
  return <div>
    <table className="hidden md:table w-full text-sm"><caption className="sr-only">{caption}</caption><thead><tr className="text-left text-muted-foreground border-b">{columns.map(c => <th scope="col" key={c.key} className={cn('py-2 pr-4 font-medium', c.className)}>{c.header}</th>)}</tr></thead><tbody>{rows.map(r => <tr key={rowKey(r)} className="border-b align-top">{columns.map(c => <td key={c.key} className={cn('py-3 pr-4 break-words', c.className)}>{c.cell(r)}</td>)}</tr>)}</tbody></table>
    <ul className="md:hidden space-y-3" aria-label={caption}>{rows.map(r => <li key={rowKey(r)} className="rounded-xl border bg-card p-4 space-y-2">{columns.map(c => <div key={c.key} className="flex justify-between gap-4 text-sm"><span className="text-muted-foreground shrink-0">{c.header}</span><span className="text-right min-w-0 break-words">{c.cell(r)}</span></div>)}</li>)}</ul>
  </div>;
}

export function ConfirmDialog({ trigger, title, description, confirmLabel, onConfirm, children, destructive }: { trigger: (open: () => void) => ReactNode; title: string; description: string; confirmLabel: string; onConfirm: () => Promise<boolean | void>; children?: ReactNode; destructive?: boolean }) {
  const [open, setOpen] = useState(false); const [busy, setBusy] = useState(false);
  return <>{trigger(() => setOpen(true))}<Dialog open={open} onOpenChange={setOpen}><DialogContent><DialogHeader><DialogTitle>{title}</DialogTitle><DialogDescription>{description}</DialogDescription></DialogHeader>{children}<DialogFooter><Button variant="ghost" onClick={() => setOpen(false)} disabled={busy}>Cancel</Button><Button variant={destructive ? 'destructive' : 'default'} disabled={busy} onClick={async () => { setBusy(true); try { const keep = await onConfirm(); if (keep !== false) setOpen(false); } finally { setBusy(false); } }}>{busy && <Loader2 className="size-4 animate-spin" aria-hidden />}{confirmLabel}</Button></DialogFooter></DialogContent></Dialog></>;
}

export function PaymentUnavailable() {
  return <div className="rounded-xl border bg-card p-5 flex gap-3"><Lock className="size-5 text-primary shrink-0" aria-hidden /><div><p className="font-semibold">Payments are not switched on</p><p className="text-sm text-muted-foreground mt-1">No checkout, subscription or refund can happen here yet. Nothing will be charged.</p></div></div>;
}
