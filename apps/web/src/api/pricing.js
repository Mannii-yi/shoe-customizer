import { apiRequest } from './client';

// Request a price quote for the selected shoe configuration
export async function getQuote(modelId, configuration) {
  return apiRequest('/price/quote', {
    method: 'POST',
    body: JSON.stringify({
      modelId,
      configuration,
    }),
  });
}
