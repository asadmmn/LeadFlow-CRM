import { FormEvent, useCallback, useEffect, useMemo, useState } from 'react';
import { api, Lead, LeadActivity, LeadStatus, setToken, Stats, Task, User } from './api';

const statuses: LeadStatus[] = ['new', 'contacted', 'qualified', 'proposal', 'won', 'lost'];
const money = (value: number | string | null) => new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(Number(value || 0));
const displayName = (lead: Lead) => [lead.first_name, lead.last_name].filter(Boolean).join(' ');
const initials = (name: string) => name.split(' ').map((part) => part[0]).join('').slice(0, 2).toUpperCase();

function App() {
  const [user, setUser] = useState<User | null>(null);
  const [authReady, setAuthReady] = useState(false);
  const [authMode, setAuthMode] = useState<'login' | 'register'>('login');
  const [leads, setLeads] = useState<Lead[]>([]);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [taskFilter, setTaskFilter] = useState<'all'|'open'|'done'>('all');
  const [taskForm, setTaskForm] = useState({ lead_id:'', title:'', description:'', priority:'medium' as 'low'|'medium'|'high', due_at:'' });
  const [activityLead, setActivityLead] = useState<Lead | null>(null);
  const [activities, setActivities] = useState<LeadActivity[]>([]);
  const [activityForm, setActivityForm] = useState({ type:'note' as LeadActivity['type'], title:'', body:'' });
  const [stats, setStats] = useState<Stats | null>(null);
  const [query, setQuery] = useState('');
  const [filter, setFilter] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ first_name: '', last_name: '', company: '', email: '', value: '0', source: 'Website' });
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const canManage = user?.role === 'admin' || user?.role === 'sales';

  const refreshTasks = useCallback(async () => { const result = await api.tasks(); setTasks(result.data); }, []);

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
    Promise.all([refresh(), refreshTasks()]).catch((reason: Error) => setError(reason.message));
  }, [user, refresh, refreshTasks]);

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

  async function addTask(event: FormEvent<HTMLFormElement>) { event.preventDefault(); setBusy(true); setError(''); try { await api.createTask({ lead_id:Number(taskForm.lead_id), title:taskForm.title, description:taskForm.description || undefined, priority:taskForm.priority, due_at:taskForm.due_at || undefined }); setTaskForm({ lead_id:'', title:'', description:'', priority:'medium', due_at:'' }); await refreshTasks(); } catch (reason) { setError((reason as Error).message); } finally { setBusy(false); } }
  async function toggleTask(task: Task) { try { await api.updateTask(task.id, { status:task.status === 'done' ? 'open' : 'done' }); await refreshTasks(); } catch (reason) { setError((reason as Error).message); } }
  async function deleteTask(task: Task) { if (!window.confirm('Delete task: ' + task.title + '?')) return; try { await api.deleteTask(task.id); await refreshTasks(); } catch (reason) { setError((reason as Error).message); } }
  async function openActivities(lead: Lead) { setActivityLead(lead); setActivities([]); setError(''); try { const result = await api.activities(lead.id); setActivities(result.data); } catch (reason) { setError((reason as Error).message); } }
  async function addActivity(event: FormEvent<HTMLFormElement>) { event.preventDefault(); if (!activityLead) return; setBusy(true); setError(''); try { await api.createActivity(activityLead.id, activityForm); const result = await api.activities(activityLead.id); setActivities(result.data); setActivityForm({ type:'note', title:'', body:'' }); } catch (reason) { setError((reason as Error).message); } finally { setBusy(false); } }

  async function changeStatus(lead: Lead, status: LeadStatus) {
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
        <a className="nav-link" href="#tasks"><i className="bi bi-check2-square" /> Tasks <span className="nav-count">{tasks.filter((task) => task.status === "open").length}</span></a>
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
      <section className="content-card leads-card" id="leads"><div className="card-heading leads-heading"><div><h2>Leads</h2><p>Manage and follow up on your opportunities.</p></div><span className="live-label"><span /> CONNECTED TO API</span></div><div className="table-tools"><div className="search-box"><i className="bi bi-search" /><input aria-label="Search leads" placeholder="Search leads..." value={query} onChange={(event) => setQuery(event.target.value)} /></div><select aria-label="Filter by status" value={filter} onChange={(event) => setFilter(event.target.value)}><option value="">All statuses</option>{statuses.map((status) => <option key={status} value={status}>{status[0].toUpperCase() + status.slice(1)}</option>)}</select></div><div className="table-responsive"><table className="table lead-table align-middle"><thead><tr><th>LEAD</th><th>STATUS</th><th>SOURCE</th><th>VALUE</th><th>ACTIONS</th></tr></thead><tbody>{leads.map((lead) => <tr key={lead.id}><td><div className="lead-person"><div className="avatar">{initials(displayName(lead))}</div><div><strong>{displayName(lead)}</strong><small>{lead.company || 'Independent'} · {lead.email || 'No email added'}</small></div></div></td><td>{canManage ? <select className={`status-select status-${lead.status}`} aria-label={`Change status for ${displayName(lead)}`} value={lead.status} onChange={(event) => changeStatus(lead, event.target.value as LeadStatus)}>{statuses.map((status) => <option key={status} value={status}>{status[0].toUpperCase() + status.slice(1)}</option>)}</select> : <span className={`status-pill status-${lead.status}`}>{lead.status}</span>}</td><td className="source-cell">{lead.source || '—'}</td><td className="value-cell">{money(lead.value)}</td><td><div className="row-actions"><button className="row-more" onClick={() => openActivities(lead)} aria-label="View lead activity" title="Activity"><i className="bi bi-clock-history" /></button>{canManage && <button className="row-more" onClick={() => removeLead(lead)} aria-label="Delete lead" title="Delete lead"><i className="bi bi-trash3" /></button>}</div></td></tr>)}</tbody></table>{leads.length === 0 && <div className="empty-state">No leads found. {canManage ? 'Add your first lead to get started.' : 'Ask a workspace manager to add leads.'}</div>}</div></section>
      <section className="content-card tasks-card" id="tasks">
        <div className="card-heading"><div><h2>Tasks & follow-ups</h2><p>Keep the next action moving for every opportunity.</p></div><span className="live-label"><span /> CONNECTED TO API</span></div>
        <div className="task-tabs">{(["all","open","done"] as const).map((value) => <button key={value} className={taskFilter === value ? "selected" : ""} onClick={() => setTaskFilter(value)}>{value === "all" ? "All tasks" : value === "open" ? "Open" : "Completed"} <span>{value === "all" ? tasks.length : tasks.filter((task) => task.status === value).length}</span></button>)}</div>
        {canManage && <form className="task-create-form" onSubmit={addTask}><input aria-label="Task title" required maxLength={180} placeholder="What needs to be done?" value={taskForm.title} onChange={(e) => setTaskForm({ ...taskForm, title:e.target.value })} /><select aria-label="Related lead" required value={taskForm.lead_id} onChange={(e) => setTaskForm({ ...taskForm, lead_id:e.target.value })}><option value="">Choose a lead</option>{leads.map((lead) => <option key={lead.id} value={lead.id}>{displayName(lead)}{lead.company ? " · " + lead.company : ""}</option>)}</select><select aria-label="Priority" value={taskForm.priority} onChange={(e) => setTaskForm({ ...taskForm, priority:e.target.value as "low"|"medium"|"high" })}><option value="low">Low</option><option value="medium">Medium</option><option value="high">High</option></select><input aria-label="Due date" type="datetime-local" value={taskForm.due_at} onChange={(e) => setTaskForm({ ...taskForm, due_at:e.target.value })} /><button className="btn btn-primary-custom" disabled={busy || !leads.length}>Add task</button></form>}
        <div className="task-list">{tasks.filter((task) => taskFilter === "all" || task.status === taskFilter).map((task) => <article className={"task-item " + (task.status === "done" ? "task-done" : "")} key={task.id}><button className="task-check" onClick={() => toggleTask(task)} aria-label="Toggle task completion"><i className={"bi " + (task.status === "done" ? "bi-check-circle-fill" : "bi-circle")} /></button><div className="task-copy"><strong>{task.title}</strong><small>{task.lead ? [task.lead.first_name, task.lead.last_name].filter(Boolean).join(" ") + (task.lead.company ? " · " + task.lead.company : "") : "Linked lead"}{task.due_at ? " · Due " + new Date(task.due_at).toLocaleString() : ""}</small>{task.description && <p>{task.description}</p>}</div><span className={"priority priority-" + task.priority}>{task.priority}</span>{canManage && <button className="row-more" onClick={() => deleteTask(task)} aria-label="Delete task"><i className="bi bi-trash3" /></button>}</article>)}{tasks.filter((task) => taskFilter === "all" || task.status === taskFilter).length === 0 && <div className="empty-state">No tasks here yet. Add a follow-up above to stay on track.</div>}</div>
      </section>
      <footer className="footer-note">LeadFlow CRM <span>·</span> Your sales workspace, connected to live data.</footer>
    </main>
    {activityLead && <div className="modal-backdrop-custom" role="presentation" onMouseDown={(event) => { if (event.target === event.currentTarget) setActivityLead(null); }}><div className="lead-modal activity-modal" role="dialog" aria-modal="true" aria-labelledby="activity-title">
      <div className="modal-title-row"><div><h2 id="activity-title">Activity timeline</h2><p>{displayName(activityLead)} · {activityLead.company || "Lead"}</p></div><button className="icon-button" onClick={() => setActivityLead(null)} aria-label="Close"><i className="bi bi-x-lg" /></button></div>
      {canManage && <form className="activity-form" onSubmit={addActivity}><div className="form-row"><label>Type<select value={activityForm.type} onChange={(e) => setActivityForm({ ...activityForm, type:e.target.value as LeadActivity["type"] })}><option value="note">Note</option><option value="call">Call</option><option value="email">Email</option><option value="meeting">Meeting</option></select></label><label>Title<input required maxLength={180} value={activityForm.title} onChange={(e) => setActivityForm({ ...activityForm, title:e.target.value })} placeholder="e.g. Discovery call completed" /></label></div><label>Details<textarea rows={3} maxLength={5000} value={activityForm.body} onChange={(e) => setActivityForm({ ...activityForm, body:e.target.value })} placeholder="Add useful context…" /></label><button className="btn btn-primary-custom" disabled={busy}>{busy ? "Saving…" : "Log activity"}</button></form>}
      <div className="activity-list">{activities.map((item) => <article className="activity-item" key={item.id}><span className="activity-icon"><i className="bi bi-chat-left-text" /></span><div><strong>{item.title}</strong><small>{item.type} · {new Date(item.occurred_at).toLocaleString()}</small>{item.body && <p>{item.body}</p>}</div></article>)}{activities.length === 0 && <div className="empty-state">No activity logged yet. Add the first note or interaction above.</div>}</div>
    </div></div>}
    {showForm && <div className="modal-backdrop-custom" role="presentation" onMouseDown={(event) => { if (event.target === event.currentTarget) setShowForm(false); }}><div className="lead-modal" role="dialog" aria-modal="true" aria-labelledby="modal-title"><div className="modal-title-row"><div><h2 id="modal-title">Add a new lead</h2><p>Save a contact to your CRM workspace.</p></div><button className="icon-button" onClick={() => setShowForm(false)} aria-label="Close"><i className="bi bi-x-lg" /></button></div><form onSubmit={addLead}><label>First name<input required maxLength={100} value={form.first_name} onChange={(e) => setForm({ ...form, first_name: e.target.value })} placeholder="e.g. Alex" /></label><label>Last name<input maxLength={100} value={form.last_name} onChange={(e) => setForm({ ...form, last_name: e.target.value })} placeholder="Morgan" /></label><label>Company<input maxLength={160} value={form.company} onChange={(e) => setForm({ ...form, company: e.target.value })} placeholder="Company name" /></label><label>Email address<input type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} placeholder="alex@company.com" /></label><div className="form-row"><label>Deal value (USD)<input type="number" min="0" step="0.01" value={form.value} onChange={(e) => setForm({ ...form, value: e.target.value })} /></label><label>Source<select value={form.source} onChange={(e) => setForm({ ...form, source: e.target.value })}><option>Website</option><option>Referral</option><option>LinkedIn</option><option>Cold outreach</option><option>Other</option></select></label></div><div className="modal-actions"><button type="button" className="btn btn-light" onClick={() => setShowForm(false)}>Cancel</button><button type="submit" className="btn btn-primary-custom" disabled={busy}>{busy ? 'Saving…' : 'Create lead'}</button></div></form></div></div>}
  </div>;
}

function Metric({ label, value, icon, tone }: { label: string; value: string; icon: string; tone: string }) {
  return <article className="metric-card"><div className="metric-top"><span>{label}</span><span className={`metric-icon ${tone}`}><i className={`bi ${icon}`} /></span></div><div className="metric-value">{value}</div><div className="metric-foot"><span className="metric-change"><i className="bi bi-arrow-repeat" /> Live</span><span>from your workspace</span></div></article>;
}
export default App;
