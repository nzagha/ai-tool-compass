import { createFileRoute, Link } from '@tanstack/react-router';
import { useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useServerFn } from '@tanstack/react-start';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { MonetizationShell, DataTable, EmptyState, ErrorState, Field, FeedbackMessage, LoadingState, PaymentUnavailable, StatusPill, Tag, type Feedback } from '@/components/monetization/ui';
import { membershipOverview, requestCreatorAccess } from '@/lib/monetization.functions';
import { canApplyForCreator, creatorApplicationInput, safeMessage, type CommercialStatus } from '@/lib/monetization/model';
import { meta } from '@/lib/meta';

export const Route = createFileRoute('/_authenticated/membership')({
  head: () => meta('Membership and billing', 'Your aiBean plan, access, Creator application and billing history in one place.'),
  component: Membership,
  errorComponent: ({ error }) => <div className="max-w-xl mx-auto py-16 px-5"><ErrorState message={safeMessage(error)} /></div>,
});

function Membership() {
  const fetch = useServerFn(membershipOverview);
  const q = useQuery({ queryKey: ['membership'], queryFn: () => fetch() });
  return <MonetizationShell eyebrow="Your account" title="Membership & billing" intro="Your plan, what you can access and anything you've been charged.">
    {q.isLoading ? <LoadingState /> : q.error ? <ErrorState message={safeMessage(q.error)} onRetry={() => void q.refetch()} /> : q.data && <div className="space-y-10">
      <section aria-labelledby="plan" className="grid md:grid-cols-2 gap-4">
        <div className="rounded-2xl border bg-card p-6"><h2 id="plan" className="text-sm font-bold uppercase text-muted-foreground">Plan</h2><p className="font-display text-2xl font-semibold mt-2">Free member</p><p className="text-sm text-muted-foreground mt-2">No active paid membership. Paid plans are still proposals.</p><Button asChild variant="outline" className="mt-4"><Link to="/pricing">See pricing</Link></Button></div>
        <div className="rounded-2xl border bg-card p-6"><h2 className="text-sm font-bold uppercase text-muted-foreground">Access</h2><ul className="mt-3 flex flex-wrap gap-2"><li><Tag tone="info">Member</Tag></li>{q.data.facts.isApprovedCreator && <li><Tag tone="success">Approved Creator</Tag></li>}{q.data.facts.ownedToolSlugs.length > 0 && <li><Tag tone="success">Tool owner · {q.data.facts.ownedToolSlugs.length}</Tag></li>}{q.data.facts.isAdmin && <li><Tag tone="warning">Admin</Tag></li>}</ul><p className="text-xs text-muted-foreground mt-4">Access comes from approvals, never from payments.</p></div>
      </section>
      <CreatorApplication facts={q.data.facts} applications={q.data.applications} />
      <section aria-labelledby="billing"><h2 id="billing" className="font-display text-2xl font-semibold mb-4">Billing history</h2><EmptyState title="No charges" body="You haven't paid for anything. When payments are switched on, receipts will appear here." /><div className="mt-4"><PaymentUnavailable /></div></section>
    </div>}
  </MonetizationShell>;
}

type App = { id: string; status: string; review_reason: string | null; created_at: string };
function CreatorApplication({ facts, applications }: { facts: Parameters<typeof canApplyForCreator>[0]; applications: App[] }) {
  const send = useServerFn(requestCreatorAccess); const qc = useQueryClient();
  const [pitch, setPitch] = useState(''); const [error, setError] = useState<string>(); const [fb, setFb] = useState<Feedback>(null); const [busy, setBusy] = useState(false);
  async function submit(e: React.FormEvent) {
    e.preventDefault(); setFb(null);
    const parsed = creatorApplicationInput.safeParse({ pitch });
    if (!parsed.success) { setError(parsed.error.issues[0]?.message); return; }
    setError(undefined); setBusy(true);
    try { await send({ data: parsed.data }); setPitch(''); setFb({ tone: 'success', text: 'Application sent. An admin will review it.' }); await qc.invalidateQueries({ queryKey: ['membership'] }); }
    catch (x) { setFb({ tone: 'error', text: safeMessage(x) }); } finally { setBusy(false); }
  }
  return <section aria-labelledby="creator"><h2 id="creator" className="font-display text-2xl font-semibold mb-4">Become an approved Creator</h2>
    {facts.isApprovedCreator ? <div className="rounded-xl border bg-card p-5 flex flex-wrap items-center justify-between gap-3"><p>You're an approved Creator.</p><Button asChild><Link to="/creator">Open Creator area</Link></Button></div>
      : canApplyForCreator(facts) ? <form onSubmit={submit} className="rounded-xl border bg-card p-5 space-y-4 max-w-2xl" noValidate>
        <Field id="pitch" label="What will you publish?" hint="Skills, playbooks or guides you'd share. 20–1000 characters." error={error}><Textarea id="pitch" rows={4} value={pitch} onChange={e => setPitch(e.target.value)} aria-invalid={!!error} aria-describedby={error ? 'pitch-error' : 'pitch-hint'} /></Field>
        <Button type="submit" disabled={busy}>{busy ? 'Sending…' : 'Send application'}</Button>
      </form> : <p className="text-muted-foreground">Your application is waiting for review.</p>}
    <div className="mt-4"><FeedbackMessage feedback={fb} /></div>
    {applications.length > 0 && <div className="mt-6"><DataTable caption="Your Creator applications" rows={applications} rowKey={a => a.id} empty={null} columns={[
      { key: 'date', header: 'Sent', cell: a => new Date(a.created_at).toLocaleDateString() },
      { key: 'status', header: 'Status', cell: a => <StatusPill status={a.status as CommercialStatus} /> },
      { key: 'reason', header: 'Note from aiBean', cell: a => a.review_reason ?? '—' },
    ]} /></div>}
  </section>;
}
