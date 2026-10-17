import { createServerFn } from '@tanstack/react-start';
import { requireSupabaseAuth } from '@/integrations/supabase/auth-middleware';
import { recordInput } from '@/lib/admin-model';
import type { Json } from '@/integrations/supabase/types';
import { z } from 'zod';

export const adminSnapshot = createServerFn({method:'POST'}).middleware([requireSupabaseAuth]).handler(async({context})=>{
  const {data:allowed,error:roleError}=await context.supabase.rpc('has_role',{_user_id:context.userId,_role:'admin'});
  if(roleError||!allowed)throw new Error('Admin access is required.');
  const [records,audit,profiles,roles]=await Promise.all([
    context.supabase.from('directory_records').select('*').order('updated_at',{ascending:false}).limit(1000),
    context.supabase.from('admin_audit').select('*').order('created_at',{ascending:false}).limit(100),
    context.supabase.from('profiles').select('*').limit(1000),
    context.supabase.from('user_roles').select('*').limit(1000),
  ]);
  for(const result of [records,audit,profiles,roles])if(result.error)throw new Error(result.error.message);
  return {records:records.data??[],audit:audit.data??[],profiles:profiles.data??[],roles:roles.data??[],userId:context.userId};
});

export const saveAdminRecord=createServerFn({method:'POST'}).middleware([requireSupabaseAuth]).inputValidator((v:unknown)=>recordInput.parse(v)).handler(async({data,context})=>{
  const {data:allowed}=await context.supabase.rpc('has_role',{_user_id:context.userId,_role:'admin'});
  if(!allowed)throw new Error('Admin access is required.');
  const {data:record,error}=await context.supabase.from('directory_records').upsert({...data,payload:data.payload as Json},{onConflict:'kind,slug'}).select().single();
  if(error)throw new Error(error.message);
  return record;
});

export const saveMemberRole=createServerFn({method:'POST'}).middleware([requireSupabaseAuth]).inputValidator((v:unknown)=>z.object({userId:z.string().uuid(),role:z.enum(['admin','moderator','user'])}).parse(v)).handler(async({data,context})=>{
  const {data:allowed}=await context.supabase.rpc('has_role',{_user_id:context.userId,_role:'admin'});
  if(!allowed)throw new Error('Admin access is required.');
  const {error}=await context.supabase.rpc('set_member_role',{target_user:data.userId,desired_role:data.role});
  if(error)throw new Error(error.message);
  return {success:true};
});

export const submitDirectoryRequest=createServerFn({method:'POST'}).middleware([requireSupabaseAuth]).inputValidator((v:unknown)=>z.object({kind:z.enum(['claim','submission','review','report']),title:z.string().min(1).max(200),payload:z.record(z.unknown())}).parse(v)).handler(async({data,context})=>{
  if(data.kind==='review'&&!(Number(data.payload.rating)>=1&&Number(data.payload.rating)<=5))throw new Error('Choose a rating from 1 to 5.');
  if(data.kind==='claim'&&(!data.payload.toolSlug||!data.payload.evidence))throw new Error('Choose a tool and add proof of ownership.');
  const {data:record,error}=await context.supabase.from('directory_records').insert({kind:data.kind,slug:crypto.randomUUID(),title:data.title,status:'pending',payload:data.payload as Json,owner_id:context.userId}).select('id,status').single();
  if(error)throw new Error(error.message);
  return record;
});