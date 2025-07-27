const API_BASE = process.env.NEXT_PUBLIC_API_BASE || 'http://localhost:4000';

function getToken() {
  if (typeof window === 'undefined') return null;
  return localStorage.getItem('token');
}

function authHeaders() {
  const token = getToken();
  return token ? { Authorization: `Bearer ${token}` } : {};
}

export async function signup(email: string, password: string) {
  const res = await fetch(`${API_BASE}/auth/signup`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password })
  });
  if (!res.ok) throw await res.json();
  return res.json();
}

export async function login(email: string, password: string) {
  const res = await fetch(`${API_BASE}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password })
  });
  if (!res.ok) throw await res.json();
  return res.json();
}

export async function getMe() {
  const res = await fetch(`${API_BASE}/auth/me`, {
    headers: { ...authHeaders() }
  });
  if (!res.ok) throw await res.json();
  return res.json();
}

export async function listSessions() {
  const res = await fetch(`${API_BASE}/sessions`, {
    headers: { ...authHeaders() }
  });
  if (!res.ok) throw await res.json();
  return res.json();
}

export async function createSession(name: string) {
  const res = await fetch(`${API_BASE}/sessions`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', ...authHeaders() },
    body: JSON.stringify({ name })
  });
  if (!res.ok) throw await res.json();
  return res.json();
}

export async function getSession(id: string) {
  const res = await fetch(`${API_BASE}/sessions/${id}`, {
    headers: { ...authHeaders() }
  });
  if (!res.ok) throw await res.json();
  return res.json();
}

export async function updateSession(id: string, data: { chat: any; code: string; uiState: any; name?: string }) {
  const res = await fetch(`${API_BASE}/sessions/${id}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json', ...authHeaders() },
    body: JSON.stringify(data)
  });
  if (!res.ok) throw await res.json();
  return res.json();
} 