import { useSessionStore } from '../store/sessionStore';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:4000/api/v1';

export class ApiError extends Error {
  constructor({ status, code, message, details }) {
    super(message);

    this.name = 'ApiError';
    this.status = status;
    this.code = code;
    this.details = details;
  }
}

export async function apiRequest(path, options = {}) {
  const token = useSessionStore.getState().token;

  const headers = {
    'Content-Type': 'application/json',
    ...options.headers,
  };

  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }

  const response = await fetch(`${API_BASE_URL}${path}`, {
    ...options,
    headers,
  });

  const data = await response.json().catch(() => null);

  if (!response.ok) {
    if (response.status === 401) {
      useSessionStore.getState().clearSession();
    }

    throw new ApiError({
      status: response.status,
      code: data?.error?.code || 'REQUEST_FAILED',
      message: data?.error?.message || 'Something went wrong.',
      details: data?.error?.details || null,
    });
  }

  return data;
}
