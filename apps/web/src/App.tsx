import { useMemo, useState } from 'react';

type Status = 'New' | 'Contacted' | 'Qualified' | 'Proposal' | 'Won' | 'Lost';
type Lead = { id: number; name: string; company: string; email: string; status: Status; value: number; source: string; initials: string };
const seed: Lead[] = [
  { id: 1, name: 'Olivia Rhye', company: 'Layers', email: 'olivia@layers.com', status: 'Qualified', value: 8400, source: 'Website', initials: 'OR' },
  { id: 2, name: 'Phoenix Baker', company: 'Catalog', email: 'phoenix@catalog.com', status: 'Proposal', value: 12400, source: 'Referral', initials: 'PB' },
  { id: 3, name: 'Lana Steiner', company: 'Circooles', email: 'lana@circooles.com', status: 'Contacted', value: 5200, source: 'LinkedIn', initials: 'LS' },
  { id: 4, name: 'Demi Wilkinson', company: 'Quotient', email: 'demi@quotient.com', status: 'New', value: 3200, source: 'Website', initials: 'DW' },
  { id: 5, name: 'Candice Wu', company: 'Sisyphus', email: 'candice@sisyphus.com', status: 'Won', value: 9800, source: 'Referral', initials: 'CW' },
];
const money = (value: number) => new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(value);

function App() {
  const [leads, setLeads] = useState(seed);
  const [query, setQuery] = useState('');
  const [filter, setFilter] = useState('All');
  const [showForm, setShowForm] = useState(false);
  const [name, setName] = useState('');
  const [company, setCompany] = useState('');
  const [email, setEmail] = useState('');
  const visible = useMemo(() => leads.filter((lead) => {
    const matches = `${lead.name} ${lead.company} ${lead.email}`.toLowerCase().includes(query.toLowerCase());
    return matches && (filter === 'All' || lead.status === filter);
  }), [leads, query, filter]);
  const total = leads.reduce((sum, lead) => sum + lead.value, 0);
  const won = leads.filter((lead) => lead.status === 'Won').reduce((sum, lead) => sum + lead.value, 0);
  const open = leads.filter((lead) => !['Won', 'Lost'].includes(lead.status)).length;
  function addLead(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const cleanName = name.trim();
    if (!cleanName) return;
    setLeads((current) => [{ id: Date.now(), name: cleanName, company: company.trim() || 'Independent', email: email.trim(), status: 'New', value: 0, source: 'Manual', initials: cleanName.split(' ').map((part) => part[0]).join('').slice(0, 2).toUpperCase() }, ...current]);
    setName(''); setCompany(''); setEmail(''); setShowForm(false);
  }
  return <div className="app-shell">
    <aside className="sidebar">
      <a className="brand" href="#"><span className="brand-mark"><i className="bi bi-layers-fill" /></span> leadflow<span className="brand-dot">.</span></a>
      <div className="workspace-label">WORKSPACE</div>
      <nav className="nav flex-column">
        <a className="nav-link active" href="#"><i className="bi bi-grid-1x2" /> Overview</a>
        <a className="nav-link" href="#leads"><i className="bi bi-people" /> Leads <span className="nav-count">{leads.length}</span></a>
        <a className="nav-link" href="#pipeline"><i className="bi bi-kanban" /> Pipeline</a>
        <a className="nav-link" href="#tasks"><i className="bi bi-check2-square" /> Tasks</a>
        <a className="nav-link" href="#reports"><i className="bi bi-bar-chart" /> Reports</a>
      </nav>
      <div className="sidebar-bottom"><div className="help-card"><i className="bi bi-life-preserver" /><strong>Need a hand?</strong><span>Visit the help center for tips and guides.</span><a href="https://github.com/asadmmn/LeadFlow-CRM">Open documentation <i className="bi bi-arrow-up-right" /></a></div><div className="profile"><div className="avatar avatar-user">AQ</div><div><strong>Abdul Qavi</strong><small>Workspace admin</small></div><i className="bi bi-three-dots ms-auto" /></div></div>
    </aside>
    <main className="main-content">
      <header className="topbar"><div className="breadcrumb-text">Workspace <i className="bi bi-chevron-right" /> <strong>Overview</strong></div><div className="top-actions"><button className="icon-button" aria-label="Help"><i className="bi bi-question-circle" /></button><button className="icon-button notification" aria-label="Notifications"><i className="bi bi-bell" /></button><div className="avatar avatar-user">AQ</div></div></header>
      <section className="page-heading"><div><div className="eyebrow">YOUR SALES WORKSPACE</div><h1>Good morning, Abdul <span>✦</span></h1><p>Here's what's happening with your sales pipeline today.</p></div><button className="btn btn-primary-custom" onClick={() => setShowForm(true)}><i className="bi bi-plus-lg" /> Add lead</button></section>
      <section className="metric-grid">
        <Metric label="Total pipeline value" value={money(total)} change="+12.8%" icon="bi-currency-dollar" tone="violet" />
        <Metric label="Won opportunities" value={money(won)} change="+8.2%" icon="bi-trophy" tone="green" />
        <Metric label="Open opportunities" value={String(open)} change="+3.1%" icon="bi-lightning-charge" tone="blue" />
        <Metric label="Conversion rate" value="24.8%" change="+2.4%" icon="bi-graph-up-arrow" tone="amber" />
      </section>
      <section className="content-card pipeline-card" id="pipeline"><div className="card-heading"><div><h2>Pipeline overview</h2><p>Opportunity distribution by stage</p></div><span className="demo-label">SAMPLE WORKSPACE DATA</span></div><div className="pipeline-bars">{(['New', 'Contacted', 'Qualified', 'Proposal', 'Won'] as Status[]).map((status, index) => { const count = leads.filter((lead) => lead.status === status).length; const width = Math.max(5, count / Math.max(1, leads.length) * 100); return <div className="pipeline-row" key={status}><div className="pipeline-label">{status}<span>{count}</span></div><div className="progress-track"><div className={`progress-fill stage-${index}`} style={{ width: `${width}%` }} /></div><small>{Math.round(count / Math.max(1, leads.length) * 100)}%</small></div>; })}</div></section>
      <section className="content-card leads-card" id="leads"><div className="card-heading leads-heading"><div><h2>Recent leads</h2><p>Keep track of your most recent opportunities.</p></div><span className="demo-label">LOCAL DEMO DATA</span></div><div className="table-tools"><div className="search-box"><i className="bi bi-search" /><input aria-label="Search leads" placeholder="Search leads..." value={query} onChange={(event) => setQuery(event.target.value)} /></div><select aria-label="Filter by status" value={filter} onChange={(event) => setFilter(event.target.value)}><option>All</option>{(['New', 'Contacted', 'Qualified', 'Proposal', 'Won', 'Lost'] as Status[]).map((status) => <option key={status}>{status}</option>)}</select></div><div className="table-responsive"><table className="table lead-table align-middle"><thead><tr><th>LEAD</th><th>STATUS</th><th>SOURCE</th><th>VALUE</th><th /></tr></thead><tbody>{visible.map((lead) => <tr key={lead.id}><td><div className="lead-person"><div className="avatar">{lead.initials}</div><div><strong>{lead.name}</strong><small>{lead.company} · {lead.email}</small></div></div></td><td><span className={`status-pill status-${lead.status.toLowerCase()}`}><span />{lead.status}</span></td><td className="source-cell">{lead.source}</td><td className="value-cell">{money(lead.value)}</td><td><button className="row-more" aria-label={`More options for ${lead.name}`}><i className="bi bi-three-dots" /></button></td></tr>)}</tbody></table>{visible.length === 0 && <div className="empty-state">No leads match your search.</div>}</div></section>
      <footer className="footer-note">LeadFlow CRM <span>·</span> Built for teams that move business forward.</footer>
    </main>
    {showForm && <div className="modal-backdrop-custom" role="presentation" onMouseDown={(event) => { if (event.target === event.currentTarget) setShowForm(false); }}><div className="lead-modal" role="dialog" aria-modal="true" aria-labelledby="modal-title"><div className="modal-title-row"><div><h2 id="modal-title">Add a new lead</h2><p>Start a relationship by adding a contact.</p></div><button className="icon-button" onClick={() => setShowForm(false)} aria-label="Close"><i className="bi bi-x-lg" /></button></div><form onSubmit={addLead}><label>Full name<input required value={name} onChange={(event) => setName(event.target.value)} placeholder="e.g. Alex Morgan" /></label><label>Company<input value={company} onChange={(event) => setCompany(event.target.value)} placeholder="Company name" /></label><label>Email address<input type="email" value={email} onChange={(event) => setEmail(event.target.value)} placeholder="alex@company.com" /></label><div className="modal-actions"><button type="button" className="btn btn-light" onClick={() => setShowForm(false)}>Cancel</button><button type="submit" className="btn btn-primary-custom">Create lead</button></div></form></div></div>}
  </div>;
}
function Metric({ label, value, change, icon, tone }: { label: string; value: string; change: string; icon: string; tone: string }) {
  return <article className="metric-card"><div className="metric-top"><span>{label}</span><span className={`metric-icon ${tone}`}><i className={`bi ${icon}`} /></span></div><div className="metric-value">{value}</div><div className="metric-foot"><span className="metric-change"><i className="bi bi-arrow-up-right" /> {change}</span><span>vs. last month</span></div></article>;
}
export default App;
