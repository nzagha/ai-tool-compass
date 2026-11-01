import { z } from 'zod';
import { money, type Money } from './money';

/* ---------- Pricing version references (authority flags only, not a pricing engine) ---------- */
export type PricingAuthority = 'owner_approved' | 'proposed' | 'historical';
export type PricingRef = {
  id: string; label: string; version: string; authority: PricingAuthority;
  price: Money; interval: 'month' | 'year' | 'once' | 'days'; days?: number; note: string;
};
export const PRICING_REFS: readonly PricingRef[] = [
  { id: 'featured-placement', label: 'Featured Tool placement', version: 'owner-approved', authority: 'owner_approved', price: money(9900), interval: 'days', days: 5, note: 'Admin approves the request first. Shown as Sponsored, never changes organic rank.' },
  { id: 'creator-pro-month', label: 'Creator Pro', version: 'pricing-v1.0.0', authority: 'proposed', price: money(1900), interval: 'month', note: 'Proposal. Does not grant Creator approval.' },
  { id: 'creator-pro-year', label: 'Creator Pro (annual)', version: 'pricing-v1.0.0', authority: 'proposed', price: money(19000), interval: 'year', note: 'Proposal.' },
  { id: 'vendor-pro-month', label: 'Vendor Pro', version: 'pricing-v1.0.0', authority: 'proposed', price: money(3900), interval: 'month', note: 'Proposal. Does not grant Tool ownership.' },
  { id: 'vendor-pro-year', label: 'Vendor Pro (annual)', version: 'pricing-v1.0.0', authority: 'proposed', price: money(39000), interval: 'year', note: 'Proposal.' },
  { id: 'tool-submission', label: 'Tool submission review', version: 'pricing-v1.0.0', authority: 'proposed', price: money(4900), interval: 'once', note: 'Buys a review, not publication.' },
  { id: 'vendor-edit', label: 'Listing edit review', version: 'pricing-v1.0.0', authority: 'proposed', price: money(1900), interval: 'once', note: 'Buys a review, not approval.' },
  { id: 'verification-review', label: 'Verification review', version: 'pricing-v1.0.0', authority: 'proposed', price: money(4900), interval: 'once', note: 'Never guarantees aiBean Verified.' },
  { id: 'claim-review', label: 'Ownership claim review', version: 'pricing-v1.0.0', authority: 'proposed', price: money(4900), interval: 'once', note: 'Ownership only after admin approval.' },
];
export const AUTHORITY_LABEL: Record<PricingAuthority, string> = { owner_approved: 'Approved offer', proposed: 'Proposed', historical: 'Historical' };
export const publicPricingRefs = () => PRICING_REFS.filter(r => r.authority === 'owner_approved');
export const PAYMENTS_ENABLED = false as const; // Phase 1: no provider, checkout, webhook or settlement exists.

/* ---------- Commercial request statuses ---------- */
export const COMMERCIAL_STATUSES = ['draft', 'pending', 'approved', 'rejected', 'payment_unavailable', 'active', 'paused', 'expired', 'cancelled'] as const;
export type CommercialStatus = (typeof COMMERCIAL_STATUSES)[number];
export const commercialStatus = z.enum(COMMERCIAL_STATUSES);
export const STATUS_TONE: Record<CommercialStatus, 'neutral' | 'info' | 'success' | 'warning' | 'danger'> = {
  draft: 'neutral', pending: 'info', approved: 'success', rejected: 'danger', payment_unavailable: 'warning', active: 'success', paused: 'warning', expired: 'neutral', cancelled: 'neutral',
};
const TRANSITIONS: Record<CommercialStatus, readonly CommercialStatus[]> = {
  draft: ['pending', 'cancelled'], pending: ['approved', 'rejected', 'cancelled'], approved: ['payment_unavailable', 'cancelled'],
  payment_unavailable: ['cancelled'], rejected: [], active: ['paused', 'expired', 'cancelled'], paused: ['active', 'cancelled'], expired: [], cancelled: [],
};
export function canTransition(from: CommercialStatus, to: CommercialStatus): boolean {
  // "active" is only reachable from verified settlement, which does not exist in Phase 1.
  return TRANSITIONS[from].includes(to);
}

/* ---------- Audit events ---------- */
export const AUDIT_ACTIONS = ['creator application', 'creator approved', 'creator rejected', 'creator revoked', 'role change', 'insert', 'update', 'delete'] as const;
export type AuditEvent = { id: string; actor_id: string | null; action: string; record_kind: string; record_title: string; created_at: string };

/* ---------- Identity, capabilities and ownership ---------- */
export type AccessFacts = { userId: string | null; isAdmin: boolean; isApprovedCreator: boolean; ownedToolSlugs: readonly string[] };
export type Area = 'pricing' | 'membership' | 'vendor' | 'creator' | 'admin';
export function canEnter(area: Area, a: AccessFacts): boolean {
  if (area === 'pricing') return true;
  if (!a.userId) return false;
  if (area === 'membership') return true;
  if (area === 'vendor') return a.ownedToolSlugs.length > 0 || a.isAdmin;
  if (area === 'creator') return a.isApprovedCreator || a.isAdmin;
  return a.isAdmin;
}
export function canManageTool(slug: string, a: AccessFacts): boolean {
  return !!a.userId && a.ownedToolSlugs.includes(slug);
}
export function canSeeFullPricingMatrix(a: AccessFacts): boolean { return !!a.userId; }
export function canApplyForCreator(a: AccessFacts & { hasPendingApplication: boolean }): boolean {
  return !!a.userId && !a.isApprovedCreator && !a.hasPendingApplication;
}

/** Payment facts may change billing state only. They can never grant identity, capability, ownership or editorial outcomes. */
export type PaymentFact = { kind: 'featured' | 'creator_pro' | 'vendor_pro' | 'claim_review' | 'verification_review' | 'submission_review'; settled: boolean; toolSlug?: string };
export function applyPaymentToAccess(a: AccessFacts, _payment: PaymentFact): AccessFacts {
  return { ...a, ownedToolSlugs: [...a.ownedToolSlugs] };
}
export type EditorialState = { rank: number; verification: string; claim: string; reviewsVisible: boolean };
export function applyPaymentToEditorial(e: EditorialState, _payment: PaymentFact): EditorialState { return { ...e }; }

/* ---------- Server input validation ---------- */
export const creatorApplicationInput = z.object({ pitch: z.string().trim().min(20, 'Tell us a bit more (at least 20 characters).').max(1000) });
export const creatorReviewInput = z.object({ applicationId: z.string().uuid(), decision: z.enum(['approved', 'rejected']), reason: z.string().trim().min(3, 'Add a short reason.').max(500) });
export const revokeCreatorInput = z.object({ userId: z.string().uuid(), reason: z.string().trim().min(3).max(500) });
export const toolSlugInput = z.object({ slug: z.string().regex(/^[a-z0-9-]{1,80}$/) });

/* ---------- Safe feedback ---------- */
const SAFE = [/already/i, /required/i, /not found/i, /sign in/i, /reviewed/i, /Choose/i, /permission/i, /own this tool/i];
export function safeMessage(e: unknown, fallback = 'Something went wrong. Please try again.'): string {
  const m = e instanceof Error ? e.message : typeof e === 'string' ? e : '';
  return m && m.length < 160 && SAFE.some(r => r.test(m)) ? m : fallback;
}

/* ---------- Fixture gating ---------- */
export function isIsolatedBackend(url: string | undefined): boolean {
  if (!url) return false;
  try { const h = new URL(url).hostname; return h === '127.0.0.1' || h === 'localhost'; } catch { return false; }
}
