import { createServerFn } from '@tanstack/react-start';
import { createClient } from '@supabase/supabase-js';
import type { Database } from '@/integrations/supabase/types';

export const getPublicCatalog=createServerFn({method:'GET'}).handler(async()=>{
  const url=process.env['SUPABASE_URL'];const key=process.env['SUPABASE_PUBLISHABLE_KEY'];
  if(!url||!key)throw new Error('Catalog is unavailable.');
  const client=createClient<Database>(url,key,{auth:{persistSession:false,autoRefreshToken:false},global:{fetch:(input,init)=>{
    const h=new Headers(init?.headers);if(key.startsWith('sb_')&&h.get('Authorization')===`Bearer ${key}`)h.delete('Authorization');h.set('apikey',key);return fetch(input,{...init,headers:h});
  }}});
  const {data,error}=await client.from('catalog_public').select('kind,slug,title,enabled,payload').limit(1000);
  if(error)throw new Error(error.message);return data??[];
});