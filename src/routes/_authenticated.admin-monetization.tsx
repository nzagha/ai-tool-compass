import { createFileRoute } from '@tanstack/react-router';
import { useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useServerFn } from '@tanstack/react-start';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { MonetizationShell, AccessDenied, ConfirmDialog, DataTable, EmptyState, ErrorState, Field, FeedbackMessage, LoadingState, StatusPill, Tag, type Feedback } from '@/components/monetization/ui';
import { adminMonetization, reviewCreatorApplication, revokeCreator } from '@/lib/monetization.functions';
import { AUTHORITY_LABEL, safeMessage, type CommercialStatus, type PricingRef } from '@/lib/monetization/model';
import { formatInterval, formatMoney } from '@/lib/monetization/money';
import { meta } from '@/lib/meta';

export const Route = createFileRoute('/_authenticated/admin-monetization')({
  head: () => meta('Admin: plans and access', 'Review Creator applications, Tool ownership and price versions for aiBean.'),
  component: AdminMonetization,
  errorComponent: ({ error }) => <div className="max-w-xl mx-auto py-16 px-5"><ErrorState message={safeMessage(error)} /></div>,
});

function AdminMonetization() {
  const fetch = useServerFn(adminMonetization); const qc = useQueryClient();
  const review = useServerFn(reviewCreatorApplication); const revoke = useServerFn(revokeCreator);
  const q = useQuery({ queryKey: ['admin-monetization'], queryFn: () => fetch(), retry: false });
  const [fb, setFb] = useState<Feedback>(null); const [reason, setReason] = useState(''); const [reasonErr, setReasonErr] = useState<string>();
  const name = (id: string) => q.data?.profiles.find(p => p.id === id)?.display_name || id.slice(0, 8);
  async function act(fn: () => Promise<unknown>, ok: string) {
    if (reason.trim().length < 3) { setReasonErr('Add a short reason.'); return false; }
    setReasonErr(undefined);
    try { await fn(); setFb({ tone: 'success', text: ok }); setReason(''); await qc.invalidateQueries({ queryKey: ['admin-monetization'] }); return true; }
    catch (x) { setFb({ tone: 'error', text: safeMessage(x) }); return true; }
  }
  const reasonField = <Field id="reason" label="Reason (saved to the audit history)" error={reasonErr}><Textarea id="reason" rows={3} value={reason} onChange={e => setReason(e.target.value)} aria-invalid={!!reasonErr} /></Field>;
  return <MonetizationShell eyebrow="Admin" title="Plans & access" intro="Approvals here are checked again on the server. Payments are switched off.">
    {q.isLoading ? <LoadingState /> : q.error ? <AccessDenied message={safeMessage(q.error, 'Admin access is required.')} /> : q.data && <div className="space-y-12">
      <div className="flex flex-wrap gap-2"><Tag tone={q.data.isolated ? 'success' : 'danger'}>{q.data.isolated ? 'Isolated test data' : 'Not an isolated test backend'}</Tag><Tag tone="warning">Payments off</Tag></div>
      <FeedbackMessage feedback={fb} />
      <section><h2 className="font-display text-2xl font-semibold mb-4">Creator applications</h2>
        <DataTable caption="Creator applications" rows={q.data.applications} rowKey={a => a.id} empty={<EmptyState title="No applications" />} columns={[
          { key: 'who', header: 'Member', cell: a => name(a.user_id) },
          { key: 'pitch', header: 'Pitch', cell: a => <span className="text-muted-foreground">{a.pitch}</span>, className: 'max-w-sm' },
          { key: 'status', header: 'Status', cell: a => <StatusPill status={a.status as CommercialStatus} /> },
          { key: 'act', header: 'Decision', cell: a => a.status !== 'pending' ? (a.review_reason ?? '—') : <span className="inline-flex gap-2">
            <ConfirmDialog title="Approve this Creator?" description="They get Creator access. This does not change any ranking or ownership." confirmLabel="Approve" onConfirm={() => act(() => review({ data: { applicationId: a.id, decision: 'approved', reason } }), 'Creator approved.')} trigger={open => <Button size="sm" onClick={open}>Approve</Button>}>{reasonField}</ConfirmDialog>
            <ConfirmDialog destructive title="Reject this application?" description="The member will see your reason." confirmLabel="Reject" onConfirm={() => act(() => review({ data: { applicationId: a.id, decision: 'rejected', reason } }), 'Application rejected.')} trigger={open => <Button size="sm" variant="outline" onClick={open}>Reject</Button>}>{reasonField}</ConfirmDialog>
          </span> },
        ]} />
      </section>
      <section><h2 className="font-display text-2xl font-semibold mb-4">Approved Creators</h2>
        <DataTable caption="Approved Creators" rows={q.data.capabilities} rowKey={c => c.user_id + c.capability} empty={<EmptyState title="No approved Creators" />} columns={[
          { key: 'who', header: 'Member', cell: c => name(c.user_id) },
          { key: 'since', header: 'Since', cell: c => new Date(c.granted_at).toLocaleDateString() },
          { key: 'act', header: '', cell: c => <ConfirmDialog destructive title="Remove Creator access?" description="They keep their account and content." confirmLabel="Remove access" onConfirm={() => act(() => revoke({ data: { userId: c.user_id, reason } }), 'Creator access removed.')} trigger={open => <Button size="sm" variant="ghost" onClick={open}>Remove</Button>}>{reasonField}</ConfirmDialog> },
        ]} />
      </section>
      <section><h2 className="font-display text-2xl font-semibold mb-2">Tool owners</h2><p className="text-sm text-muted-foreground mb-4">One owner per tool, set only by approving a claim in Owner claims.</p>
        <DataTable caption="Tool owners" rows={q.data.vendorAccess} rowKey={v => v.tool_slug} empty={<EmptyState title="No owned tools" />} columns={[
          { key: 'tool', header: 'Tool', cell: v => <span className="font-mono text-xs">{v.tool_slug}</span> },
          { key: 'who', header: 'Owner', cell: v => name(v.user_id) },
          { key: 'since', header: 'Since', cell: v => new Date(v.granted_at).toLocaleDateString() },
        ]} />
      </section>
      <section><h2 className="font-display text-2xl font-semibold mb-4">Price versions</h2>
        <DataTable caption="Price versions" rows={q.data.pricing as PricingRef[]} rowKey={r => r.id} empty={<EmptyState title="No prices" />} columns={[
          { key: 'item', header: 'Item', cell: r => r.label },
          { key: 'price', header: 'Price', cell: r => `${formatMoney(r.price, { compact: true })} ${formatInterval(r.interval, r.days)}` },
          { key: 'auth', header: 'Status', cell: r => <Tag tone={r.authority === 'owner_approved' ? 'success' : 'warning'}>{AUTHORITY_LABEL[r.authority]}</Tag> },
          { key: 'v', header: 'Version', cell: r => <span className="font-mono text-xs">{r.version}</span> },
        ]} />
      </section>
      <section><h2 className="font-display text-2xl font-semibold mb-4">Recent access changes</h2>
        <DataTable caption="Recent access changes" rows={q.data.audit} rowKey={a => a.id} empty={<EmptyState title="No changes yet" />} columns={[
          { key: 'when', header: 'When', cell: a => new Date(a.created_at).toLocaleString() },
          { key: 'what', header: 'Action', cell: a => a.action },
          { key: 'by', header: 'By', cell: a => a.actor_id ? name(a.actor_id) : '—' },
        ]} />
      </section>
    </div>}
  </MonetizationShell>;
}
