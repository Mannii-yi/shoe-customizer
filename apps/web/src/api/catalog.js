import { apiRequest } from './client';

// Fetch all available shoe models
export async function getModels() {
  return apiRequest('/models');
}

// Fetch customization catalog for a specific shoe model
export async function getCatalog(modelId) {
  return apiRequest(`/models/${encodeURIComponent(modelId)}/catalog`);
}