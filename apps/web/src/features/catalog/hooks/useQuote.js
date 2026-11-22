import { useMutation } from '@tanstack/react-query';
import { getQuote } from '../../../api/pricing';

export function useQuote() {
  return useMutation({
    mutationFn: ({ modelId, configuration }) =>
      getQuote(modelId, configuration),
  });
}