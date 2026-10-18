import { describe, expect, it } from 'vitest';
import { getToolPricing, tools } from '@/lib/catalog';
import { toolFields } from '@/lib/admin-model';
import { resolveCatalog } from '@/lib/catalog-repository';

describe('Tool pricing parameters', () => {
  it('keeps explicit pricing and fit settings when published', () => {
    const base = tools[0];
    if (!base) throw new Error('Missing sample tool');
    const edited = toolFields.parse({ ...base, description: 'Research assistant', category: 'Research & Search', startingPrice: '$25/month', freePlan: false, useCases: ['Research a topic'], verticals: ['Education'] });
    const published = resolveCatalog([{ kind: 'tool', slug: edited.slug, title: edited.name, enabled: true, payload: edited }]).tools.find(t => t.slug === edited.slug);
    expect(published).toMatchObject({ description: 'Research assistant', category: 'Research & Search', startingPrice: '$25/month', freePlan: false, useCases: ['Research a topic'], verticals: ['Education'] });
    if (!published) throw new Error('Tool not published');
    expect(getToolPricing(published)).toEqual({ startingPrice: '$25/month', freePlan: false });
  });
  it('supports older records without fabricating unknown prices', () => {
    expect(getToolPricing({ pricing: 'Paid', priceDetail: 'From $10/mo' })).toEqual({ startingPrice: '$10/mo', freePlan: false });
    expect(getToolPricing({ pricing: 'Freemium', priceDetail: 'Free plan · paid plans available' })).toEqual({ startingPrice: 'Not listed', freePlan: true });
  });
});