const API_BASE = import.meta.env.VITE_API_URL || '';

export const TOKEN_KEY = 'ems_token';
export const USER_KEY = 'ems_user';

export function getToken() {
  return localStorage.getItem(TOKEN_KEY);
}

export function getStoredUser() {
  try {
    const raw = localStorage.getItem(USER_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

function buildHeaders(options = {}) {
  const headers = { ...(options.headers || {}) };
  if (options.body && !(options.body instanceof FormData)) {
    headers['Content-Type'] = headers['Content-Type'] || 'application/json';
  }
  const token = getToken();
  if (token) headers.Authorization = `Bearer ${token}`;
  return headers;
}

export async function apiFetch(endpoint, options = {}) {
  const url = endpoint.startsWith('http') ? endpoint : `${API_BASE}${endpoint}`;
  try {
    return await fetch(url, { ...options, headers: buildHeaders(options) });
  } catch (error) {
    console.error(`API network error [${endpoint}]:`, error.message);
    throw new Error('Unable to reach the EMS server. Check your connection and try again.');
  }
}

export class ApiError extends Error {
  constructor(message, status) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
  }
}

export async function apiJson(endpoint, options = {}) {
  const res = await apiFetch(endpoint, options);
  const contentType = res.headers.get('content-type') || '';
  if (!contentType.includes('application/json')) {
    throw new ApiError(`Unexpected server response (${res.status})`, res.status);
  }
  const data = await res.json();
  return data;
}

export const api = {
  get: (endpoint, options) => apiJson(endpoint, { ...options, method: 'GET' }),
  post: (endpoint, body, options) =>
    apiJson(endpoint, {
      ...options,
      method: 'POST',
      body: body instanceof FormData ? body : JSON.stringify(body ?? {}),
    }),
  put: (endpoint, body, options) =>
    apiJson(endpoint, {
      ...options,
      method: 'PUT',
      body: body instanceof FormData ? body : JSON.stringify(body ?? {}),
    }),
  del: (endpoint, options) => apiJson(endpoint, { ...options, method: 'DELETE' }),
};
