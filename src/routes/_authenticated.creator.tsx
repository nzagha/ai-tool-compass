import { createFileRoute, Link } from '@tanstack/react-router';
import { useQuery } from '@tanstack/react-query';
import { useServerFn } from '@tanstack/react-start';
import { Button } from '@/components/ui/button';
import { MonetizationShell, AccessDenied, DataTable, EmptyState, ErrorState, LoadingState, StatusPill } from '@/components/monetization/ui';
import { creatorWorkspace } from '@/lib/monetization.functions';
import { safeMessage, type CommercialStatus } from '@/lib/monetization/model';
import { meta } from '@/lib/meta';

export const Route = createFileRoute('/_authenticated/creator')({
  head: () => meta('Creator workspace', 'Approved aiBean Creators track their published skills, guides and contributions.'),
  component: Creator,
  errorComponent: ({ error }) => <div className="max-w-xl mx-auto py-16 px-5"><ErrorState message={safeMessage(error)} /></div>,
});

function Creator() {
  const fetch = useServerFn(creatorWorkspace);
  const q = useQuery({ queryKey: ['creator-workspace'], queryFn: () => fetch(), retry: false });
  return <MonetizationShell eyebrow="Creator" title="Creator workspace" intro="Your contributions and their review status. Earnings are not tracked yet.">
    {q.isLoading ? <LoadingState /> : q.error ? <AccessDenied message={safeMessage(q.error, 'Approved Creator access is required.')} action={<Button asChild><Link to="/membership">Apply to become a Creator</Link></Button>} /> : q.data && <div className="space-y-8">
      <div className="grid sm:grid-cols-3 gap-4">{[['Contributions', q.data.records.length], ['Waiting for review', q.data.records.filter(r => r.status === 'pending').length], ['Earnings', 'Not tracked']].map(([l, v]) => <div key={l} className="rounded-xl border bg-card p-5"><p className="text-sm text-muted-foreground">{l}</p><p className="text-2xl font-semibold mt-1">{v}</p></div>)}</div>
      <DataTable caption="Your contributions" rows={q.data.records} rowKey={r => r.id} empty={<EmptyState title="Nothing published yet" body="Share a review or submit a tool to get started." action={<Button asChild variant="outline"><Link to="/submit">Submit a tool</Link></Button>} />} columns={[
        { key: 'title', header: 'Title', cell: r => <span className="font-medium">{r.title}</span> },
        { key: 'kind', header: 'Type', cell: r => <span className="capitalize">{r.kind}</span> },
        { key: 'status', header: 'Status', cell: r => <StatusPill status={(['pending', 'approved', 'rejected', 'draft', 'active', 'paused'].includes(r.status) ? r.status : r.status === 'published' ? 'approved' : 'draft') as CommercialStatus} label={r.status} /> },
        { key: 'date', header: 'Created', cell: r => new Date(r.created_at).toLocaleDateString() },
      ]} />
    </div>}
  </MonetizationShell>;
}
