import { createFileRoute, Link } from '@tanstack/react-router';
import { useQuery } from '@tanstack/react-query';
import { useServerFn } from '@tanstack/react-start';
import { Button } from '@/components/ui/button';
import { MonetizationShell, AccessDenied, EmptyState, ErrorState, LoadingState, PaymentUnavailable } from '@/components/monetization/ui';
import { vendorTool } from '@/lib/monetization.functions';
import { useCatalog } from '@/components/catalog-provider';
import { safeMessage } from '@/lib/monetization/model';
import { meta } from '@/lib/meta';

export const Route = createFileRoute('/_authenticated/vendor-studio/$slug')({
  head: () => meta('Manage your tool', 'Owner view of an AI tool listing on aiBean: reviews and request status.'),
  component: VendorToolPage,
  errorComponent: ({ error }) => <div className="max-w-xl mx-auto py-16 px-5"><ErrorState message={safeMessage(error)} /></div>,
});

function VendorToolPage() {
  const { slug } = Route.useParams(); const { tools } = useCatalog();
  const fetch = useServerFn(vendorTool);
  const q = useQuery({ queryKey: ['vendor-tool', slug], queryFn: () => fetch({ data: { slug } }), retry: false });
  const name = tools.find(t => t.slug === slug)?.name ?? slug;
  return <MonetizationShell eyebrow="Vendor" title={name} actions={<Button asChild variant="ghost"><Link to="/vendor-studio">All your tools</Link></Button>}>
    {q.isLoading ? <LoadingState /> : q.error ? <AccessDenied message={safeMessage(q.error, 'You do not own this tool.')} /> : q.data && <div className="space-y-6">
      <div className="grid sm:grid-cols-2 gap-4"><div className="rounded-xl border bg-card p-5"><p className="text-sm text-muted-foreground">Published reviews</p><p className="text-2xl font-semibold mt-1">{q.data.publishedReviews}</p></div><div className="rounded-xl border bg-card p-5"><p className="text-sm text-muted-foreground">Rank, score and verification</p><p className="text-sm mt-2">Set by aiBean editors only. Vendors can't change them.</p></div></div>
      <section><h2 className="font-display text-xl font-semibold mb-3">Edit and verification requests</h2><EmptyState title="No requests" body="Paid edit and verification requests come in a later phase." /></section>
      <PaymentUnavailable />
      <Button asChild variant="outline"><Link to="/tools/$slug" params={{ slug }}>View public listing</Link></Button>
    </div>}
  </MonetizationShell>;
}
