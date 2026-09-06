/**
 * API client configuration and setup.
 * Integrates with FastAPI backend via VITE_API_BASE_URL.
 * Supports JWT authentication and all HTTP methods.
 */

/**
 * Resolve the backend base URL.
 *
 * `VITE_API_BASE_URL` wins when set. Otherwise we default to the FastAPI dev
 * port on whatever host actually served this page — so opening the app from
 * another device on the LAN (http://192.168.x.x:3000) still talks to that same
 * machine's backend instead of a dead `localhost:8000` on the phone.
 */
function resolveApiBaseUrl(): string {
  const configured = import.meta.env.VITE_API_BASE_URL as string | undefined;
  if (typeof window === 'undefined') return configured || '/api';

  const host = window.location.hostname;
  const isLocal = host === 'localhost' || host === '127.0.0.1' || host === '';

  // A localhost-only override is unhelpful when the page itself is on the LAN.
  if (configured && !(/\/\/(localhost|127\.0\.0\.1)/.test(configured) && !isLocal)) {
    return configured;
  }

  const proto = window.location.protocol === 'https:' ? 'https:' : 'http:';
  return `${proto}//${host || 'localhost'}:8000/api`;
}

const API_BASE_URL = resolveApiBaseUrl();

export function getApiBaseUrl(): string {
  return API_BASE_URL;
}

export class ApiError extends Error {
  constructor(public status: number, message: string, public data?: unknown) {
    super(message);
    this.name = 'ApiError';
  }
}

let _token: string | null = null;

export function setAuthToken(token: string | null) {
  _token = token;
  if (token) {
    localStorage.setItem('medstock_token', token);
  } else {
    localStorage.removeItem('medstock_token');
  }
}

export function getAuthToken(): string | null {
  if (_token) return _token;
  return localStorage.getItem('medstock_token');
}

function authHeaders(): Record<string, string> {
  const token = getAuthToken();
  if (token) {
    return { Authorization: `Bearer ${token}` };
  }
  return {};
}

export const apiClient = {
  get: async <T>(endpoint: string): Promise<T> => {
    const url = `${API_BASE_URL}${endpoint.startsWith('/') ? endpoint : `/${endpoint}`}`;
    const res = await fetch(url, {
      headers: {
        'Content-Type': 'application/json',
        ...authHeaders(),
      },
    });
    if (!res.ok) {
      throw new ApiError(res.status, `HTTP error ${res.status}`);
    }
    return (await res.json()) as T;
  },

  post: async <T>(endpoint: string, body?: unknown): Promise<T> => {
    const url = `${API_BASE_URL}${endpoint.startsWith('/') ? endpoint : `/${endpoint}`}`;
    const res = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', ...authHeaders() },
      body: body ? JSON.stringify(body) : undefined,
    });
    if (!res.ok) {
      throw new ApiError(res.status, `HTTP error ${res.status}`);
    }
    return (await res.json()) as T;
  },

  put: async <T>(endpoint: string, body?: unknown): Promise<T> => {
    const url = `${API_BASE_URL}${endpoint.startsWith('/') ? endpoint : `/${endpoint}`}`;
    const res = await fetch(url, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json', ...authHeaders() },
      body: body ? JSON.stringify(body) : undefined,
    });
    if (!res.ok) {
      throw new ApiError(res.status, `HTTP error ${res.status}`);
    }
    return (await res.json()) as T;
  },

  patch: async <T>(endpoint: string, body?: unknown): Promise<T> => {
    const url = `${API_BASE_URL}${endpoint.startsWith('/') ? endpoint : `/${endpoint}`}`;
    const res = await fetch(url, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json', ...authHeaders() },
      body: body ? JSON.stringify(body) : undefined,
    });
    if (!res.ok) {
      throw new ApiError(res.status, `HTTP error ${res.status}`);
    }
    return (await res.json()) as T;
  },

  delete: async <T>(endpoint: string): Promise<T> => {
    const url = `${API_BASE_URL}${endpoint.startsWith('/') ? endpoint : `/${endpoint}`}`;
    const res = await fetch(url, {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json', ...authHeaders() },
    });
    if (!res.ok) {
      throw new ApiError(res.status, `HTTP error ${res.status}`);
    }
    return (await res.json()) as T;
  },

  upload: async <T>(endpoint: string, formData: FormData): Promise<T> => {
    const url = `${API_BASE_URL}${endpoint.startsWith('/') ? endpoint : `/${endpoint}`}`;
    const res = await fetch(url, {
      method: 'POST',
      headers: { ...authHeaders() },
      body: formData,
    });
    if (!res.ok) {
      throw new ApiError(res.status, `HTTP error ${res.status}`);
    }
    return (await res.json()) as T;
  },
};
