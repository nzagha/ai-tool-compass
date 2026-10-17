import { createContext,useContext,type ReactNode } from 'react';
import { useQuery } from '@tanstack/react-query';
import { resolveCatalog } from '@/lib/catalog-repository';
import { getPublicCatalog } from '@/lib/catalog.functions';
const CatalogContext=createContext(resolveCatalog([]));
export function CatalogProvider({children}:{children:ReactNode}){
  const query=useQuery({queryKey:['public-catalog'],queryFn:()=>getPublicCatalog(),staleTime:30000});
  return <CatalogContext.Provider value={resolveCatalog(query.data??[])}>{children}</CatalogContext.Provider>;
}
export const useCatalog=()=>useContext(CatalogContext);