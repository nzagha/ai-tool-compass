import { z } from 'zod';

export const profileInput = z.object({
  display_name: z.string().trim().min(1, 'Add your display name.').max(100),
  avatar_url: z.string().max(2000).refine(value => !value || /^https:\/\//i.test(value), 'Use an https image address.'),
});
export const contributionKinds = ['submission', 'claim', 'review', 'report'] as const;
export const contributionInput = z.object({
  kind: z.enum(contributionKinds), title: z.string().trim().min(1).max(200), payload: z.record(z.unknown()),
}).superRefine((value, ctx) => {
  const p = value.payload;
  const required = (key: string, message: string) => {
    if (typeof p[key] !== 'string' || !String(p[key]).trim()) ctx.addIssue({ code: 'custom', message });
  };
  if (value.kind === 'submission') {
    required('name', 'Add a tool name.'); required('category', 'Choose a category.'); required('tagline', 'Add a one-line description.');
    if (!/^https?:\/\//i.test(String(p['website'] ?? ''))) ctx.addIssue({ code: 'custom', message: 'Add an http or https website.' });
  } else required('toolSlug', 'Choose an AI tool.');
  if (value.kind === 'claim') required('evidence', 'Add proof of ownership.');
  if (value.kind === 'review') {
    if (!Number.isInteger(p['rating']) || Number(p['rating']) < 1 || Number(p['rating']) > 5) ctx.addIssue({ code: 'custom', message: 'Choose a rating from 1 to 5.' });
    required('body', 'Write your review.');
  }
  if (value.kind === 'report') required('reason', 'Describe the issue.');
});