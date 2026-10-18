import { createFileRoute, Link } from '@tanstack/react-router';
import { queryOptions, useSuspenseQuery, useQueryClient } from '@tanstack/react-query';
import { useServerFn } from '@tanstack/react-start';
import { useState } from 'react';
import { Bookmark, GitCompareArrows, UserRound, MessageSquare, FilePlus2, ShieldCheck, Flag, ArrowUpRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { useApp } from '@/components/app-shell';
import { useAuth } from '@/components/auth-provider';
import { useCatalog } from '@/components/catalog-provider';
import { ToolLogo } from '@/components/catalog-ui';
import { accountSnapshot, saveProfile, createContribution } from '@/lib/account.functions';
import { contributionInput, type contributionKinds } from '@/lib/account-model';
import { supabase } from '@/integrations/supabase/client';
import { meta } from '@/lib/meta';

const accountQuery = queryOptions({ queryKey: ['my-account'], queryFn: () => accountSnapshot() });
export const Route = createFileRoute('/_authenticated/account')({
  head: () => meta('My account & AI workspace', 'Manage your aiBean profile, saved AI stack, comparisons, reviews, submissions and ownership claims.'),
  loader: ({ context }) => context.queryClient.ensureQueryData(accountQuery),
  component: Account,
});
const sections = [
  { key: 'workspace', label: 'My workspace', icon: Bookmark },
  { key: 'review', label: 'My reviews', icon: MessageSquare },
  { key: 'submission', label: 'Tool submissions', icon: FilePlus2 },
  { key: 'claim', label: 'Ownership claims', icon: ShieldCheck },
  { key: 'report', label: 'My reports', icon: Flag },
  { key: 'profile', label: 'Profile & account', icon: UserRound },
] as const;
type Section = typeof sections[number]['key'];
type Kind = typeof contributionKinds[number];

function Account() {
  const { data } = useSuspenseQuery(accountQuery);
  const { user } = useAuth();
  const { tools } = useCatalog();
  const { saved, compare, stacks, toggleSave, toggleCompare, clearCompare } = useApp();
  const [section, setSection] = useState<Section>('workspace');
  const [compose, setCompose] = useState(false);
  const selectedTools = tools.filter(t => saved.includes(t.slug));
  return <div className="max-w-[1400px] mx-auto px-5 lg:px-10 py-10">
    <div className="border-b border-border pb-8 mb-8"><p className="text-xs text-primary font-bold uppercase mb-3">Your aiBean workspace</p><h1 className="font-display text-4xl font-semibold">{data.profile.display_name || 'My account'}</h1><p className="text-sm text-muted-foreground mt-3">{user?.email}</p></div>
    <div className="grid lg:grid-cols-[220px_1fr] gap-8">
      <aside><nav className="flex flex-wrap lg:flex-col gap-2">{sections.map(s => <Button key={s.key} variant={section === s.key ? 'default' : 'ghost'} className="justify-start" onClick={() => { setSection(s.key); setCompose(false); }}><s.icon className="size-4" />{s.label}</Button>)}</nav></aside>
      <main className="min-w-0">
        {section === 'workspace' ? <>
          <div className="grid grid-cols-3 gap-3 border-b pb-6 mb-6">{[['Saved tools', saved.length], ['Collections', Object.keys(stacks).length], ['Comparing', compare.length]].map(([label, n]) => <div key={label}><p className="text-sm text-muted-foreground">{label}</p><p className="font-display text-3xl font-semibold mt-2">{n}</p></div>)}</div>
          <div className="flex flex-wrap items-center justify-between gap-3 mb-4"><h2 className="text-2xl font-semibold">Your shortlist</h2><Button asChild variant="outline"><Link to="/saved">Manage collections <ArrowUpRight className="size-4" /></Link></Button></div>
          {!selectedTools.length && <div className="py-12 border-b"><p className="text-muted-foreground mb-4">No saved tools yet.</p><Button asChild><Link to="/tools" search={{ q: '' }}>Browse AI tools</Link></Button></div>}
          {selectedTools.map(tool => <div key={tool.slug} className="flex flex-wrap items-center gap-4 py-4 border-b"><ToolLogo tool={tool} /><div className="flex-1 min-w-36"><Link to="/tools/$slug" params={{ slug: tool.slug }} className="font-semibold">{tool.name}</Link><p className="text-sm text-muted-foreground mt-1">{tool.category} · {tool.pricing}</p></div><Button variant={compare.includes(tool.slug) ? 'default' : 'outline'} size="icon" title={`Compare ${tool.name}`} aria-label={`Compare ${tool.name}`} onClick={() => toggleCompare(tool.slug)}><GitCompareArrows className="size-4" /></Button><Button variant="ghost" size="icon" aria-label={`Unsave ${tool.name}`} title={`Unsave ${tool.name}`} onClick={() => toggleSave(tool.slug)}><Bookmark className="size-4 fill-current" /></Button></div>)}
          <div className="flex flex-wrap gap-3 mt-6"><Button asChild variant="outline"><Link to="/compare" search={{ tools: compare.join(',') }}>Open comparison <GitCompareArrows className="size-4" /></Link></Button>{compare.length > 0 && <Button variant="ghost" onClick={clearCompare}>Clear comparison</Button>}<Button asChild variant="ghost"><Link to="/skills">Explore AI Skills <ArrowUpRight className="size-4" /></Link></Button></div>
          <p className="text-xs text-muted-foreground mt-6">Saved tools and collections stay in this browser. Comparisons last for this visit.</p>
        </> : section === 'profile' ? <Profile key={data.profile.id} profile={data.profile} /> : <>
          <div className="flex items-center justify-between gap-3 mb-6"><h2 className="text-2xl font-semibold">{sections.find(s => s.key === section)?.label}</h2><Button onClick={() => setCompose(!compose)}>{compose ? 'Close form' : section === 'review' ? 'Write a review' : section === 'claim' ? 'Claim a tool' : section === 'report' ? 'Report an issue' : 'Submit a tool'}</Button></div>
          {compose && <ContributionForm kind={section} onDone={() => setCompose(false)} />}
          {!data.records.some(r => r.kind === section) && <p className="text-sm text-muted-foreground py-8">No {section === 'claim' ? 'ownership claims' : section === 'review' ? 'reviews' : section === 'report' ? 'reports' : 'submissions'} yet.</p>}
          {data.records.filter(r => r.kind === section).map(record => {
            const payload = record.payload && typeof record.payload === 'object' && !Array.isArray(record.payload) ? record.payload : {};
            const slug = String(payload['toolSlug'] ?? '');
            return <article key={record.id} className="py-5 border-b"><div className="flex flex-wrap justify-between gap-3"><h3 className="font-semibold">{record.title}</h3><span className="text-xs border border-border rounded-full px-3 py-1 capitalize">{record.status}</span></div><p className="text-sm text-muted-foreground mt-3 break-words">{String(payload['body'] ?? payload['evidence'] ?? payload['reason'] ?? payload['tagline'] ?? '')}</p>{section === 'review' && <p className="text-sm mt-2">Rating: {String(payload['rating'] ?? '—')}/5</p>}<p className="text-xs text-muted-foreground mt-3">Submitted {new Date(record.created_at).toLocaleDateString()}</p>{tools.some(t => t.slug === slug) && <Link to="/tools/$slug" params={{ slug }} className="inline-flex items-center gap-1 text-primary text-sm mt-3">View tool <ArrowUpRight className="size-3" /></Link>}</article>;
          })}
        </>}
      </main>
    </div>
  </div>;
}

function Profile({ profile }: { profile: { display_name: string; avatar_url: string } }) {
  const save = useServerFn(saveProfile); const qc = useQueryClient();
  const [name, setName] = useState(profile.display_name); const [avatar, setAvatar] = useState(profile.avatar_url);
  const [message, setMessage] = useState(''); const [busy, setBusy] = useState(false);
  return <><h2 className="text-2xl font-semibold mb-6">Profile & account</h2><form className="max-w-xl space-y-5" onSubmit={async e => { e.preventDefault(); setBusy(true); setMessage(''); try { await save({ data: { display_name: name, avatar_url: avatar } }); await qc.invalidateQueries({ queryKey: ['my-account'] }); setMessage('Profile saved.'); } catch (error) { setMessage(error instanceof Error ? error.message : 'Could not save profile.'); } finally { setBusy(false); } }}>
    {avatar && <img src={avatar} alt="Your avatar" className="size-20 rounded-full object-cover border border-border" />}
    <label className="block text-sm font-semibold">Display name<Input required maxLength={100} value={name} onChange={e => setName(e.target.value)} className="mt-2" /></label>
    <label className="block text-sm font-semibold">Avatar image address<Input type="url" placeholder="https://" value={avatar} onChange={e => setAvatar(e.target.value)} className="mt-2" /></label>
    {message && <p role="status" className="text-sm">{message}</p>}<Button disabled={busy} type="submit">{busy ? 'Saving…' : 'Save profile'}</Button>
  </form><div className="border-t mt-8 pt-6"><Button variant="outline" onClick={() => void supabase.auth.signOut()}>Sign out</Button></div></>;
}

function ContributionForm({ kind, onDone }: { kind: Kind; onDone: () => void }) {
  const { tools, categories, useCases, verticals } = useCatalog();
  const { user } = useAuth(); const send = useServerFn(createContribution); const qc = useQueryClient();
  const [form, setForm] = useState<Record<string, string>>({ pricing: 'Freemium', platform: 'Web', api: 'No', rating: '5', method: 'Domain email' });
  const [error, setError] = useState(''); const [busy, setBusy] = useState(false);
  const set = (key: string, value: string) => setForm(prev => ({ ...prev, [key]: value }));
  const field = (key: string, label: string, required = true, type = 'text') => <label className="block text-sm font-semibold">{label}<Input aria-label={label} type={type} required={required} value={form[key] ?? ''} onChange={e => set(key, e.target.value)} className="mt-1" /></label>;
  const select = (key: string, label: string, options: { value: string; name: string }[], required = true) => <label className="block text-sm font-semibold">{label}<select aria-label={label} required={required} value={form[key] ?? ''} onChange={e => set(key, e.target.value)} className="w-full border border-input rounded-md h-9 bg-background px-2 mt-1 font-normal"><option value="">Choose…</option>{options.map(o => <option key={o.value} value={o.value}>{o.name}</option>)}</select></label>;
  const options = (values: string[]) => values.map(v => ({ value: v, name: v }));
  const area = (key: string, label: string) => <label className="block text-sm font-semibold">{label}<Textarea aria-label={label} required rows={4} value={form[key] ?? ''} onChange={e => set(key, e.target.value)} className="mt-1" /></label>;
  return <form className="border border-border rounded-lg p-5 space-y-4 mb-6" onSubmit={async e => {
    e.preventDefault(); setError('');
    const title = kind === 'submission' ? form['name'] : form['title'] || `${kind === 'claim' ? 'Ownership claim' : 'Issue report'}: ${tools.find(t => t.slug === form['toolSlug'])?.name ?? ''}`;
    const result = contributionInput.safeParse({ kind, title, payload: { ...form, author: user?.user_metadata['display_name'] || 'aiBean member', rating: Number(form['rating']), date: new Date().toISOString().slice(0, 10) } });
    if (!result.success) { setError(result.error.issues.map(i => i.message).join(' ')); return; }
    setBusy(true); try { await send({ data: result.data }); await Promise.all([qc.invalidateQueries({ queryKey: ['my-account'] }), qc.invalidateQueries({ queryKey: ['admin'] }), qc.invalidateQueries({ queryKey: ['public-catalog'] })]); onDone(); } catch (err) { setError(err instanceof Error ? err.message : 'Could not send request.'); } finally { setBusy(false); }
  }}>
    <fieldset disabled={busy} className="space-y-4"><legend className="font-semibold mb-4">{kind === 'review' ? 'New review' : kind === 'claim' ? 'New ownership claim' : kind === 'report' ? 'Report a listing issue' : 'New tool submission'}</legend>
    {kind !== 'submission' && select('toolSlug', 'AI tool', tools.map(t => ({ value: t.slug, name: t.name })))}
    {kind === 'submission' && <><div className="grid sm:grid-cols-2 gap-4">{field('name', 'Tool name')}{field('website', 'Website', true, 'url')}{field('tagline', 'One-line description')}{select('category', 'Category', options(categories.map(c => c.name)))}{select('useCase', 'Use case', options(useCases.map(c => c.name)))}{select('vertical', 'Business vertical', options(verticals.map(v => v.name)), false)}{select('pricing', 'Pricing model', options(['Free', 'Freemium', 'Paid', 'Enterprise']))}{field('priceDetail', 'Enterprise Price details', false)}{select('platform', 'Platform', options(['Web', 'iOS', 'Android', 'Desktop']))}{select('api', 'Public API', options(['Yes', 'No']))}{field('documentation', 'Documentation URL', false, 'url')}{field('contact', 'Contact name')}{field('email', 'Contact email', true, 'email')}{select('relationship', 'Relationship to tool', options(['Founder', 'Team member', 'Community member', 'Other']))}</div>{area('description', 'Description')}{area('limitations', 'Limitations')}</>}
    {kind === 'claim' && <>{field('contact', 'Your name')}{field('email', 'Work email', true, 'email')}{field('role', 'Your role')}{select('method', 'Verification method', options(['Domain email', 'DNS TXT record', 'Website meta tag']))}{area('evidence', 'Proof of ownership')}</>}
    {kind === 'review' && <>{field('title', 'Review title')}{select('rating', 'Rating', options(['1', '2', '3', '4', '5']))}{field('role', 'Your role', false)}{area('body', 'Your review')}</>}
    {kind === 'report' && <>{field('title', 'Report title')}{area('reason', 'Issue details')}</>}
    </fieldset>{error && <p role="alert" className="text-destructive text-sm">{error}</p>}<Button type="submit" disabled={busy}>{busy ? 'Sending…' : 'Send for review'}</Button>
  </form>;
}