import { createFileRoute, Link } from '@tanstack/react-router';
import { useMemo, useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useServerFn } from '@tanstack/react-start';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { useAuth } from '@/components/auth-provider';
import { adminSnapshot, saveAdminRecord, saveMemberRole } from '@/lib/admin.functions';
import { sections, statuses, kinds, type AdminSection, type RecordKind, type RecordStatus } from '@/lib/admin-model';
import { meta } from '@/lib/meta';

export const Route = createFileRoute('/admin')({ ssr: false, head: () => meta('Admin control panel', 'Manage aiBean tools, claims, reviews and accounts.'), component: Admin });

type Rec = { id: string; kind: string; slug: string; title: string; status: string; payload: unknown; owner_id: string | null; updated_at: string };

function Admin() {
  const { user, isAdmin, loading } = useAuth();
  if (loading) return <p className="p-10 text-muted-foreground">Loading…</p>;
  if (!user) return <Gate text="Sign in to open the admin control panel." />;
  if (!isAdmin) return <Gate text="Your account doesn't have admin access. Ask an existing admin to grant it." />;
  return <Panel />;
}
function Gate({ text }: { text: string }) { return <div className="max-w-md mx-auto py-24 text-center"><h1 className="text-3xl font-semibold">Admin control panel</h1><p className="text-muted-foreground mt-4">{text}</p><Button asChild className="mt-6"><Link to="/login">Go to sign in</Link></Button></div>; }

function Panel() {
  const snap = useServerFn(adminSnapshot); const qc = useQueryClient();
  const { data, error, isLoading } = useQuery({ queryKey: ['admin'], queryFn: () => snap() });
  const [section, setSection] = useState<AdminSection>('overview');
  const refresh = () => qc.invalidateQueries({ queryKey: ['admin'] });
  const groups = useMemo(() => Array.from(new Set(sections.map(s => s.group))), []);
  return <div className="max-w-[1400px] mx-auto px-5 lg:px-10 py-10 grid lg:grid-cols-[220px_1fr] gap-10">
    <aside className="space-y-6">{groups.map(g => <div key={g}><p className="text-xs font-bold text-muted-foreground uppercase mb-2">{g}</p>{sections.filter(s => s.group === g).map(s => <button key={s.key} onClick={() => setSection(s.key)} className={`block w-full text-left text-sm px-3 py-1.5 rounded-md ${section === s.key ? 'bg-primary text-primary-foreground' : 'hover:bg-muted'}`}>{s.label}</button>)}</div>)}</aside>
    <main>{isLoading ? <p>Loading…</p> : error ? <p className="text-destructive">{(error as Error).message}</p> : data && <Section section={section} data={data as unknown as Snapshot} refresh={refresh} />}</main>
  </div>;
}
type Snapshot = { records: Rec[]; audit: { id: string; action: string; record_kind: string; record_title: string; created_at: string }[]; profiles: { id: string; display_name: string; created_at: string }[]; roles: { user_id: string; role: string }[]; userId: string };

function Section({ section, data, refresh }: { section: AdminSection; data: Snapshot; refresh: () => void }) {
  const title = sections.find(s => s.key === section)?.label;
  if (section === 'overview') return <div><h1 className="text-3xl font-semibold">Overview</h1><div className="grid sm:grid-cols-3 gap-4 mt-6">{[['Records', data.records.length], ['Pending review', data.records.filter(r => r.status === 'pending').length], ['Accounts', data.profiles.length], ['Claims', data.records.filter(r => r.kind === 'claim').length], ['Reviews', data.records.filter(r => r.kind === 'review').length], ['Audit events', data.audit.length]].map(([l, n]) => <div key={l} className="border rounded-xl p-5 bg-card"><p className="text-sm text-muted-foreground">{l}</p><p className="text-3xl font-semibold mt-1">{n}</p></div>)}</div></div>;
  if (section === 'users') return <Users data={data} refresh={refresh} />;
  if (section === 'audit') return <div><h1 className="text-3xl font-semibold">Audit history</h1><table className="w-full text-sm mt-6"><tbody>{data.audit.map(a => <tr key={a.id} className="border-b"><td className="py-2">{new Date(a.created_at).toLocaleString()}</td><td>{a.action}</td><td>{a.record_kind}</td><td>{a.record_title}</td></tr>)}</tbody></table>{!data.audit.length && <p className="text-muted-foreground mt-4">No changes yet.</p>}</div>;
  const kind: RecordKind = section === 'verification' || section === 'ranking' ? 'tool' : (kinds as readonly string[]).includes(section) ? section as RecordKind : 'editorial';
  return <Records title={title ?? ''} kind={kind} records={data.records.filter(r => r.kind === kind)} refresh={refresh} />;
}

function Records({ title, kind, records, refresh }: { title: string; kind: RecordKind; records: Rec[]; refresh: () => void }) {
  const save = useServerFn(saveAdminRecord);
  const [edit, setEdit] = useState<{ slug: string; title: string; status: RecordStatus; payload: string; owner_id: string | null } | null>(null);
  const [err, setErr] = useState<string | null>(null);
  async function submit(r = edit) {
    if (!r) return; setErr(null);
    try { await save({ data: { kind, slug: r.slug, title: r.title, status: r.status, payload: JSON.parse(r.payload || '{}'), owner_id: r.owner_id } }); setEdit(null); refresh(); }
    catch (e) { setErr(e instanceof Error ? e.message : String(e)); }
  }
  return <div><div className="flex items-center justify-between"><h1 className="text-3xl font-semibold">{title}</h1><Button onClick={() => setEdit({ slug: '', title: '', status: 'draft', payload: '{}', owner_id: null })}>Add new</Button></div>
    {err && <p className="text-destructive text-sm mt-4">{err}</p>}
    {edit && <div className="border rounded-xl p-5 mt-6 space-y-3 bg-card"><Input placeholder="Title" value={edit.title} onChange={e => setEdit({ ...edit, title: e.target.value })} /><Input placeholder="slug-like-this" value={edit.slug} onChange={e => setEdit({ ...edit, slug: e.target.value })} /><select className="border rounded-md h-9 px-2 bg-background" value={edit.status} onChange={e => setEdit({ ...edit, status: e.target.value as RecordStatus })}>{statuses.map(s => <option key={s}>{s}</option>)}</select><Textarea rows={8} className="font-mono text-xs" value={edit.payload} onChange={e => setEdit({ ...edit, payload: e.target.value })} /><div className="flex gap-2"><Button onClick={() => void submit()}>Save</Button><Button variant="ghost" onClick={() => setEdit(null)}>Cancel</Button></div></div>}
    <table className="w-full text-sm mt-6"><thead><tr className="text-left text-muted-foreground border-b"><th className="py-2">Title</th><th>Status</th><th>Updated</th><th></th></tr></thead><tbody>{records.map(r => <tr key={r.id} className="border-b"><td className="py-2">{r.title}</td><td><select className="border rounded-md h-8 px-2 bg-background" value={r.status} onChange={e => void submit({ slug: r.slug, title: r.title, status: e.target.value as RecordStatus, payload: JSON.stringify(r.payload), owner_id: r.owner_id })}>{statuses.map(s => <option key={s}>{s}</option>)}</select></td><td>{new Date(r.updated_at).toLocaleDateString()}</td><td><Button size="sm" variant="ghost" onClick={() => setEdit({ slug: r.slug, title: r.title, status: r.status as RecordStatus, payload: JSON.stringify(r.payload, null, 2), owner_id: r.owner_id })}>Edit</Button></td></tr>)}</tbody></table>
    {!records.length && <p className="text-muted-foreground mt-4">Nothing here yet.</p>}</div>;
}

function Users({ data, refresh }: { data: Snapshot; refresh: () => void }) {
  const setRole = useServerFn(saveMemberRole); const [err, setErr] = useState<string | null>(null);
  return <div><h1 className="text-3xl font-semibold">Users & access</h1>{err && <p className="text-destructive text-sm mt-4">{err}</p>}<table className="w-full text-sm mt-6"><tbody>{data.profiles.map(p => { const role = data.roles.find(r => r.user_id === p.id)?.role ?? 'user'; return <tr key={p.id} className="border-b"><td className="py-2">{p.display_name || p.id.slice(0, 8)}{p.id === data.userId && ' (you)'}</td><td><select className="border rounded-md h-8 px-2 bg-background" value={role} onChange={async e => { setErr(null); try { await setRole({ data: { userId: p.id, role: e.target.value as 'admin' } }); refresh(); } catch (x) { setErr(x instanceof Error ? x.message : String(x)); } }}>{['admin', 'moderator', 'user'].map(r => <option key={r}>{r}</option>)}</select></td></tr>; })}</tbody></table></div>;
}
