import { createFileRoute, Link } from '@tanstack/react-router';
import { useQuery } from '@tanstack/react-query';
import { useServerFn } from '@tanstack/react-start';
import { Button } from '@/components/ui/button';
import { MonetizationShell, AccessDenied, DataTable, EmptyState, ErrorState, LoadingState } from '@/components/monetization/ui';
import { vendorWorkspace } from '@/lib/monetization.functions';
import { useCatalog } from '@/components/catalog-provider';
import { safeMessage } from '@/lib/monetization/model';
import { meta } from '@/lib/meta';

export const Route = createFileRoute('/_authenticated/vendor-studio/')({
  head: () => meta('Vendor studio', 'See every AI tool you own on aiBean and open its management page.'),
  component: VendorStudio,
  errorComponent: ({ error }) => <div className="max-w-xl mx-auto py-16 px-5"><ErrorState message={safeMessage(error)} /></div>,
});

function VendorStudio() {
  const fetch = useServerFn(vendorWorkspace); const { tools } = useCatalog();
  const q = useQuery({ queryKey: ['vendor-workspace'], queryFn: () => fetch(), retry: false });
  return <MonetizationShell eyebrow="Vendor" title="Vendor studio" intro="Tools you own after an approved claim. Paying never makes you an owner.">
    {q.isLoading ? <LoadingState /> : q.error ? <AccessDenied message={safeMessage(q.error, 'You need an approved Tool ownership claim to open the Vendor area.')} action={<Button asChild><Link to="/claim" search={{ tool: '' }}>Claim a listing</Link></Button>} /> : q.data && <DataTable caption="Tools you own" rows={q.data.tools} rowKey={t => t.tool_slug} empty={<EmptyState title="No tools yet" body="Claim your tool listing to manage it here." action={<Button asChild><Link to="/claim" search={{ tool: '' }}>Claim a listing</Link></Button>} />} columns={[
      { key: 'tool', header: 'Tool', cell: t => <span className="font-medium">{tools.find(x => x.slug === t.tool_slug)?.name ?? t.tool_slug}</span> },
      { key: 'since', header: 'Owner since', cell: t => new Date(t.granted_at).toLocaleDateString() },
      { key: 'open', header: 'Manage', cell: t => <Button asChild size="sm" variant="outline"><Link to="/vendor-studio/$slug" params={{ slug: t.tool_slug }}>Open</Link></Button> },
    ]} />}
  </MonetizationShell>;
}
