import { describe, expect, it } from 'vitest';
import { resolveCatalog, type PublicCatalogRow } from '@/lib/catalog-repository';

const row = (claim: string): PublicCatalogRow => ({ kind: 'claim-state', slug: 'gamma', title: '', enabled: true, payload: { claim } });
describe('Ownership claim status', () => {
  it('shows Claim Pending for a submitted claim on a sample-only tool', () => {
    expect(resolveCatalog([row('Claim Pending')]).tools.find(t => t.slug === 'gamma')?.claim).toBe('Claim Pending');
  });
  it('shows Claimed after approval even when an admin tool payload is stale', () => {
    expect(resolveCatalog([{ kind: 'tool', slug: 'gamma', title: 'Gamma', enabled: true, payload: { claim: 'Unclaimed' } }, row('Claimed')]).tools.find(t => t.slug === 'gamma')?.claim).toBe('Claimed');
  });
  it('returns to Unclaimed when no active claims remain', () => {
    expect(resolveCatalog([row('Unclaimed')]).tools.find(t => t.slug === 'gamma')?.claim).toBe('Unclaimed');
  });
  it('does not introduce a nonexistent tool or expose claim details', () => {
    expect(resolveCatalog([{ ...row('Claim Pending'), slug: 'missing-tool' }]).tools.some(t => t.slug === 'missing-tool')).toBe(false);
  });
});