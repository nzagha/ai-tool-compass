import { describe, expect, it } from 'vitest';
import { formatMoney, money } from '@/lib/monetization/money';
import { applyPaymentToAccess, applyPaymentToEditorial, canApplyForCreator, canEnter, canManageTool, canSeeFullPricingMatrix, canTransition, commercialStatus, creatorReviewInput, isIsolatedBackend, publicPricingRefs, PAYMENTS_ENABLED, type AccessFacts } from '@/lib/monetization/model';

const member: AccessFacts = { userId: 'u1', isAdmin: false, isApprovedCreator: false, ownedToolSlugs: [] };
const vendorA: AccessFacts = { ...member, userId: 'va', ownedToolSlugs: ['draftly-writing-assistant'] };

describe('area permissions', () => {
  it('signed-out visitors only see public pricing', () => {
    const anon = { ...member, userId: null };
    expect(canEnter('pricing', anon)).toBe(true);
    expect(canEnter('membership', anon)).toBe(false);
    expect(canSeeFullPricingMatrix(anon)).toBe(false);
  });
  it('a plain member cannot enter Vendor, Creator or Admin areas', () => {
    expect(canEnter('vendor', member)).toBe(false);
    expect(canEnter('creator', member)).toBe(false);
    expect(canEnter('admin', member)).toBe(false);
  });
  it('an approved Creator enters Creator but not Admin', () => {
    const c = { ...member, isApprovedCreator: true };
    expect(canEnter('creator', c)).toBe(true);
    expect(canEnter('admin', c)).toBe(false);
  });
  it('a Creator with a pending application cannot apply twice', () => {
    expect(canApplyForCreator({ ...member, hasPendingApplication: true })).toBe(false);
    expect(canApplyForCreator({ ...member, hasPendingApplication: false })).toBe(true);
  });
});

describe('owner isolation', () => {
  it('a vendor manages only the tool they own', () => {
    expect(canManageTool('draftly-writing-assistant', vendorA)).toBe(true);
    expect(canManageTool('pixelforge-studio', vendorA)).toBe(false);
  });
  it('admin role alone does not make someone a tool owner', () => {
    expect(canManageTool('pixelforge-studio', { ...member, isAdmin: true })).toBe(false);
  });
});

describe('payments never grant access or editorial outcomes', () => {
  it('a settled Vendor Pro or claim payment does not add tool ownership', () => {
    const after = applyPaymentToAccess(member, { kind: 'claim_review', settled: true, toolSlug: 'pixelforge-studio' });
    expect(after.ownedToolSlugs).toEqual([]);
    expect(applyPaymentToAccess(member, { kind: 'vendor_pro', settled: true }).ownedToolSlugs).toEqual([]);
  });
  it('a settled Creator Pro payment does not grant Creator or Admin', () => {
    const after = applyPaymentToAccess(member, { kind: 'creator_pro', settled: true });
    expect(after.isApprovedCreator).toBe(false);
    expect(after.isAdmin).toBe(false);
  });
  it('Featured or verification payments do not change rank, verification, claim or reviews', () => {
    const e = { rank: 7, verification: 'Unverified', claim: 'Unclaimed', reviewsVisible: true };
    expect(applyPaymentToEditorial(e, { kind: 'featured', settled: true })).toEqual(e);
    expect(applyPaymentToEditorial(e, { kind: 'verification_review', settled: true })).toEqual(e);
  });
  it('payments are switched off in Phase 1', () => { expect(PAYMENTS_ENABLED).toBe(false); });
});

describe('money formatting', () => {
  it('formats the approved Featured price of 9900 cents as $99', () => {
    expect(formatMoney(money(9900), { compact: true })).toBe('$99');
    expect(formatMoney(money(1950))).toBe('$19.50');
  });
  it('rejects floats and negative amounts', () => {
    expect(() => money(99.5)).toThrow();
    expect(() => money(-1)).toThrow();
  });
  it('only the owner-approved Featured offer is public: $99 for 5 days', () => {
    const pub = publicPricingRefs();
    expect(pub).toHaveLength(1);
    expect(pub[0]!.price.amount).toBe(9900);
    expect(pub[0]!.days).toBe(5);
  });
});

describe('status validation', () => {
  it('rejects unknown statuses', () => {
    expect(commercialStatus.safeParse('paid').success).toBe(false);
    expect(commercialStatus.safeParse('pending').success).toBe(true);
  });
  it('nothing can become active without settlement', () => {
    expect(canTransition('approved', 'active')).toBe(false);
    expect(canTransition('pending', 'active')).toBe(false);
    expect(canTransition('pending', 'approved')).toBe(true);
    expect(canTransition('rejected', 'approved')).toBe(false);
  });
  it('admin decisions need a reason', () => {
    expect(creatorReviewInput.safeParse({ applicationId: crypto.randomUUID(), decision: 'approved', reason: '' }).success).toBe(false);
  });
});

describe('fixture gating', () => {
  it('only local backends count as isolated', () => {
    expect(isIsolatedBackend('http://127.0.0.1:8001')).toBe(true);
    expect(isIsolatedBackend('https://abc.supabase.co')).toBe(false);
    expect(isIsolatedBackend(undefined)).toBe(false);
  });
});
