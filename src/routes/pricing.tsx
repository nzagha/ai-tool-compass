import { createFileRoute, Link } from '@tanstack/react-router';
import { useQuery } from '@tanstack/react-query';
import { useServerFn } from '@tanstack/react-start';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/components/auth-provider';
import { MonetizationShell, DataTable, EmptyState, ErrorState, LoadingState, PaymentUnavailable, Tag } from '@/components/monetization/ui';
import { pricingMatrix } from '@/lib/monetization.functions';
import { publicPricingRefs, AUTHORITY_LABEL, safeMessage, type PricingRef } from '@/lib/monetization/model';
import { formatInterval, formatMoney } from '@/lib/monetization/money';
import { meta } from '@/lib/meta';

export const Route = createFileRoute('/pricing')({
  head: () => meta('Pricing and vendor offers', 'Browsing aiBean is free. See the Featured placement offer and how paid options stay separate from honest rankings.'),
  component: Pricing,
  errorComponent: ({ error }) => <div className="max-w-xl mx-auto py-16 px-5"><ErrorState message={safeMessage(error)} /></div>,
});

function Pricing() {
  const { user, loading } = useAuth();
  const featured = publicPricingRefs();
  return <MonetizationShell eyebrow="Pricing" title="Free to browse. Paid only where it's fair." intro="Finding, comparing and saving AI tools costs nothing. Paid options buy a review or a labeled placement, never a better rank.">
    <section aria-labelledby="free" className="grid sm:grid-cols-2 gap-4">
      <div className="rounded-2xl border bg-card p-6"><h2 id="free" className="font-display text-xl font-semibold">Members</h2><p className="text-3xl font-semibold mt-3">Free</p><p className="text-sm text-muted-foreground mt-2">Browse, compare, save stacks, write reviews and read every profile.</p><Button asChild className="mt-5">{user ? <Link to="/tools" search={{ q: '' }}>Browse AI tools</Link> : <Link to="/login">Join the crew</Link>}</Button></div>
      {featured.map(r => <div key={r.id} className="rounded-2xl border bg-card p-6"><div className="flex flex-wrap gap-2 items-center justify-between"><h2 className="font-display text-xl font-semibold">{r.label}</h2><Tag tone="success">{AUTHORITY_LABEL[r.authority]}</Tag></div><p className="text-3xl font-semibold mt-3">{formatMoney(r.price, { compact: true })}</p><p className="text-sm text-muted-foreground">{formatInterval(r.interval, r.days)}</p><p className="text-sm mt-3">{r.note}</p></div>)}
    </section>
    <section aria-labelledby="rules" className="mt-10"><h2 id="rules" className="font-display text-2xl font-semibold">What money can't buy</h2><ul className="grid sm:grid-cols-2 gap-3 mt-4 text-sm">{['Organic rank or score', 'aiBean Verified or Last Verified', 'Tool ownership — only an approved claim does that', 'Creator approval', 'Hidden or removed reviews', 'Unlabeled placement'].map(t => <li key={t} className="rounded-lg border px-4 py-3 bg-card">{t}</li>)}</ul></section>
    <section aria-labelledby="matrix" className="mt-10"><h2 id="matrix" className="font-display text-2xl font-semibold">Full price list</h2>
      {loading ? <LoadingState /> : user ? <Matrix /> : <EmptyState title="Sign in to see every proposed price" body="The full list is only shown to members while prices are still being reviewed." action={<Button asChild><Link to="/login">Sign in</Link></Button>} />}
    </section>
    <div className="mt-8"><PaymentUnavailable /></div>
  </MonetizationShell>;
}

function Matrix() {
  const fetch = useServerFn(pricingMatrix);
  const q = useQuery({ queryKey: ['pricing-matrix'], queryFn: () => fetch() });
  if (q.isLoading) return <LoadingState label="Loading the price list…" />;
  if (q.error) return <ErrorState message={safeMessage(q.error)} onRetry={() => void q.refetch()} />;
  const rows = (q.data?.refs ?? []) as PricingRef[];
  return <div className="mt-4"><p className="text-sm text-muted-foreground mb-4">Items marked Proposed are not live offers and can change.</p><DataTable caption="Proposed and approved prices" rows={rows} rowKey={r => r.id} empty={<EmptyState title="No prices listed" />} columns={[
    { key: 'item', header: 'Item', cell: r => <span className="font-medium">{r.label}</span> },
    { key: 'price', header: 'Price', cell: r => `${formatMoney(r.price, { compact: true })} ${formatInterval(r.interval, r.days)}` },
    { key: 'status', header: 'Status', cell: r => <Tag tone={r.authority === 'owner_approved' ? 'success' : 'warning'}>{AUTHORITY_LABEL[r.authority]}</Tag> },
    { key: 'version', header: 'Version', cell: r => <span className="font-mono text-xs">{r.version}</span> },
    { key: 'note', header: 'Note', cell: r => <span className="text-muted-foreground">{r.note}</span> },
  ]} /></div>;
}
