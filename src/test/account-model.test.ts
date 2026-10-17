import { describe, expect, it } from 'vitest';
import { contributionInput, profileInput } from '@/lib/account-model';

describe('Member contributions', () => {
  it('accepts a review rating from 1 through 5, not outside that range', () => {
    const review = (rating: number) => contributionInput.safeParse({ kind: 'review', title: 'My experience', payload: { toolSlug: 'claude', body: 'Useful for writing.', rating } }).success;
    expect([1, 2, 3, 4, 5].map(review)).toEqual([true, true, true, true, true]);
    expect(review(0)).toBe(false); expect(review(6)).toBe(false);
  });
  it('requires evidence for an ownership claim', () => {
    const claim = (evidence: string) => contributionInput.safeParse({ kind: 'claim', title: 'Claim Claude', payload: { toolSlug: 'claude', evidence } }).success;
    expect(claim('')).toBe(false); expect(claim('https://example.com/ownership')).toBe(true);
  });
  it('keeps privileges out of editable profile data', () => {
    expect(profileInput.parse({ display_name: 'Member', avatar_url: '', role: 'admin', id: 'someone-else' })).toEqual({ display_name: 'Member', avatar_url: '' });
  });
});