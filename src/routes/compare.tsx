import { createFileRoute, Link, useNavigate } from '@tanstack/react-router';
import { useState } from 'react';
import { Fragment } from 'react';
import { Plus, X, ArrowUpRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { DemoLabel, PageIntro, ToolLogo, VerificationBadge } from '@/components/catalog-ui';
import { getToolPricing, type Tool } from '@/lib/catalog';
import { useCatalog } from '@/components/catalog-provider';
import { meta } from '@/lib/meta';

export const Route = createFileRoute('/compare')({
  validateSearch: (s: Record<string, unknown>) => ({ tools: typeof s['tools'] === 'string' ? s['tools'] : 'chatgpt,claude,gemini' }),
  head: () => meta('Compare AI tools', 'Compare AI tools side by side by description, category, pricing, free plans, use cases, industries, and verification.'),
  component: Compare,
});

type ComparisonGroup = { title: string; rows: [string, (tool: Tool) => string][] };
const list = (items: string[]) => items.length ? items.join(' · ') : 'Not listed';
const groups: ComparisonGroup[] = [
  { title: 'Overview', rows: [
    ['Description', t => t.description || 'Not listed'],
    ['Category', t => t.category || 'Not listed'],
  ] },
  { title: 'Pricing', rows: [
    ['Pricing model', t => t.pricing],
    ['Starting price', t => getToolPricing(t).startingPrice],
    ['Free plan', t => getToolPricing(t).freePlan ? 'Yes' : 'No'],
    ['Price details', t => t.priceDetail || 'Not listed'],
  ] },
  { title: 'Use cases & industries', rows: [
    ['Use cases', t => list(t.useCases)],
    ['Industries', t => list(t.verticals)],
  ] },
  { title: 'Capabilities & limitations', rows: [
    ['Key features', t => list(t.features)],
    ['Platforms', t => list(t.platform)],
    ['Integrations', t => list(t.integrations)],
    ['API', t => t.api ? 'Available' : 'Not listed'],
    ['Pros', t => list(t.pros)],
    ['Considerations', t => list(t.cons)],
    ['Limitations', t => list(t.limitations)],
  ] },
  { title: 'Scores, trust & reviews', rows: [
    ['aiBean score', t => `${t.score.total} / 100`],
    ['User reviews', t => `${t.rating.average} / 5 · ${t.rating.count.toLocaleString()} reviews`],
    ['aiBean Verified', t => t.verification],
    ['Owner claimed', t => t.claim === 'Claimed' ? 'Yes, claimed by owner' : t.claim],
    ['Last verified', t => `${t.verified || 'Not listed'}${t.verifiedBy ? ` by ${t.verifiedBy}` : ''}`],
  ] },
];

function Compare() {
  const { tools } = useCatalog();
  const { tools: ids } = Route.useSearch();
  const navigate = useNavigate();
  const [picker, setPicker] = useState(false);
  const slugs = [...new Set(ids.split(',').filter(Boolean))].slice(0, 4);
  const selected = slugs.map(s => tools.find(t => t.slug === s)).filter(t => t !== undefined);
  const update = (next: string[]) => navigate({ to: '/compare', search: { tools: next.join(',') } });
  return <div className="max-w-[1440px] mx-auto px-5 lg:px-10 pt-12">
    <PageIntro eyebrow="RESEARCH / COMPARE" title="Compare tools, not just claims." description="See the details side by side. Add up to four tools to find the fit that makes sense for you." />
    <div className="flex items-center gap-3 mb-6"><Button variant="outline" onClick={() => setPicker(!picker)} disabled={selected.length >= 4}><Plus />Add a tool</Button><DemoLabel /></div>
    {picker && <div className="bg-card border border-border p-4 max-w-xl mb-5 grid grid-cols-2 sm:grid-cols-3 gap-2">{tools.filter(t => !slugs.includes(t.slug)).map(t => <Button key={t.slug} variant="outline" size="sm" onClick={() => { update([...slugs, t.slug]); setPicker(false); }}>{t.name}</Button>)}</div>}
    {selected.length ? <div className="overflow-x-auto border border-border rounded-md">
      <table className="w-full min-w-[760px] text-left text-sm border-collapse table-fixed">
        <thead><tr><th scope="col" className="w-[180px] p-5 bg-paper text-xs text-muted-foreground align-bottom">COMPARISON</th>{selected.map(t => <th scope="col" className="p-5 border-l align-top" key={t.slug}>
          <div className="flex justify-between gap-2"><ToolLogo tool={t} /><Button variant="ghost" size="icon" title={`Remove ${t.name}`} aria-label={`Remove ${t.name}`} onClick={() => update(slugs.filter(s => s !== t.slug))}><X /></Button></div>
          <Link to="/tools/$slug" params={{ slug: t.slug }} className="font-semibold text-lg flex items-center gap-1 mt-3 hover:underline break-words">{t.name}<ArrowUpRight className="size-4 shrink-0" /></Link><VerificationBadge status={t.verification} />
        </th>)}</tr></thead>
        <tbody>{groups.map(group => <Fragment key={group.title}>
          <tr className="border-t"><th colSpan={selected.length + 1} className="px-5 py-3 bg-paper text-primary text-xs uppercase font-semibold">{group.title}</th></tr>
          {group.rows.map(([label, value]) => <tr key={label} className="border-t"><th scope="row" className="p-5 bg-paper text-xs font-semibold align-top">{label}</th>{selected.map(t => <td key={t.slug} className="p-5 border-l align-top text-ink-soft leading-relaxed break-words">{value(t)}</td>)}</tr>)}
        </Fragment>)}</tbody>
      </table>
    </div> : <div className="bg-paper p-16 text-center"><h2 className="font-semibold text-xl">Choose tools to compare</h2><p className="text-sm text-muted-foreground mt-2">Add two to four tools to see them side by side.</p></div>}
    <p className="text-xs text-muted-foreground mt-5">Scores, ratings, and sample pricing are illustrative demo data. Commercial placement does not affect comparisons.</p>
  </div>;
}
