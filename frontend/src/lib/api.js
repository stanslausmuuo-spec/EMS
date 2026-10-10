const API_BASE = import.meta.env.VITE_API_URL || '';

export const TOKEN_KEY = 'ems_token';
export const USER_KEY = 'ems_user';

const STATUS_DEFAULT_MESSAGES = {
  400: 'Your request could not be processed. Check the details and try again.',
  401: 'Your session has expired. Please sign in again.',
  403: "You don't have permission to perform that action.",
  404: 'That couldn’t be found or is no longer available.',
  409: 'That action conflicts with the current state of this resource.',
  422: 'Please review the highlighted fields and try again.',
  429: 'Too many requests. Please wait a moment and try again.',
};

const MAX_MESSAGE_LENGTH = 280;

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

function friendlyMessage(serverMessage, status) {
  if (serverMessage && typeof serverMessage === 'string') {
    return serverMessage.length > MAX_MESSAGE_LENGTH
      ? `${serverMessage.slice(0, MAX_MESSAGE_LENGTH)}…`
      : serverMessage;
  }
  if (status >= 500) {
    return 'Something went wrong on our end. Please try again in a moment.';
  }
  return STATUS_DEFAULT_MESSAGES[status] || (status ? `Request failed (${status})` : 'Request failed');
}

export class ApiError extends Error {
  constructor(message, options = {}) {
    super(message);
    this.name = 'ApiError';
    this.status = options.status;
    this.code = options.code;
    this.errors = options.errors;
    this.raw = options.raw;
    this.isApiError = true;
  }
}

async function parseResponseBody(res) {
  const contentType = res.headers.get('content-type') || '';
  if (!contentType.includes('application/json')) {
    const text = await res.text().catch(() => '');
    return text ? { rawText: text } : null;
  }
  try {
    return await res.json();
  } catch {
    return null;
  }
}

export async function apiJson(endpoint, options = {}) {
  const res = await apiFetch(endpoint, options);
  const data = await parseResponseBody(res);

  if (!res.ok) {
    const serverMessage = data && typeof data === 'object' ? data.message : undefined;
    const code = data && typeof data === 'object' ? data.code : undefined;
    const errors = data && Array.isArray(data.errors) ? data.errors : undefined;
    const detail = errors && errors.length ? errors[0].message : undefined;
    const message = friendlyMessage(detail || serverMessage, res.status);
    throw new ApiError(message, {
      status: res.status,
      code,
      errors,
      raw: data && typeof data === 'object' ? data : undefined,
    });
  }

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
  patch: (endpoint, body, options) =>
    apiJson(endpoint, {
      ...options,
      method: 'PATCH',
      body: body instanceof FormData ? body : JSON.stringify(body ?? {}),
    }),
  del: (endpoint, options) => apiJson(endpoint, { ...options, method: 'DELETE' }),
};