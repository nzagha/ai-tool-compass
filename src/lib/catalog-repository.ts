import { tools,skills,categories,useCases,verticals,reviews } from '@/lib/catalog';
import type { Tool,AISkill,Category,UseCase,Vertical,Review } from '@/lib/catalog';
import type { Json } from '@/integrations/supabase/types';
export type PublicCatalogRow={kind:string;slug:string;title:string;enabled:boolean;payload:Json};
function merge<T extends {slug:string}>(base:T[],kind:string,rows:PublicCatalogRow[]):T[]{
  const map=new Map(base.map(v=>[v.slug,v]));
  for(const row of rows.filter(r=>r.kind===kind)){
    if(!row.enabled){map.delete(row.slug);continue;}
    if(row.payload&&typeof row.payload==='object'&&!Array.isArray(row.payload))map.set(row.slug,{...map.get(row.slug),...row.payload,slug:row.slug} as T);
  }return [...map.values()];
}
export function resolveCatalog(rows:PublicCatalogRow[]){
  const nextReviews=merge(reviews.map(r=>({...r,slug:r.id})),'review',rows);
  const claimStates = new Map(rows.filter(r => r.kind === 'claim-state' && r.enabled).map(r => [r.slug, r.payload]));
  const nextTools = merge<Tool>(tools,'tool',rows).map(tool => {
    const state = claimStates.get(tool.slug);
    const claim = state && typeof state === 'object' && !Array.isArray(state) ? state['claim'] : undefined;
    return claim === 'Claimed' || claim === 'Claim Pending' || claim === 'Unclaimed' ? { ...tool, claim } : tool;
  });
  return {tools:nextTools as Tool[],skills:merge<AISkill>(skills,'skill',rows),categories:merge<Category>(categories,'category',rows),useCases:merge<UseCase>(useCases,'use-case',rows),verticals:merge<Vertical>(verticals,'vertical',rows),reviews:nextReviews as Review[],placements:rows.filter(r=>r.kind==='placement'&&r.enabled)};
}