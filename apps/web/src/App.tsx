import { FormEvent, useCallback, useEffect, useMemo, useState } from 'react';
import { api, Lead, LeadStatus, setToken, Stats, Task, User } from './api';

const statuses: LeadStatus[] = ['new', 'contacted', 'qualified', 'proposal', 'won', 'lost'];
const money = (value: number | string | null) => new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(Number(value || 0));
const displayName = (lead: Lead) => [lead.first_name, lead.last_name].filter(Boolean).join(' ');
const initials = (name: string) => name.split(' ').map((part) => part[0]).join('').slice(0, 2).toUpperCase();

function App() {
  const [user, setUser] = useState<User | null>(null);
  const [authReady, setAuthReady] = useState(false);
  const [authMode, setAuthMode] = useState<'login' | 'register'>('login');
  const [leads, setLeads] = useState<Lead[]>([]);
  const [stats, setStats] = useState<Stats | null>(null);\n  const [tasks, setTasks] = useState<Task[]>([]);\n  const [taskTitle, setTaskTitle] = useState('');\n  const [taskDue, setTaskDue] = useState('');
  const [query, setQuery] = useState('');
  const [filter, setFilter] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ first_name: '', last_name: '', company: '', email: '', value: '0', source: 'Website' });
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const canManage = user?.role === 'admin' || user?.role === 'sales';

  const refresh = useCallback(async () => {
    const [leadResult, statResult] = await Promise.all([api.leads(query, filter), api.stats()]);
    setLeads(leadResult.data);
    setStats(statResult);
  }, [query, filter]);

  useEffect(() => {
    let active = true;
    api.me().then((result) => { if (active) setUser(result.user); })
      .catch(() => { setToken(null); })
      .finally(() => { if (active) setAuthReady(true); });
    return () => { active = false; };
  }, []);

  useEffect(() => {
    if (!user) return;
    refresh().catch((reason: Error) => setError(reason.message));
  }, [user, refresh]);

  async function authenticate(event: FormEvent<HTMLFormElement>) {
    event.preventDefault(); setBusy(true); setError('');
    const data = new FormData(event.currentTarget);
    try {
      const result = authMode === 'login'
        ? await api.login(String(data.get('email')), String(data.get('password')))
        : await api.register(String(data.get('name')), String(data.get('email')), String(data.get('password')), String(data.get('password_confirmation')));
      setToken(result.token); setUser(result.user);
    } catch (reason) { setError((reason as Error).message); }
    finally { setBusy(false); }
  }

  async function signOut() {
    try { await api.logout(); } catch { /* Expired tokens are cleared locally too. */ }
    setToken(null); setUser(null); setLeads([]); setStats(null); setTasks([]);
  }

  async function addLead(event: FormEvent<HTMLFormElement>) {
    event.preventDefault(); setBusy(true); setError('');
    try {
      await api.createLead({ ...form, value: Number(form.value) || 0, status: 'new' });
      setShowForm(false); setForm({ first_name: '', last_name: '', company: '', email: '', value: '0', source: 'Website' });
      await refresh();
    } catch (reason) { setError((reason as Error).message); }
    finally { setBusy(false); }
  }

  async function addTask(event: FormEvent<HTMLFormElement>) {\n    event.preventDefault(); setBusy(true); setError('');\n    try { await api.createTask({ title: taskTitle, due_at: taskDue ? new Date(taskDue).toISOString() : null }); setTaskTitle(''); setTaskDue(''); await refresh(); }\n    catch (reason) { setError((reason as Error).message); } finally { setBusy(false); }\n  }\n\n  async function toggleTask(task: Task) { try { await api.updateTask(task.id, { completed: !task.completed_at }); await refresh(); } catch (reason) { setError((reason as Error).message); } }\n\n  async function changeStatus(lead: Lead, status: LeadStatus) {
    setError('');
    try { await api.updateLead(lead.id, { status }); await refresh(); }
    catch (reason) { setError((reason as Error).message); }
  }

  async function removeLead(lead: Lead) {
    if (!window.confirm(`Delete ${displayName(lead)}? This cannot be undone.`)) return;
    try { await api.deleteLead(lead.id); await refresh(); }
    catch (reason) { setError((reason as Error).message); }
  }

  const stageRows = useMemo(() => statuses.map((status) => ({ status, count: stats?.stages?.[status] || 0 })), [stats]);
  if (!authReady) return <div className="auth-screen"><div className="auth-card">Loading your workspace…</div></div>;
  if (!user) return <div className="auth-screen"><div className="auth-card">
    <a className="brand auth-brand" href="#"><span className="brand-mark"><i className="bi bi-layers-fill" /></span> leadflow<span className="brand-dot">.</span></a>
    <div className="eyebrow">YOUR SALES WORKSPACE</div><h1>{authMode === 'login' ? 'Welcome back' : 'Create your workspace account'}</h1>
    <p>{authMode === 'login' ? 'Sign in to manage your sales pipeline.' : 'Start organizing leads and opportunities.'}</p>
    {error && <div className="alert alert-danger py-2 small">{error}</div>}
    <form onSubmit={authenticate}>
      {authMode === 'register' && <label>Your name<input name="name" required minLength={2} placeholder="Your name" /></label>}
      <label>Email address<input name="email" type="email" required placeholder="you@company.com" /></label>
      <label>Password<input name="password" type="password" required minLength={authMode === 'register' ? 10 : 1} placeholder={authMode === 'register' ? 'At least 10 characters' : 'Your password'} /></label>
      {authMode === 'register' && <label>Confirm password<input name="password_confirmation" type="password" required minLength={10} placeholder="Repeat your password" /></label>}
      <button className="btn btn-primary-custom w-100 mt-2" disabled={busy}>{busy ? 'Please wait…' : authMode === 'login' ? 'Sign in' : 'Create account'}</button>
    </form>
    <div className="auth-switch">{authMode === 'login' ? 'New to LeadFlow?' : 'Already have an account?'} <button onClick={() => { setAuthMode(authMode === 'login' ? 'register' : 'login'); setError(''); }}>{authMode === 'login' ? 'Create an account' : 'Sign in'}</button></div>
  </div></div>;

  return <div className="app-shell">
    <aside className="sidebar">
      <a className="brand" href="#"><span className="brand-mark"><i className="bi bi-layers-fill" /></span> leadflow<span className="brand-dot">.</span></a>
      <div className="workspace-label">WORKSPACE</div>
      <nav className="nav flex-column">
        <a className="nav-link active" href="#"><i className="bi bi-grid-1x2" /> Overview</a>
        <a className="nav-link" href="#leads"><i className="bi bi-people" /> Leads <span className="nav-count">{stats?.total_leads ?? leads.length}</span></a>
        <a className="nav-link" href="#pipeline"><i className="bi bi-kanban" /> Pipeline</a>
        <a className="nav-link" href="#tasks"><i className="bi bi-check2-square" /> Tasks <span className="nav-count">{tasks.filter((task) => !task.completed_at).length}</span></a>
        <span className="nav-link disabled"><i className="bi bi-bar-chart" /> Reports <small className="ms-auto">Soon</small></span>
      </nav>
      <div className="sidebar-bottom"><div className="help-card"><i className="bi bi-life-preserver" /><strong>Need a hand?</strong><span>Explore the project documentation and setup guide.</span><a href="https://github.com/asadmmn/LeadFlow-CRM">Open documentation <i className="bi bi-arrow-up-right" /></a></div><div className="profile"><div className="avatar avatar-user">{initials(user.name)}</div><div><strong>{user.name}</strong><small>{user.role} account</small></div><button className="icon-button ms-auto" onClick={signOut} title="Sign out" aria-label="Sign out"><i className="bi bi-box-arrow-right" /></button></div></div>
    </aside>
    <main className="main-content">
      <header className="topbar"><div className="breadcrumb-text">Workspace <i className="bi bi-chevron-right" /> <strong>Overview</strong></div><div className="top-actions"><span className="role-chip">{user.role}</span><div className="avatar avatar-user">{initials(user.name)}</div></div></header>
      <section className="page-heading"><div><div className="eyebrow">YOUR SALES WORKSPACE</div><h1>Good to see you, {user.name.split(' ')[0]} <span>✦</span></h1><p>Here's what's happening with your sales pipeline today.</p></div>{canManage && <button className="btn btn-primary-custom" onClick={() => setShowForm(true)}><i className="bi bi-plus-lg" /> Add lead</button>}</section>
      {error && <div className="alert alert-danger py-2 small" role="alert">{error}<button className="btn-close float-end" onClick={() => setError('')} aria-label="Dismiss" /></div>}
      <section className="metric-grid">
        <Metric label="Total pipeline value" value={money(stats?.pipeline_value || 0)} icon="bi-currency-dollar" tone="violet" />
        <Metric label="Won opportunities" value={money(stats?.won_value || 0)} icon="bi-trophy" tone="green" />
        <Metric label="Open opportunities" value={String(stats?.open_leads || 0)} icon="bi-lightning-charge" tone="blue" />
        <Metric label="Conversion rate" value={`${stats?.conversion_rate || 0}%`} icon="bi-graph-up-arrow" tone="amber" />
      </section>
      <section className="content-card pipeline-card" id="pipeline"><div className="card-heading"><div><h2>Pipeline overview</h2><p>Live opportunity distribution by stage</p></div><span className="live-label"><span /> LIVE DATA</span></div><div className="pipeline-bars">{stageRows.map(({ status, count }, index) => { const width = Math.max(count ? 4 : 0, count / Math.max(1, stats?.total_leads || 0) * 100); return <div className="pipeline-row" key={status}><div className="pipeline-label">{status[0].toUpperCase() + status.slice(1)}<span>{count}</span></div><div className="progress-track"><div className={`progress-fill stage-${index}`} style={{ width: `${width}%` }} /></div><small>{Math.round(count / Math.max(1, stats?.total_leads || 0) * 100)}%</small></div>; })}</div></section>
      <section className="content-card leads-card" id="leads"><div className="card-heading leads-heading"><div><h2>Leads</h2><p>Manage and follow up on your opportunities.</p></div><span className="live-label"><span /> CONNECTED TO API</span></div><div className="table-tools"><div className="search-box"><i className="bi bi-search" /><input aria-label="Search leads" placeholder="Search leads..." value={query} onChange={(event) => setQuery(event.target.value)} /></div><select aria-label="Filter by status" value={filter} onChange={(event) => setFilter(event.target.value)}><option value="">All statuses</option>{statuses.map((status) => <option key={status} value={status}>{status[0].toUpperCase() + status.slice(1)}</option>)}</select></div><div className="table-responsive"><table className="table lead-table align-middle"><thead><tr><th>LEAD</th><th>STATUS</th><th>SOURCE</th><th>VALUE</th><th>ACTIONS</th></tr></thead><tbody>{leads.map((lead) => <tr key={lead.id}><td><div className="lead-person"><div className="avatar">{initials(displayName(lead))}</div><div><strong>{displayName(lead)}</strong><small>{lead.company || 'Independent'} · {lead.email || 'No email added'}</small></div></div></td><td>{canManage ? <select className={`status-select status-${lead.status}`} aria-label={`Change status for ${displayName(lead)}`} value={lead.status} onChange={(event) => changeStatus(lead, event.target.value as LeadStatus)}>{statuses.map((status) => <option key={status} value={status}>{status[0].toUpperCase() + status.slice(1)}</option>)}</select> : <span className={`status-pill status-${lead.status}`}>{lead.status}</span>}</td><td className="source-cell">{lead.source || '—'}</td><td className="value-cell">{money(lead.value)}</td><td>{canManage && <button className="row-more" onClick={() => removeLead(lead)} aria-label={`Delete ${displayName(lead)}`} title="Delete lead"><i className="bi bi-trash3" /></button>}</td></tr>)}</tbody></table>{leads.length === 0 && <div className="empty-state">No leads found. {canManage ? 'Add your first lead to get started.' : 'Ask a workspace manager to add leads.'}</div>}</div></section>
      <section className="content-card" id="tasks"><div className="card-heading"><div><h2>Follow-up tasks</h2><p>Keep your next steps organized.</p></div></div><form className="table-tools mt-3" onSubmit={addTask}><input className="form-control form-control-sm" placeholder="Add a follow-up task..." value={taskTitle} onChange={(e) => setTaskTitle(e.target.value)} required maxLength={180} /><input className="form-control form-control-sm" type="datetime-local" value={taskDue} onChange={(e) => setTaskDue(e.target.value)} /><button className="btn btn-primary-custom btn-sm" disabled={busy}>Add</button></form><div className="task-list">{tasks.map((task) => <div className="task-row" key={task.id}><label><input type="checkbox" checked={Boolean(task.completed_at)} onChange={() => toggleTask(task)} /><span className={task.completed_at ? 'task-done' : ''}>{task.title}</span></label><small>{task.due_at ? new Date(task.due_at).toLocaleString() : 'No due date'}{task.lead ? ' · '+task.lead.first_name+' '+(task.lead.last_name || '') : ''}</small><button className="row-more" aria-label="Delete task" onClick={async () => { try { await api.deleteTask(task.id); await refresh(); } catch (reason) { setError((reason as Error).message); } }}><i className="bi bi-trash3" /></button></div>)}{tasks.length === 0 && <div className="empty-state">No tasks yet. Add your first follow-up above.</div>}</div></section><footer className="footer-note">LeadFlow CRM <span>·</span> Your sales workspace, connected to live data.</footer>
    </main>
    {showForm && <div className="modal-backdrop-custom" role="presentation" onMouseDown={(event) => { if (event.target === event.currentTarget) setShowForm(false); }}><div className="lead-modal" role="dialog" aria-modal="true" aria-labelledby="modal-title"><div className="modal-title-row"><div><h2 id="modal-title">Add a new lead</h2><p>Save a contact to your CRM workspace.</p></div><button className="icon-button" onClick={() => setShowForm(false)} aria-label="Close"><i className="bi bi-x-lg" /></button></div><form onSubmit={addLead}><label>First name<input required maxLength={100} value={form.first_name} onChange={(e) => setForm({ ...form, first_name: e.target.value })} placeholder="e.g. Alex" /></label><label>Last name<input maxLength={100} value={form.last_name} onChange={(e) => setForm({ ...form, last_name: e.target.value })} placeholder="Morgan" /></label><label>Company<input maxLength={160} value={form.company} onChange={(e) => setForm({ ...form, company: e.target.value })} placeholder="Company name" /></label><label>Email address<input type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} placeholder="alex@company.com" /></label><div className="form-row"><label>Deal value (USD)<input type="number" min="0" step="0.01" value={form.value} onChange={(e) => setForm({ ...form, value: e.target.value })} /></label><label>Source<select value={form.source} onChange={(e) => setForm({ ...form, source: e.target.value })}><option>Website</option><option>Referral</option><option>LinkedIn</option><option>Cold outreach</option><option>Other</option></select></label></div><div className="modal-actions"><button type="button" className="btn btn-light" onClick={() => setShowForm(false)}>Cancel</button><button type="submit" className="btn btn-primary-custom" disabled={busy}>{busy ? 'Saving…' : 'Create lead'}</button></div></form></div></div>}
  </div>;
}

function Metric({ label, value, icon, tone }: { label: string; value: string; icon: string; tone: string }) {
  return <article className="metric-card"><div className="metric-top"><span>{label}</span><span className={`metric-icon ${tone}`}><i className={`bi ${icon}`} /></span></div><div className="metric-value">{value}</div><div className="metric-foot"><span className="metric-change"><i className="bi bi-arrow-repeat" /> Live</span><span>from your workspace</span></div></article>;
}
export default App;
