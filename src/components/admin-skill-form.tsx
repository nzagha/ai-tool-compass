import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { useCatalog } from '@/components/catalog-provider';
import { slugify, type AISkill } from '@/lib/catalog';
import { skillFields, statuses, type RecordStatus } from '@/lib/admin-model';

const blank: AISkill = { slug: '', name: '', description: '', level: 'Beginner', category: '', tools: [], outcomes: [] };

export function SkillForm({ initial, status: initialStatus, onSave, onCancel }: {
  initial?: Partial<AISkill> | undefined; status: RecordStatus;
  onSave: (skill: AISkill, status: RecordStatus) => Promise<void>; onCancel: () => void;
}) {
  const { tools, categories } = useCatalog();
  const [skill, setSkill] = useState<AISkill>({ ...blank, ...initial });
  const [outcomes, setOutcomes] = useState((initial?.outcomes ?? []).join('\n'));
  const [status, setStatus] = useState(initialStatus);
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);
  const categoryNames = Array.from(new Set([...categories.map(c => c.name), skill.category].filter(Boolean)));
  const missingTools = skill.tools.filter(slug => !tools.some(t => t.slug === slug));
  const selectClass = 'border border-input rounded-md h-9 px-2 bg-background w-full mt-1 text-sm font-normal';
  async function submit(event: React.FormEvent) {
    event.preventDefault();
    const result = skillFields.safeParse({ ...skill, outcomes: outcomes.split('\n').map(v => v.trim()).filter(Boolean) });
    if (!result.success) { setError(result.error.issues.map(i => i.message).join(' ')); return; }
    setError(''); setSaving(true);
    try { await onSave(result.data, status); } finally { setSaving(false); }
  }
  return <form onSubmit={submit} className="border rounded-xl p-5 mt-6 space-y-5 bg-card">
    <fieldset disabled={saving} className="space-y-4">
      <legend className="font-display text-xl font-semibold mb-4">{initial?.slug ? 'Edit AI skill' : 'New AI skill'}</legend>
      <div className="grid sm:grid-cols-2 gap-4">
        <label className="text-sm font-semibold">Name<Input required className="mt-1" value={skill.name} onChange={e => setSkill(s => ({ ...s, name: e.target.value, slug: initial?.slug || slugify(e.target.value) }))} /></label>
        <label className="text-sm font-semibold">Web address name<Input required className="mt-1" disabled={Boolean(initial?.slug)} value={skill.slug} onChange={e => setSkill(s => ({ ...s, slug: e.target.value }))} /></label>
        <label className="text-sm font-semibold">Level<select className={selectClass} value={skill.level} onChange={e => setSkill(s => ({ ...s, level: e.target.value as AISkill['level'] }))}>{skillFields.shape.level.options.map(level => <option key={level}>{level}</option>)}</select></label>
        <label className="text-sm font-semibold">Category<select required className={selectClass} value={skill.category} onChange={e => setSkill(s => ({ ...s, category: e.target.value }))}><option value="">Choose…</option>{categoryNames.map(name => <option key={name}>{name}</option>)}</select></label>
        <label className="text-sm font-semibold">Listing status<select className={selectClass} value={status} onChange={e => setStatus(e.target.value as RecordStatus)}>{statuses.map(s => <option key={s}>{s}</option>)}</select></label>
      </div>
      <label className="text-sm font-semibold block">Description<Textarea aria-label="Description" required className="mt-1" rows={3} value={skill.description} onChange={e => setSkill(s => ({ ...s, description: e.target.value }))} /></label>
      <label className="text-sm font-semibold block">Learning outcomes (one per line)<Textarea aria-label="Learning outcomes" className="mt-1" rows={5} value={outcomes} onChange={e => setOutcomes(e.target.value)} /></label>
      <fieldset><legend className="text-sm font-semibold mb-2">Linked AI tools</legend><div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-2">{[...tools.map(t => ({ slug: t.slug, name: t.name })), ...missingTools.map(slug => ({ slug, name: `${slug} (unavailable)` }))].map(tool => <label key={tool.slug} className="flex items-center gap-2 text-sm border border-border rounded-md p-2"><input type="checkbox" checked={skill.tools.includes(tool.slug)} onChange={e => setSkill(s => ({ ...s, tools: e.target.checked ? [...s.tools, tool.slug] : s.tools.filter(v => v !== tool.slug) }))} />{tool.name}</label>)}</div></fieldset>
    </fieldset>
    {error && <p role="alert" className="text-sm text-destructive">{error}</p>}
    <div className="flex gap-2"><Button type="submit" disabled={saving}>{saving ? 'Saving…' : 'Save skill'}</Button><Button type="button" variant="ghost" disabled={saving} onClick={onCancel}>Cancel</Button></div>
  </form>;
}