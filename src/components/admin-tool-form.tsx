import { useState, type ReactNode } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { useCatalog } from '@/components/catalog-provider';
import { ImageUpload } from '@/components/image-upload';
import { getToolPricing, slugify, type Tool } from '@/lib/catalog';
import { verificationStates, statuses, type RecordStatus } from '@/lib/admin-model';

const blank: Tool = { slug: '', name: '', monogram: '', logoColor: 'ink', tagline: '', description: '', category: '', subcategory: '', useCases: [], verticals: [], pricing: 'Freemium', priceDetail: '', verification: 'Unverified', claim: 'Unclaimed', rating: { average: 0, count: 0, distribution: [0, 0, 0, 0, 0] }, score: { total: 0, capability: 0, satisfaction: 0, value: 0, ease: 0, reliability: 0, businessFit: 0, confidence: 0 }, rank: 99, trending: 0, platform: ['Web'], api: false, features: [], pros: [], cons: [], integrations: [], website: '', updated: '', verified: '', verifiedBy: 'aiBean admin team', limitations: [], launched: new Date().getFullYear() };
const scoreKeys = ['total', 'capability', 'satisfaction', 'value', 'ease', 'reliability', 'businessFit', 'confidence'] as const;
const scoreLabels: Record<string, string> = { total: 'Overall', businessFit: 'Business fit' };
const listKeys = [['features', 'Features'], ['pros', 'Pros'], ['cons', 'Cons'], ['limitations', 'Limitations'], ['integrations', 'Integrations'], ['platform', 'Platforms']] as const;

const L = ({ label, children }: { label: string; children: ReactNode }) => <label className="text-sm font-semibold block">{label}{children}</label>;
const Box = ({ title, children }: { title: string; children: ReactNode }) => <fieldset className="border rounded-xl p-4"><legend className="text-xs font-bold uppercase text-muted-foreground px-1">{title}</legend><div className="grid sm:grid-cols-2 gap-3">{children}</div></fieldset>;

export function ToolForm({ initial, status: initialStatus, onSave, onCancel }: { initial?: Partial<Tool> | undefined; status: RecordStatus; onSave: (t: Tool, status: RecordStatus) => void; onCancel: () => void }) {
  const { categories, useCases, verticals } = useCatalog();
  const [t, setT] = useState<Tool>({ ...blank, ...initial, ...getToolPricing({ ...blank, ...initial }), rating: { ...blank.rating, ...initial?.rating }, score: { ...blank.score, ...initial?.score } });
  const [status, setStatus] = useState<RecordStatus>(initialStatus);
  const set = <K extends keyof Tool>(k: K, v: Tool[K]) => setT(p => ({ ...p, [k]: v }));
  const subs = categories.find(c => c.name === t.category)?.subcategories ?? [];
  const sel = 'border border-input rounded-md h-9 px-2 bg-background w-full mt-1 text-sm font-normal';
  const toggle = (k: 'useCases' | 'verticals', v: string) => set(k, t[k].includes(v) ? t[k].filter(x => x !== v) : [...t[k], v]);
  return <div className="border rounded-xl p-5 mt-6 space-y-5 bg-card">
    <Box title="Basics">
      <L label="Name"><Input className="mt-1" value={t.name} onChange={e => setT(p => ({ ...p, name: e.target.value, slug: initial?.slug || slugify(e.target.value), monogram: p.monogram || e.target.value.slice(0, 1) }))} /></L>
      <L label="Web address name"><Input className="mt-1" value={t.slug} disabled={!!initial?.slug} onChange={e => set('slug', e.target.value)} /></L>
      <L label="Tagline"><Input className="mt-1" value={t.tagline} onChange={e => set('tagline', e.target.value)} /></L>
      <L label="Website"><Input className="mt-1" placeholder="https://" value={t.website} onChange={e => set('website', e.target.value)} /></L>
      <L label="Logo letter"><Input className="mt-1" value={t.monogram} onChange={e => set('monogram', e.target.value)} /></L>
      <L label="Logo colour"><select className={sel} value={t.logoColor} onChange={e => set('logoColor', e.target.value)}>{['ink', 'blue', 'orange', 'clay', 'teal', 'violet', 'green', 'pink'].map(c => <option key={c}>{c}</option>)}</select></L>
      <L label="Launched (year)"><Input type="number" className="mt-1" value={t.launched} onChange={e => set('launched', Number(e.target.value))} /></L>
      <L label="Listing status"><select className={sel} value={status} onChange={e => setStatus(e.target.value as RecordStatus)}>{statuses.map(s => <option key={s}>{s}</option>)}</select></L>
      <div className="sm:col-span-2"><L label="Description"><Textarea className="mt-1" rows={3} value={t.description} onChange={e => set('description', e.target.value)} /></L></div>
    </Box>
    <Box title="Logo & product preview">
      <ImageUpload label="Logo (square image works best; replaces the logo letter)" folder="logos" value={t.logoUrl ? [t.logoUrl] : []} onChange={urls => set('logoUrl', urls[0] ?? '')} />
      <ImageUpload label="Product preview images (up to 8)" folder="screenshots" multiple value={t.screenshots ?? []} onChange={urls => set('screenshots', urls)} />
    </Box>
    <Box title="Category & fit">
      <L label="Category"><select className={sel} value={t.category} onChange={e => setT(p => ({ ...p, category: e.target.value, subcategory: '' }))}><option value="">Choose…</option>{categories.map(c => <option key={c.slug}>{c.name}</option>)}</select></L>
      <L label="Subcategory"><select className={sel} value={t.subcategory} onChange={e => set('subcategory', e.target.value)}><option value="">Choose…</option>{subs.map(s => <option key={s.slug}>{s.name}</option>)}</select></L>
      <div className="sm:col-span-2"><p className="text-sm font-semibold">Use cases</p><div className="flex flex-wrap gap-2 mt-2">{useCases.map(u => <button type="button" key={u.slug} onClick={() => toggle('useCases', u.name)} className={`text-xs border rounded-full px-3 py-1 ${t.useCases.includes(u.name) ? 'bg-primary text-primary-foreground border-primary' : 'border-border'}`}>{u.name}</button>)}</div></div>
      <div className="sm:col-span-2"><p className="text-sm font-semibold">Industries</p><div className="flex flex-wrap gap-2 mt-2">{verticals.map(v => <Button variant="outline" size="sm" type="button" key={v.slug} aria-pressed={t.verticals.includes(v.name)} onClick={() => toggle('verticals', v.name)} className={t.verticals.includes(v.name) ? 'bg-primary text-primary-foreground border-primary' : ''}>{v.name}</Button>)}</div></div>
    </Box>
    <Box title="Pricing & platform">
      <L label="Pricing model"><select className={sel} value={t.pricing} onChange={e => set('pricing', e.target.value as Tool['pricing'])}>{['Free', 'Freemium', 'Paid', 'Enterprise'].map(c => <option key={c}>{c}</option>)}</select></L>
      <L label="Price details"><Input className="mt-1" value={t.priceDetail} onChange={e => set('priceDetail', e.target.value)} /></L>
      <L label="Starting price"><Input className="mt-1" placeholder="e.g. $20/month or Contact sales" value={t.startingPrice ?? ''} onChange={e => set('startingPrice', e.target.value)} /></L>
      <label className="text-sm font-semibold flex items-center gap-2"><input type="checkbox" checked={t.freePlan ?? false} onChange={e => set('freePlan', e.target.checked)} /> Free plan</label>
      <label className="text-sm font-semibold flex items-center gap-2"><input type="checkbox" checked={t.api} onChange={e => set('api', e.target.checked)} /> Has a public API</label>
    </Box>
    <Box title="aiBean Verified & ownership">
      <L label="aiBean Verified"><select className={sel} value={t.verification} onChange={e => set('verification', e.target.value as Tool['verification'])}>{verificationStates.map(c => <option key={c}>{c}</option>)}</select></L>
      <L label="Owner claimed"><select className={sel} value={t.claim} onChange={e => set('claim', e.target.value as Tool['claim'])}>{['Unclaimed', 'Claim Pending', 'Claimed', 'Claim Disputed'].map(c => <option key={c}>{c}</option>)}</select></L>
      <L label="Last verified"><Input className="mt-1" placeholder="October 2026" value={t.verified} onChange={e => set('verified', e.target.value)} /></L>
      <L label="Verified by"><Input className="mt-1" value={t.verifiedBy} onChange={e => set('verifiedBy', e.target.value)} /></L>
      <L label="Last updated"><Input className="mt-1" value={t.updated} onChange={e => set('updated', e.target.value)} /></L>
    </Box>
    <Box title="Ranking & scores (0–100)">
      <L label="Rank"><Input type="number" min={1} className="mt-1" value={t.rank} onChange={e => set('rank', Number(e.target.value))} /></L>
      <L label="Trending"><Input type="number" min={0} max={100} className="mt-1" value={t.trending} onChange={e => set('trending', Number(e.target.value))} /></L>
      {scoreKeys.map(k => <L key={k} label={scoreLabels[k] ?? k.charAt(0).toUpperCase() + k.slice(1)}><Input type="number" min={0} max={100} className="mt-1" value={t.score[k]} onChange={e => set('score', { ...t.score, [k]: Number(e.target.value) })} /></L>)}
    </Box>
    <Box title="User reviews summary">
      <L label="Average rating (0–5)"><Input type="number" step="0.1" min={0} max={5} className="mt-1" value={t.rating.average} onChange={e => set('rating', { ...t.rating, average: Number(e.target.value) })} /></L>
      <L label="Number of reviews"><Input type="number" min={0} className="mt-1" value={t.rating.count} onChange={e => set('rating', { ...t.rating, count: Number(e.target.value) })} /></L>
    </Box>
    <Box title="Details (one per line)">
      {listKeys.map(([k, label]) => <L key={k} label={label}><Textarea rows={4} className="mt-1" value={t[k].join('\n')} onChange={e => set(k, e.target.value.split('\n').map(s => s.trimStart()).filter((s, i, a) => s || i === a.length - 1))} /></L>)}
    </Box>
    <div className="flex gap-2"><Button onClick={() => onSave({ ...t, ...Object.fromEntries(listKeys.map(([k]) => [k, t[k].map(s => s.trim()).filter(Boolean)])) } as Tool, status)}>Save tool</Button><Button variant="ghost" onClick={onCancel}>Cancel</Button></div>
  </div>;
}
