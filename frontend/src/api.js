export const API = import.meta.env.VITE_API_URL || 
  (typeof window !== 'undefined' && window.location.hostname !== 'localhost' && window.location.hostname !== '127.0.0.1'
    ? 'https://open-layer.onrender.com/api'
    : 'http://127.0.0.1:8000/api');

export function getToken() {
  return localStorage.getItem('ol_token') || '';
}

export function getUser() {
  try {
    return JSON.parse(localStorage.getItem('ol_user') || 'null');
  } catch {
    return null;
  }
}

export async function api(path, options = {}) {
  const headers = { 'Content-Type': 'application/json', ...(options.headers || {}) };
  const token = getToken();
  if (token) headers.Authorization = `Bearer ${token}`;
  
  const res = await fetch(`${API}${path}`, { ...options, headers });
  if (!res.ok) {
    let msg = `Request failed (${res.status})`;
    try {
      const d = await res.json();
      msg = d.detail || msg;
    } catch {}
    throw new Error(msg);
  }
  if (res.status === 204) return null;
  return res.json();
}

export async function login(email, password) {
  const res = await fetch(`${API}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: email.trim(), password })
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.detail || 'Login failed');
  localStorage.setItem('ol_token', data.access_token);
  localStorage.setItem('ol_user', JSON.stringify(data.user));
  return data.user;
}

export function getExportUrl(reportType, format = 'csv') {
  return `${API}/reports/${reportType}/export?format=${format}`;
}
