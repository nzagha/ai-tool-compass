import { createServerFn } from '@tanstack/react-start';
import { requireSupabaseAuth } from '@/integrations/supabase/auth-middleware';
import { profileInput, contributionInput } from '@/lib/account-model';
import type { Json } from '@/integrations/supabase/types';

export const accountSnapshot = createServerFn({ method: 'POST' }).middleware([requireSupabaseAuth]).handler(async ({ context }) => {
  const [profile, records] = await Promise.all([
    context.supabase.from('profiles').select('id,display_name,avatar_url,created_at').eq('id', context.userId).single(),
    context.supabase.from('directory_records').select('id,kind,title,status,payload,created_at,updated_at').eq('owner_id', context.userId).in('kind', ['submission', 'claim', 'review', 'report']).order('created_at', { ascending: false }),
  ]);
  if (profile.error || records.error) throw new Error('Your account could not be loaded. Please try again.');
  return { profile: profile.data, records: records.data ?? [] };
});

export const saveProfile = createServerFn({ method: 'POST' }).middleware([requireSupabaseAuth]).inputValidator((v: unknown) => profileInput.parse(v)).handler(async ({ data, context }) => {
  const result = await context.supabase.from('profiles').update(data).eq('id', context.userId).select('id,display_name,avatar_url,created_at').single();
  if (result.error) throw new Error('Your profile could not be saved. Please try again.');
  return result.data;
});

export const createContribution = createServerFn({ method: 'POST' }).middleware([requireSupabaseAuth]).inputValidator((v: unknown) => contributionInput.parse(v)).handler(async ({ data, context }) => {
  const result = await context.supabase.from('directory_records').insert({ ...data, payload: data.payload as Json, slug: crypto.randomUUID(), owner_id: context.userId, status: 'pending' }).select('id').single();
  if (result.error) throw new Error('Your request could not be sent. Please try again.');
  return result.data;
});