import { createContext, useContext, type ReactNode } from 'react';
import { useQuery, type QueryClient } from '@tanstack/react-query';
import { resolveCatalog } from '@/lib/catalog-repository';
import { getPublicCatalog } from '@/lib/catalog.functions';

export const catalogQuery = { queryKey: ['public-catalog'], queryFn: () => getPublicCatalog(), staleTime: 30000 };
const CatalogContext = createContext(resolveCatalog([]));
export function CatalogProvider({ children }: { children: ReactNode }) {
  const query = useQuery(catalogQuery);
  return <CatalogContext.Provider value={resolveCatalog(query.data ?? [])}>{children}</CatalogContext.Provider>;
}
export const useCatalog = () => useContext(CatalogContext);
/** Loader helper: returns the live catalog, falling back to sample data if the catalog can't be read. */
export async function loadCatalog(qc: QueryClient) {
  try { return resolveCatalog(await qc.ensureQueryData(catalogQuery)); } catch { return resolveCatalog([]); }
}
