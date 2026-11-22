import { useQuery } from '@tanstack/react-query';
import { getModels } from '../../../api/catalog';

export function useModels() {
  return useQuery({
    queryKey: ['models'],
    queryFn: getModels,
  });
}