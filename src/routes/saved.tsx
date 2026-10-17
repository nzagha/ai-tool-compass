import { createFileRoute, Link } from '@tanstack/react-router';
import { useState } from 'react';
import { ArrowRight, Bookmark, GitCompareArrows, Plus, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useApp } from '@/components/app-shell';
import { PageIntro, ToolLogo } from '@/components/catalog-ui';
import { tools } from '@/lib/catalog';
import { useCatalog } from '@/components/catalog-provider';
import { meta } from '@/lib/meta';
export const Route=createFileRoute('/saved')({head:()=>meta('My AI Stack','Collect and compare AI tools in your personal stacks.'),component:Saved});
function Saved() {
  const { tools } = useCatalog();
  const { saved, stacks, toggleSave, toggleCompare, addStack, moveToStack, removeFromStack } = useApp();
  const [name, setName] = useState('');
  const savedTools = tools.filter(t => saved.includes(t.slug));
  return <div className="max-w-[1200px] mx-auto px-5 lg:px-10 pt-12">
    <PageIntro eyebrow="YOUR WORKSPACE / SAVED" title="My AI Stack" description="Keep your shortlist in one place. Organize tools into collections and compare them when you're ready." />
    <form onSubmit={e => { e.preventDefault(); if (name.trim()) { addStack(name.trim()); setName(''); } }} className="flex gap-2 max-w-md mb-10"><Input value={name} onChange={e => setName(e.target.value)} placeholder="New collection name" aria-label="New collection name" /><Button type="submit" variant="outline"><Plus />Create stack</Button></form>
    {!savedTools.length ? <div className="bg-paper border border-border text-center py-20 px-6"><Bookmark className="mx-auto size-8 text-muted-foreground" /><h2 className="text-xl font-semibold mt-4">Your stack starts here.</h2><p className="text-ink-soft text-sm mt-2 max-w-md mx-auto">Save the tools you want to revisit, group them by project, and compare your shortlist side by side.</p><Button asChild className="mt-6"><Link to="/tools" search={{ q: '' }}>Explore tools <ArrowRight /></Link></Button></div> : <div className="grid gap-3">{savedTools.map(t => <div key={t.slug} className="border border-border p-5 flex flex-wrap items-center gap-4"><ToolLogo tool={t} /><div className="flex-1 min-w-[180px]"><Link to="/tools/$slug" params={{ slug: t.slug }} className="font-semibold hover:underline">{t.name}</Link><p className="text-xs text-muted-foreground mt-1">{t.category} · {t.tagline}</p></div><select aria-label={`Add ${t.name} to stack`} className="border border-border bg-card text-xs p-2" value="" onChange={e => moveToStack(t.slug, e.target.value)}><option value="">Add to collection…</option>{Object.keys(stacks).map(n => <option key={n}>{n}</option>)}</select><Button variant="ghost" size="icon" title="Compare" onClick={() => toggleCompare(t.slug)}><GitCompareArrows /></Button><Button variant="ghost" size="icon" title="Remove saved tool" onClick={() => toggleSave(t.slug)}><Trash2 /></Button></div>)}</div>}
    {Object.entries(stacks).map(([stack, slugs]) => <section key={stack} className="mt-12"><h2 className="font-semibold text-xl mb-4">{stack} <span className="text-xs text-muted-foreground font-normal ml-2">{slugs.length} tools</span></h2>{slugs.length ? <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">{slugs.map(slug => { const t = tools.find(x => x.slug === slug); return t ? <div key={slug} className="border border-border p-5"><div className="flex items-start justify-between"><ToolLogo tool={t} /><Button variant="ghost" size="icon" title="Remove from collection" onClick={() => removeFromStack(slug, stack)}><Trash2 /></Button></div><Link to="/tools/$slug" params={{ slug }} className="font-semibold mt-4 block hover:underline">{t.name}</Link><p className="text-xs text-muted-foreground mt-1">{t.category}</p><Input className="mt-4" placeholder="Add a note (coming soon)" aria-label={`Note for ${t.name}`} disabled /></div> : null; })}</div> : <p className="text-sm text-muted-foreground bg-paper p-6">No tools in this collection yet. Use “Add to collection” on a saved tool above.</p>}</section>)}
    <p className="text-xs text-muted-foreground mt-8">Saved tools and collections are stored in this browser only; they do not sync across devices.</p>
  </div>;
}
