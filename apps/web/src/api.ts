const API_BASE = import.meta.env.VITE_API_URL || '/api/v1';

export type User = { id: number; name: string; email: string; role: 'admin' | 'sales' | 'viewer' };
export type LeadStatus = 'new' | 'contacted' | 'qualified' | 'proposal' | 'won' | 'lost';
export type Lead = {
  id: number; first_name: string; last_name: string | null; company: string | null;
  email: string | null; phone: string | null; source: string | null; status: LeadStatus;
  value: string | number | null; notes?: string | null; follow_up_at?: string | null;
};
export type Task = { id: number; title: string; description: string | null; due_at: string | null; completed_at: string | null; lead_id: number | null; lead?: { id: number; first_name: string; last_name: string | null; company: string | null } | null };\n\nexport type Stats = {
  total_leads: number; pipeline_value: number; won_value: number; open_leads: number;
  won_leads: number; conversion_rate: number; stages: Record<LeadStatus, number>;
};

let token: string | null = localStorage.getItem('leadflow_token');
export function setToken(value: string | null) {
  token = value;
  if (value) localStorage.setItem('leadflow_token', value);
  else localStorage.removeItem('leadflow_token');
}

async function request<T>(path: string, options: RequestInit = {}): Promise<T> {
  const response = await fetch(API_BASE + path, {
    ...options,
    headers: {
      Accept: 'application/json',
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
  });
  if (response.status === 204) return undefined as T;
  const body = await response.json().catch(() => ({}));
  if (!response.ok) {
    const message = body.message || Object.values(body.errors || {}).flat().join(' ') || 'Something went wrong. Please try again.';
    throw new Error(String(message));
  }
  return body as T;
}

export const api = {
  login: (email: string, password: string) => request<{ user: User; token: string }>('/auth/login', { method: 'POST', body: JSON.stringify({ email, password }) }),
  register: (name: string, email: string, password: string, password_confirmation: string) => request<{ user: User; token: string }>('/auth/register', { method: 'POST', body: JSON.stringify({ name, email, password, password_confirmation }) }),
  me: () => request<{ user: User }>('/auth/me'),
  logout: () => request<{ message: string }>('/auth/logout', { method: 'POST' }),
  leads: (search = '', status = '') => request<{ data: Lead[]; total: number }>(`/leads?per_page=100${search ? `&search=${encodeURIComponent(search)}` : ''}${status ? `&status=${encodeURIComponent(status)}` : ''}`),
  stats: () => request<Stats>('/dashboard/stats'),
  createLead: (data: Partial<Lead> & { first_name: string }) => request<{ data: Lead }>('/leads', { method: 'POST', body: JSON.stringify(data) }),
  updateLead: (id: number, data: Partial<Lead>) => request<{ data: Lead }>(`/leads/${id}`, { method: 'PATCH', body: JSON.stringify(data) }),
  deleteLead: (id: number) => request<void>(`/leads/${id}`, { method: 'DELETE' }),\n  tasks: () => request<{ data: Task[] }>('/tasks'),\n  createTask: (data: { title: string; due_at?: string | null; lead_id?: number | null }) => request<{ data: Task }>('/tasks', { method: 'POST', body: JSON.stringify(data) }),\n  updateTask: (id: number, data: { completed?: boolean }) => request<{ data: Task }>(`/tasks/${id}`, { method: 'PATCH', body: JSON.stringify(data) }),\n  deleteTask: (id: number) => request<void>(`/tasks/${id}`, { method: 'DELETE' }),
};
