import { describe, expect, it } from 'vitest';
import { skills } from '@/lib/catalog';
import { skillFields } from '@/lib/admin-model';
import { resolveCatalog } from '@/lib/catalog-repository';

describe('Admin AI Skills compatibility', () => {
  it('accepts every existing public skill without losing any fields', () => {
    for (const skill of skills) expect(skillFields.parse(skill)).toEqual(skill);
  });

  it('publishes all edited skill parameters to the public catalog', () => {
    const skill = skillFields.parse({ slug: 'prompt-writing', name: 'Prompt practice', description: 'Write clear instructions.', level: 'Advanced', category: 'Writing & Content', outcomes: ['Evaluate prompts'], tools: ['claude'] });
    const catalog = resolveCatalog([{ kind: 'skill', slug: skill.slug, title: skill.name, enabled: true, payload: skill }]);
    expect(catalog.skills.find(s => s.slug === skill.slug)).toEqual(skill);
  });
});