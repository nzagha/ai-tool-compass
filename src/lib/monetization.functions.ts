import { createServerFn } from '@tanstack/react-start';
import type { SupabaseClient } from '@supabase/supabase-js';
import type { Database } from '@/integrations/supabase/types';
import { requireSupabaseAuth } from '@/integrations/supabase/auth-middleware';
import { creatorApplicationInput, creatorReviewInput, revokeCreatorInput, toolSlugInput, PRICING_REFS, isIsolatedBackend, canEnter, canManageTool, type AccessFacts } from '@/lib/monetization/model';

type Ctx = { supabase: SupabaseClient<Database>; userId: string };

/** Reads identity, protected role, capability and ownership facts from the database for the caller only. */
async function loadFacts(ctx: Ctx): Promise<AccessFacts & { hasPendingApplication: boolean }> {
  const [admin, creator, owned, pending] = await Promise.all([
    ctx.supabase.rpc('has_role', { _user_id: ctx.userId, _role: 'admin' }),
    ctx.supabase.rpc('has_capability', { _user_id: ctx.userId, _capability: 'approved_creator' }),
    ctx.supabase.from('vendor_access').select('tool_slug').eq('user_id', ctx.userId),
    ctx.supabase.from('creator_applications').select('id').eq('user_id', ctx.userId).eq('status', 'pending').limit(1),
  ]);
  if (admin.error || creator.error || owned.error || pending.error) throw new Error('Your access could not be checked. Please try again.');
  return { userId: ctx.userId, isAdmin: !!admin.data, isApprovedCreator: !!creator.data, ownedToolSlugs: (owned.data ?? []).map((r: { tool_slug: string }) => r.tool_slug), hasPendingApplication: (pending.data ?? []).length > 0 };
}
function deny(message: string): never { throw new Error(message); }

export const accessSummary = createServerFn({ method: 'POST' }).middleware([requireSupabaseAuth]).handler(async ({ context }) => {
  const f = await loadFacts(context as Ctx);
  return { ...f, areas: { membership: canEnter('membership', f), vendor: canEnter('vendor', f), creator: canEnter('creator', f), admin: canEnter('admin', f) } };
});

/** Full historical/proposed matrix is login-gated on the server. */
export const pricingMatrix = createServerFn({ method: 'POST' }).middleware([requireSupabaseAuth]).handler(async () => ({ refs: PRICING_REFS.map(r => ({ ...r })) }));

export const membershipOverview = createServerFn({ method: 'POST' }).middleware([requireSupabaseAuth]).handler(async ({ context }) => {
  const f = await loadFacts(context as Ctx);
  const apps = await context.supabase.from('creator_applications').select('id,status,review_reason,created_at,reviewed_at').eq('user_id', context.userId).order('created_at', { ascending: false });
  if (apps.error) throw new Error('Your membership could not be loaded.');
  return { facts: f, membership: null, transactions: [] as never[], paymentsAvailable: false, applications: apps.data ?? [] };
});

export const requestCreatorAccess = createServerFn({ method: 'POST' }).middleware([requireSupabaseAuth]).inputValidator((v: unknown) => creatorApplicationInput.parse(v)).handler(async ({ data, context }) => {
  const { data: id, error } = await context.supabase.rpc('request_creator_access', { _pitch: data.pitch });
  if (error) throw new Error(error.message);
  return { id };
});

export const creatorWorkspace = createServerFn({ method: 'POST' }).middleware([requireSupabaseAuth]).handler(async ({ context }) => {
  const f = await loadFacts(context as Ctx);
  if (!canEnter('creator', f)) deny('Approved Creator access is required.');
  const records = await context.supabase.from('directory_records').select('id,kind,title,status,created_at').eq('owner_id', context.userId).order('created_at', { ascending: false }).limit(50);
  if (records.error) throw new Error('Your Creator workspace could not be loaded.');
  return { facts: f, records: records.data ?? [], earnings: null };
});

export const vendorWorkspace = createServerFn({ method: 'POST' }).middleware([requireSupabaseAuth]).handler(async ({ context }) => {
  const f = await loadFacts(context as Ctx);
  if (!canEnter('vendor', f)) deny('You need an approved Tool ownership claim to open the Vendor area.');
  const access = await context.supabase.from('vendor_access').select('tool_slug,granted_at').eq('user_id', context.userId).order('granted_at');
  if (access.error) throw new Error('Your tools could not be loaded.');
  return { facts: f, tools: access.data ?? [] };
});

export const vendorTool = createServerFn({ method: 'POST' }).middleware([requireSupabaseAuth]).inputValidator((v: unknown) => toolSlugInput.parse(v)).handler(async ({ data, context }) => {
  const f = await loadFacts(context as Ctx);
  const { data: owns, error } = await context.supabase.rpc('owns_tool', { _user_id: context.userId, _tool_slug: data.slug });
  if (error) throw new Error('Ownership could not be checked.');
  if (!owns || !canManageTool(data.slug, f)) deny('You do not own this tool. Only its approved owner can manage it.');
  const reviews = await context.supabase.from('directory_records').select('id', { count: 'exact', head: true }).eq('kind', 'review').eq('status', 'published').contains('payload', { toolSlug: data.slug });
  return { slug: data.slug, publishedReviews: reviews.count ?? 0, pendingRequests: [] as never[] };
});

export const adminMonetization = createServerFn({ method: 'POST' }).middleware([requireSupabaseAuth]).handler(async ({ context }) => {
  const f = await loadFacts(context as Ctx);
  if (!f.isAdmin) deny('Admin access is required.');
  const [apps, caps, access, audit, profiles] = await Promise.all([
    context.supabase.from('creator_applications').select('id,user_id,pitch,status,review_reason,created_at,reviewed_at').order('created_at', { ascending: false }).limit(200),
    context.supabase.from('user_capabilities').select('user_id,capability,granted_at').limit(500),
    context.supabase.from('vendor_access').select('tool_slug,user_id,granted_at').limit(500),
    context.supabase.from('admin_audit').select('id,actor_id,action,record_kind,record_title,created_at').in('record_kind', ['creator_application', 'user_capability', 'user']).order('created_at', { ascending: false }).limit(50),
    context.supabase.from('profiles').select('id,display_name').limit(1000),
  ]);
  for (const r of [apps, caps, access, audit, profiles]) if (r.error) throw new Error('Monetization admin data could not be loaded.');
  return { applications: apps.data ?? [], capabilities: caps.data ?? [], vendorAccess: access.data ?? [], audit: audit.data ?? [], profiles: profiles.data ?? [], pricing: PRICING_REFS.map(r => ({ ...r })), paymentsEnabled: false, isolated: isIsolatedBackend(process.env['SUPABASE_URL']) };
});

export const reviewCreatorApplication = createServerFn({ method: 'POST' }).middleware([requireSupabaseAuth]).inputValidator((v: unknown) => creatorReviewInput.parse(v)).handler(async ({ data, context }) => {
  const { error } = await context.supabase.rpc('review_creator_application', { _application_id: data.applicationId, _decision: data.decision, _reason: data.reason });
  if (error) throw new Error(error.message);
  return { ok: true };
});

export const revokeCreator = createServerFn({ method: 'POST' }).middleware([requireSupabaseAuth]).inputValidator((v: unknown) => revokeCreatorInput.parse(v)).handler(async ({ data, context }) => {
  const { error } = await context.supabase.rpc('revoke_creator_capability', { _user_id: data.userId, _reason: data.reason });
  if (error) throw new Error(error.message);
  return { ok: true };
});
