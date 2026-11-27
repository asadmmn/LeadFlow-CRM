const API_BASE = import.meta.env.VITE_API_URL || '/api/v1';

export type User = { id: number; name: string; email: string; role: 'admin' | 'sales' | 'viewer' };
export type LeadStatus = 'new' | 'contacted' | 'qualified' | 'proposal' | 'won' | 'lost';
export type Lead = {
  id: number; first_name: string; last_name: string | null; company: string | null;
  email: string | null; phone: string | null; source: string | null; status: LeadStatus;
  value: string | number | null; notes?: string | null; follow_up_at?: string | null;
};
export type Task = { id:number; lead_id:number; title:string; description:string|null; priority:'low'|'medium'|'high'; status:'open'|'done'; due_at:string|null; completed_at:string|null; lead?:Pick<Lead,'id'|'first_name'|'last_name'|'company'> };
export type LeadActivity = { id:number; lead_id:number; type:'note'|'call'|'email'|'meeting'|'status'; title:string; body:string|null; occurred_at:string };
export type Stats = {
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
  deleteLead: (id: number) => request<void>(`/leads/${id}`, { method: 'DELETE' }),
  tasks: (status = '') => request<{ data: Task[] }>(`/tasks?per_page=100${status ? `&status=${encodeURIComponent(status)}` : ''}`),
  createTask: (data: { lead_id:number; title:string; description?:string; priority:'low'|'medium'|'high'; due_at?:string }) => request<{ data:Task }>('/tasks', { method:'POST', body:JSON.stringify(data) }),
  updateTask: (id:number, data:Partial<Pick<Task,'title'|'description'|'priority'|'status'|'due_at'>>) => request<{ data:Task }>(`/tasks/${id}`, { method:'PATCH', body:JSON.stringify(data) }),
  deleteTask: (id:number) => request<void>(`/tasks/${id}`, { method:'DELETE' }),
  activities: (leadId:number) => request<{ data:LeadActivity[] }>(`/leads/${leadId}/activities`),
  createActivity: (leadId:number, data:{ type:LeadActivity['type']; title:string; body?:string }) => request<{ data:LeadActivity }>(`/leads/${leadId}/activities`, { method:'POST', body:JSON.stringify(data) }),
};
