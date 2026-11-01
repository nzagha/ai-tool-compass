/**
 * Synthetic QA identities for an ISOLATED draft backend only.
 * Run: bun scripts/qa-fixtures.ts
 * - Refuses to run unless SUPABASE_URL points at a local (127.0.0.1/localhost) backend.
 * - Generates random passwords and writes them only to /tmp/qa/credentials.json (mode 600).
 * - Never prints passwords. Re-running rotates passwords for existing QA users.
 */
import { randomBytes } from 'node:crypto';
import { mkdirSync, writeFileSync } from 'node:fs';
import { isIsolatedBackend } from '../src/lib/monetization/model';

const url = process.env['SUPABASE_URL'];
const key = process.env['SUPABASE_SERVICE_ROLE_KEY'];
if (!isIsolatedBackend(url) || !key) { console.error('Refusing: not an isolated local backend.'); process.exit(1); }
const h = { apikey: key, Authorization: `Bearer ${key}`, 'Content-Type': 'application/json' };
const DOMAIN = 'qa.aibean.invalid';
const people = [
  { tag: 'user', name: 'QA Member' },
  { tag: 'creator', name: 'QA Creator' },
  { tag: 'vendor-a', name: 'QA Vendor A', tool: 'draftly-writing-assistant' },
  { tag: 'vendor-b', name: 'QA Vendor B', tool: 'pixelforge-studio' },
  { tag: 'admin', name: 'QA Admin' },
] as const;

async function api(path: string, init: RequestInit = {}) {
  const r = await fetch(`${url}${path}`, { ...init, headers: { ...h, ...(init.headers ?? {}) } });
  const text = await r.text();
  if (!r.ok) throw new Error(`${init.method ?? 'GET'} ${path.split('?')[0]} -> ${r.status}`);
  return text ? JSON.parse(text) : null;
}

const existing: { users: { id: string; email: string }[] } = await api('/auth/v1/admin/users?per_page=1000');
const out: Record<string, { email: string; password: string; id: string }> = {};
for (const p of people) {
  const email = `qa-${p.tag}@${DOMAIN}`;
  const password = randomBytes(18).toString('base64url');
  let user = existing.users.find(u => u.email === email);
  if (user) await api(`/auth/v1/admin/users/${user.id}`, { method: 'PUT', body: JSON.stringify({ password }) });
  else user = await api('/auth/v1/admin/users', { method: 'POST', body: JSON.stringify({ email, password, email_confirm: true, user_metadata: { display_name: p.name } }) });
  out[p.tag] = { email, password, id: user!.id };
}
const rest = (t: string, q = '') => `/rest/v1/${t}${q}`;
// Admin role (operator procedure, not self-service).
await api(rest('user_roles', `?user_id=eq.${out['admin']!.id}`), { method: 'DELETE' });
await api(rest('user_roles'), { method: 'POST', body: JSON.stringify({ user_id: out['admin']!.id, role: 'admin' }) });
// Approved Creator capability.
await api(rest('user_capabilities'), { method: 'POST', headers: { Prefer: 'resolution=ignore-duplicates' }, body: JSON.stringify({ user_id: out['creator']!.id, capability: 'approved_creator', granted_by: out['admin']!.id }) });
// Tool ownership through an approved claim (vendor_access follows the claim).
for (const p of people) if ('tool' in p) {
  await api(rest('directory_records'), { method: 'POST', headers: { Prefer: 'resolution=merge-duplicates' }, body: JSON.stringify({ kind: 'claim', slug: `qa-claim-${p.tool}`, title: `QA claim ${p.tool}`, status: 'approved', owner_id: out[p.tag]!.id, payload: { toolSlug: p.tool, evidence: 'Synthetic QA fixture', company: 'QA', role: 'Owner' } }) });
}
mkdirSync('/tmp/qa', { recursive: true });
writeFileSync('/tmp/qa/credentials.json', JSON.stringify(out, null, 2), { mode: 0o600 });
console.log('QA fixtures ready for:', Object.values(out).map(o => o.email).join(', '));
