export const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000/api';
export function getToken() { if (typeof window === 'undefined') return ''; return localStorage.getItem('token') || ''; }
export async function api(path, options = {}) {
  const headers = { ...(options.body instanceof FormData ? {} : { 'Content-Type': 'application/json' }), ...(options.headers || {}) };
  const token = getToken();
  if (token) headers.Authorization = `Bearer ${token}`;
  const res = await fetch(`${API_URL}${path}`, { ...options, headers });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.error || 'Request failed');
  return data;
}
