import { useQuery } from '@tanstack/react-query';
import { getCatalog } from '../../../api/catalog';

export function useCatalog(modelId) {
  return useQuery({
    queryKey: ['catalog', modelId],
    queryFn: () => getCatalog(modelId),
    enabled: Boolean(modelId),
  });
}
