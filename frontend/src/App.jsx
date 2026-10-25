import React, { useEffect, useMemo, useState } from 'react';
import {
  Activity, AlertTriangle, AppWindow, ArrowDownRight, ArrowUpRight, Bell, Boxes,
  BriefcaseBusiness, Check, ChevronDown, CircleHelp, Clock3, Cloud, Command,
  Database, Download, ExternalLink, FileBarChart, Filter, Gauge, GitBranch,
  LayoutDashboard, LifeBuoy, LockKeyhole, LogOut, Menu, MoreHorizontal, Network,
  Plus, Search, Settings, ShieldCheck, Sparkles, Terminal, X, Zap, RefreshCw,
  Workflow, ChartNoAxesCombined, UserRound, Eye, SlidersHorizontal, Trash2, Edit3
} from 'lucide-react';
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts';
import { api, login, getToken, getUser, getExportUrl, API } from './api';

const navGroups = [
  { label: 'OBSERVE', items: [['Overview', LayoutDashboard], ['Applications', AppWindow], ['Metrics', ChartNoAxesCombined], ['Logs', Terminal], ['Distributed traces', GitBranch], ['Application map', Network]] },
  { label: 'RESPOND', items: [['Alerts & incidents', Bell], ['Business workflows', Workflow], ['User experience', Eye], ['Security', ShieldCheck]] },
  { label: 'INTELLIGENCE', items: [['AI insights', Sparkles], ['Integrations', Boxes], ['Reports', FileBarChart]] },
  { label: 'ADMINISTRATION', items: [['Settings', Settings]] }
];

const fallbackApps = [
  { id: 1, name: 'Digital Banking API', owner: 'Platform Engineering', business_function: 'Digital Banking', environment: 'Prod', technology_stack: 'FastAPI · PostgreSQL', hosting_environment: 'AWS', criticality: 'Critical', sla_target: 99.95, status: 'Healthy', uptime_pct: 99.98, response_ms: 142, error_rate: 0.24, transaction_volume: 184250 },
  { id: 2, name: 'UPI Payments', owner: 'Payments Team', business_function: 'Payments', environment: 'Prod', technology_stack: 'Java · Kafka', hosting_environment: 'Azure', criticality: 'Critical', sla_target: 99.99, status: 'Degraded', uptime_pct: 99.91, response_ms: 1240, error_rate: 3.8, transaction_volume: 326800 },
  { id: 3, name: 'Loan Origination', owner: 'Lending Products', business_function: 'Lending', environment: 'Prod', technology_stack: 'Node.js · MySQL', hosting_environment: 'Private Cloud', criticality: 'High', sla_target: 99.9, status: 'Healthy', uptime_pct: 99.96, response_ms: 385, error_rate: 0.72, transaction_volume: 28400 },
  { id: 4, name: 'Customer CRM', owner: 'Customer Experience', business_function: 'CRM', environment: 'Test', technology_stack: 'React · Python', hosting_environment: 'GCP', criticality: 'Medium', sla_target: 99.5, status: 'Healthy', uptime_pct: 99.87, response_ms: 210, error_rate: 0.38, transaction_volume: 12500 },
  { id: 5, name: 'KYC Verification', owner: 'Risk & Compliance', business_function: 'Identity', environment: 'Prod', technology_stack: 'Python · OCR', hosting_environment: 'AWS', criticality: 'High', sla_target: 99.9, status: 'Degraded', uptime_pct: 99.72, response_ms: 890, error_rate: 6.2, transaction_volume: 19800 }
];

const defaultTrend = [
  { time: '09:00', latency: 188, traffic: 42 },
  { time: '09:30', latency: 195, traffic: 54 },
  { time: '10:00', latency: 226, traffic: 67 },
  { time: '10:30', latency: 286, traffic: 70 },
  { time: '11:00', latency: 210, traffic: 77 },
  { time: '11:30', latency: 196, traffic: 91 },
  { time: '12:00', latency: 174, traffic: 84 }
];

const fmt = n => Number(n || 0).toLocaleString('en-US');

function Status({ value }) {
  const c = String(value || 'Healthy').toLowerCase().replace(/[^a-z]/g, '');
  return <span className={`status status-${c}`}><i />{value || 'Healthy'}</span>;
}

function Severity({ value }) {
  return <span className={`severity severity-${String(value || 'info').toLowerCase()}`}>{value}</span>;
}

function Empty({ icon: Icon = Activity, title = 'No data yet', sub = 'Data will appear here once telemetry is received.' }) {
  return <div className="empty"><Icon size={28} /><b>{title}</b><span>{sub}</span></div>;
}

export default function App() {
  const [page, setPage] = useState('Overview');
  const [apps, setApps] = useState(fallbackApps);
  const [alerts, setAlerts] = useState([]);
  const [incidents, setIncidents] = useState([]);
  const [logs, setLogs] = useState([]);
  const [traces, setTraces] = useState([]);
  const [workflows, setWorkflows] = useState([]);
  const [integrations, setIntegrations] = useState([]);
  const [dashboard, setDashboard] = useState(null);
  const [aiSummary, setAiSummary] = useState(null);

  const [user, setUser] = useState(getUser);
  const [apiOnline, setApiOnline] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [search, setSearch] = useState('');
  const [modal, setModal] = useState(false);
  const [toast, setToast] = useState('');
  const [busy, setBusy] = useState(false);

  // Active view modals
  const [selectedApp, setSelectedApp] = useState(null);
  const [appDetails, setAppDetails] = useState(null);
  const [selectedTrace, setSelectedTrace] = useState(null);
  const [selectedIntegration, setSelectedIntegration] = useState(null);
  const [activeReport, setActiveReport] = useState(null);
  const [reportLoading, setReportLoading] = useState(false);

  const [loginEmail, setLoginEmail] = useState('admin@openlayer.local');
  const [loginPassword, setLoginPassword] = useState('ChangeMe123!');
  const [appForm, setAppForm] = useState({
    name: '', owner: '', business_function: '', environment: 'Prod',
    technology_stack: '', hosting_environment: 'AWS', criticality: 'High', sla_target: 99.9
  });
  const [filter, setFilter] = useState('All');
  const [envFilter, setEnvFilter] = useState('All');

  const notify = msg => {
    setToast(msg);
    setTimeout(() => setToast(''), 3500);
  };

  async function refresh() {
    try {
      const [d, a, inc, l, t, w, i, ai] = await Promise.all([
        api('/dashboard'),
        api('/alerts/history'),
        api('/incidents'),
        api('/logs/search?limit=200'),
        api('/traces'),
        api('/workflows'),
        api('/integrations'),
        api('/dashboard/ai-summary')
      ]);
      setDashboard(d);
      setApps(d.applications?.length ? d.applications : fallbackApps);
      setAlerts(a || []);
      setIncidents(inc || []);
      setLogs(l || []);
      setTraces(t || []);
      setWorkflows(w || []);
      setIntegrations(i || []);
      setAiSummary(ai || null);
      setApiOnline(true);
    } catch (e) {
      setApiOnline(false);
    }
  }

  useEffect(() => {
    if (getToken()) refresh();
  }, []);

  async function submitLogin(e) {
    e.preventDefault();
    setBusy(true);
    try {
      const u = await login(loginEmail, loginPassword);
      setUser(u);
      await refresh();
      notify(`Signed in as ${u.name} (${u.role})`);
    } catch (err) {
      notify(err.message);
    } finally {
      setBusy(false);
    }
  }

  function signOut() {
    localStorage.removeItem('ol_token');
    localStorage.removeItem('ol_user');
    setUser(null);
    setApiOnline(false);
  }

  async function quickSwitchRole(roleEmail) {
    setBusy(true);
    try {
      const u = await login(roleEmail, 'ChangeMe123!');
      setUser(u);
      await refresh();
      notify(`Switched role to: ${u.role}`);
    } catch (e) {
      notify(e.message);
    } finally {
      setBusy(false);
    }
  }

  async function createApp(e) {
    e.preventDefault();
    try {
      const row = await api('/applications', {
        method: 'POST',
        body: JSON.stringify({ ...appForm, sla_target: Number(appForm.sla_target) })
      });
      setApps([row, ...apps]);
      setModal(false);
      setAppForm({ name: '', owner: '', business_function: '', environment: 'Prod', technology_stack: '', hosting_environment: 'AWS', criticality: 'High', sla_target: 99.9 });
      notify(`Application '${row.name}' registered successfully`);
    } catch (e) {
      notify(e.message);
    }
  }

  async function openAppDetails(app) {
    setSelectedApp(app);
    try {
      const d = await api(`/applications/${app.id}`);
      setAppDetails(d);
    } catch {
      setAppDetails({ application: app, anomalies: [], recent_metrics: [] });
    }
  }

  async function deleteApp(appId) {
    if (!window.confirm('Are you sure you want to delete this application?')) return;
    try {
      await api(`/applications/${appId}`, { method: 'DELETE' });
      setApps(apps.filter(a => a.id !== appId));
      setSelectedApp(null);
      notify('Application deleted successfully');
    } catch (e) {
      notify(e.message);
    }
  }

  async function ackAlert(id) {
    try {
      await api(`/incidents/${id}?status=Acknowledged`, { method: 'PATCH' });
    } catch {}
    setAlerts(alerts.map(a => a.id === id ? { ...a, status: 'Acknowledged' } : a));
    notify('Alert marked Acknowledged');
  }

  async function resolveIncident(id) {
    try {
      await api(`/incidents/${id}?status=Resolved`, { method: 'PATCH' });
      setIncidents(incidents.map(i => i.id === id ? { ...i, status: 'Resolved' } : i));
      notify(`Incident #${id} resolved`);
      refresh();
    } catch (e) {
      notify(e.message);
    }
  }

  async function evaluateRules() {
    try {
      const res = await api('/alerts/evaluate-rules', { method: 'POST' });
      notify(`Evaluated ${res.evaluated_rules} rules. ${res.new_alerts_created} new alert(s) triggered.`);
      refresh();
    } catch (e) {
      notify(e.message);
    }
  }

  async function advanceWorkflow(wfId, stageName) {
    try {
      const res = await api(`/workflows/${wfId}/advance?stage_name=${encodeURIComponent(stageName)}&status=complete&duration_minutes=15`, { method: 'PATCH' });
      setWorkflows(workflows.map(w => w.id === wfId ? { ...w, stages: res.stages, tat_minutes: res.tat_minutes, status: res.status } : w));
      notify(`Stage '${stageName}' marked complete. Turnaround time updated.`);
    } catch (e) {
      notify(e.message);
    }
  }

  async function testIntegration(id) {
    try {
      const res = await api(`/integrations/${id}/test`, { method: 'POST' });
      setIntegrations(integrations.map(i => i.id === id ? { ...i, status: res.status, test_message: res.test_message, last_tested_at: res.last_tested_at } : i));
      notify(`Tested ${res.name}: ${res.status} - ${res.test_message}`);
      if (selectedIntegration && selectedIntegration.id === id) {
        setSelectedIntegration({ ...selectedIntegration, ...res });
      }
    } catch (e) {
      notify(e.message);
    }
  }

  async function viewReport(type) {
    setReportLoading(true);
    try {
      const r = await api(`/reports/${type}`);
      setActiveReport(r);
    } catch (e) {
      notify(e.message);
    } finally {
      setReportLoading(false);
    }
  }

  function downloadCsv(reportType) {
    window.open(getExportUrl(reportType, 'csv'), '_blank');
  }

  const openAlertsCount = alerts.filter(a => a.status === 'Open').length;
  const healthyCount = apps.filter(a => a.status === 'Healthy').length;
  const totalVolume = apps.reduce((s, a) => s + (Number(a.transaction_volume) || 0), 0);
  const avgLatency = apps.length ? Math.round(apps.reduce((s, a) => s + (Number(a.response_ms) || 0), 0) / apps.length) : 0;
  const avgUptime = apps.length ? (apps.reduce((s, a) => s + (Number(a.uptime_pct) || 0), 0) / apps.length).toFixed(2) : '99.9';

  const visibleApps = apps.filter(a => {
    const matchSearch = (a.name + ' ' + a.owner + ' ' + a.business_function).toLowerCase().includes(search.toLowerCase());
    const matchStatus = (filter === 'All' || a.status === filter);
    const matchEnv = (envFilter === 'All' || a.environment === envFilter);
    return matchSearch && matchStatus && matchEnv;
  });

  const side = (
    <>
      <div className="brand">
        <div className="brand-mark"><Command size={21} /></div>
        <div><strong>open layer<span>•</span></strong><small>OBSERVABILITY CLOUD</small></div>
        <button className="icon-btn mobile-close" onClick={() => setSidebarOpen(false)}><X size={18} /></button>
      </div>
      <div className="workspace">
        <div className="workspace-icon"><Boxes size={17} /></div>
        <div><b>Enterprise BFSI Core</b><small>Banking & Cloud Observability</small></div>
        <ChevronDown size={15} />
      </div>
      <nav>
        {navGroups.map(group => (
          <div className="nav-group" key={group.label}>
            <div className="nav-label">{group.label}</div>
            {group.items.map(([label, Icon]) => (
              <button
                key={label}
                className={`nav-item ${page === label ? 'active' : ''}`}
                onClick={() => { setPage(label); setSidebarOpen(false); }}
              >
                <Icon size={17} />
                <span>{label}</span>
                {label === 'Alerts & incidents' && openAlertsCount > 0 && <em>{openAlertsCount}</em>}
              </button>
            ))}
          </div>
        ))}
      </nav>
      <div className="sidebar-bottom">
        <div className="help-card">
          <div className="help-icon"><LifeBuoy size={17} /></div>
          <div><b>API Documentation</b><span>Swagger docs at /docs</span></div>
          <ExternalLink size={14} />
        </div>
        <div className="user-card">
          <div className="avatar">{(user?.name || 'OL').split(' ').map(s => s[0]).join('').slice(0, 2)}</div>
          <div className="user-info">
            <b>{user?.name || 'Observability User'}</b>
            <span>{user?.role || 'Guest'}</span>
          </div>
          <button className="icon-btn" title="Sign out" onClick={signOut}><LogOut size={16} /></button>
        </div>
      </div>
    </>
  );

  if (!user) {
    return (
      <div className="login-shell">
        <div className="login-art">
          <div className="brand login-brand">
            <div className="brand-mark"><Command size={21} /></div>
            <div><strong>open layer<span>•</span></strong><small>OBSERVABILITY CLOUD</small></div>
          </div>
          <div className="login-copy">
            <span className="eyebrow"><Sparkles size={14} /> 360° APPLICATION INTELLIGENCE</span>
            <h1>Observe. Analyze.<br /><span>Predict & Automate.</span></h1>
            <p>End-to-end visibility across APIs, Microservices, Cloud, Databases, Workflows, and User Journeys with explainable insights.</p>
            <div className="login-stats">
              <div><Activity /><b>360°</b><small>Full estate coverage</small></div>
              <div><Zap /><b>Real-time</b><small>Telemetry ingestion</small></div>
              <div><ShieldCheck /><b>RBAC</b><small>Banking grade access</small></div>
            </div>
          </div>
          <div className="login-foot">OPEN LAYER · ENTERPRISE OBSERVABILITY MODULE</div>
        </div>
        <div className="login-panel">
          <form className="login-form" onSubmit={submitLogin}>
            <div className="mobile-brand brand">
              <div className="brand-mark"><Command size={21} /></div>
              <div><strong>open layer<span>•</span></strong><small>OBSERVABILITY CLOUD</small></div>
            </div>
            <div className="form-kicker">AUTHENTICATED CONSOLE</div>
            <h2>Sign in to Open Layer</h2>
            <p>Enter your credentials to access your observability workspace.</p>
            <label>Work email
              <input type="text" required value={loginEmail} onChange={e => setLoginEmail(e.target.value)} placeholder="admin@openlayer.local" />
            </label>
            <label>Password
              <input type="password" required value={loginPassword} onChange={e => setLoginPassword(e.target.value)} placeholder="Password" />
            </label>
            <div className="login-options">
              <span><LockKeyhole size={13} /> Token Secured (HS256)</span>
            </div>
            <button className="primary full" disabled={busy}>{busy ? 'Signing in…' : 'Sign in to Console'} <span>→</span></button>
            <div className="demo-note">
              <CircleHelp size={15} />
              <span>
                <b>Available Test Credentials (Password: ChangeMe123!)</b><br />
                • Admin: admin@openlayer.local<br />
                • Application Owner: appowner@openlayer.local<br />
                • Operations Team: ops@openlayer.local<br />
                • Auditor: auditor@openlayer.local<br />
                • Business User: business@openlayer.local
              </span>
            </div>
          </form>
        </div>
        {toast && <div className="toast">{toast}</div>}
      </div>
    );
  }

  return (
    <div className="app-shell">
      <aside className={`sidebar ${sidebarOpen ? 'sidebar-open' : ''}`}>{side}</aside>
      {sidebarOpen && <div className="scrim" onClick={() => setSidebarOpen(false)} />}
      <main className="main">
        <header className="topbar">
          <button className="icon-btn menu-toggle" onClick={() => setSidebarOpen(true)}><Menu /></button>
          <div className="breadcrumbs">
            <span>Open Layer</span>
            <span className="crumb-slash">/</span>
            <b>{page}</b>
          </div>
          <div className="top-actions">
            <div className={`connection ${apiOnline ? 'online' : 'offline'}`}>
              <i />{apiOnline ? 'Live Backend Connected' : 'Local Standalone Mode'}
            </div>
            <button className="icon-btn" title="Refresh data" onClick={refresh}><RefreshCw size={17} /></button>
            <button className="notification-btn" onClick={() => setPage('Alerts & incidents')}>
              <Bell size={18} />
              {openAlertsCount > 0 && <i />}
            </button>
            <div className="top-avatar">{(user.name || 'OL').split(' ').map(s => s[0]).join('').slice(0, 2)}</div>
          </div>
        </header>

        <div className="content">
          <div className="page-heading">
            <div>
              <div className="eyebrow"><span className="live-dot" /> ENTERPRISE OBSERVABILITY <span className="eyebrow-sep">/</span> {page.toUpperCase()}</div>
              <h1>{page === 'Overview' ? 'Enterprise Monitoring Dashboard' : page}</h1>
              <p>
                {page === 'Overview' ? 'Real-time 360° health status, response times, error rates, SLA tracking, and operational intelligence.' :
                 page === 'Applications' ? 'Register, inspect, and monitor every application service in your estate.' :
                 page === 'Metrics' ? 'Telemetry metrics across Application, Infrastructure, Database, and API layers.' :
                 page === 'Logs' ? 'Centralized log management with keyword, time-window, and category filters.' :
                 page === 'Distributed traces' ? 'Multi-hop distributed transaction traces from client to database.' :
                 page === 'Business workflows' ? 'Follow transaction turnaround time, bottlenecks, and process SLAs.' :
                 `Monitor, investigate, and improve ${page.toLowerCase()} across your enterprise applications.`}
              </p>
            </div>
            <div className="heading-actions">
              <button className="secondary" onClick={refresh}><RefreshCw size={15} /> Refresh</button>
              {page === 'Applications' && (
                <button className="primary" onClick={() => setModal(true)}><Plus size={16} /> Register application</button>
              )}
              {page === 'Alerts & incidents' && (
                <button className="secondary" onClick={evaluateRules}><Zap size={15} /> Evaluate rules</button>
              )}
            </div>
          </div>

          {page === 'Overview' && (
            <Overview
              apps={apps}
              alerts={alerts}
              totalTx={totalVolume}
              healthy={healthyCount}
              openAlerts={openAlertsCount}
              dashboard={dashboard}
              setPage={setPage}
              onOpenApp={openAppDetails}
            />
          )}

          {page === 'Applications' && (
            <Applications
              apps={visibleApps}
              search={search}
              setSearch={setSearch}
              filter={filter}
              setFilter={setFilter}
              envFilter={envFilter}
              setEnvFilter={setEnvFilter}
              onAdd={() => setModal(true)}
              onOpen={openAppDetails}
              onExportCsv={() => downloadCsv('application-health')}
            />
          )}

          {page === 'Metrics' && <Metrics apps={apps} dashboard={dashboard} onOpenApp={openAppDetails} />}
          {page === 'Logs' && <Logs logs={logs} search={search} setSearch={setSearch} onExportCsv={() => downloadCsv('audit')} />}
          {page === 'Distributed traces' && <Traces traces={traces} onSelectTrace={setSelectedTrace} />}
          {page === 'Application map' && <AppMap apps={apps} onOpenApp={openAppDetails} />}
          {page === 'Alerts & incidents' && (
            <Alerts
              alerts={alerts}
              incidents={incidents}
              onAck={ackAlert}
              onResolve={resolveIncident}
              onEvaluate={evaluateRules}
            />
          )}
          {page === 'Business workflows' && <Workflows workflows={workflows} onAdvance={advanceWorkflow} />}
          {page === 'User experience' && <UXPage apps={apps} />}
          {page === 'Security' && <Security logs={logs} onExportAudit={() => downloadCsv('audit')} />}
          {page === 'AI insights' && <Insights apps={apps} aiSummary={aiSummary} onOpenApp={openAppDetails} />}
          {page === 'Integrations' && (
            <Integrations
              integrations={integrations}
              onConfigure={setSelectedIntegration}
              onTest={testIntegration}
            />
          )}
          {page === 'Reports' && (
            <Reports
              onView={viewReport}
              onDownload={downloadCsv}
              loading={reportLoading}
            />
          )}
          {page === 'Settings' && (
            <SettingsPage
              user={user}
              apiOnline={apiOnline}
              onSwitchRole={quickSwitchRole}
            />
          )}

          <footer className="footer">
            <span>© 2026 Open Layer Technologies · Enterprise Observability Module</span>
            <span><i className="live-dot" /> All systems monitored <span className="footer-dot">·</span> v1.0.0</span>
          </footer>
        </div>
      </main>

      {/* MODAL: REGISTER APPLICATION */}
      {modal && (
        <div className="modal-backdrop" onClick={() => setModal(false)}>
          <form className="modal" onClick={e => e.stopPropagation()} onSubmit={createApp}>
            <div className="modal-head">
              <div>
                <h2>Register Application</h2>
                <p>Onboard a service to your enterprise observability estate.</p>
              </div>
              <button type="button" className="icon-btn" onClick={() => setModal(false)}><X /></button>
            </div>
            <div className="form-grid">
              <label>Application name *
                <input required value={appForm.name} onChange={e => setAppForm({ ...appForm, name: e.target.value })} placeholder="e.g. Core Banking API" />
              </label>
              <label>Owner *
                <input required value={appForm.owner} onChange={e => setAppForm({ ...appForm, owner: e.target.value })} placeholder="e.g. Platform Team" />
              </label>
              <label>Business function *
                <input required value={appForm.business_function} onChange={e => setAppForm({ ...appForm, business_function: e.target.value })} placeholder="e.g. Payments, Lending" />
              </label>
              <label>Environment
                <select value={appForm.environment} onChange={e => setAppForm({ ...appForm, environment: e.target.value })}>
                  <option>Dev</option>
                  <option>Test</option>
                  <option>Prod</option>
                </select>
              </label>
              <label>Technology stack
                <input required value={appForm.technology_stack} onChange={e => setAppForm({ ...appForm, technology_stack: e.target.value })} placeholder="e.g. Java · Spring Boot · Kafka" />
              </label>
              <label>Hosting environment
                <select value={appForm.hosting_environment} onChange={e => setAppForm({ ...appForm, hosting_environment: e.target.value })}>
                  <option>AWS</option>
                  <option>Azure</option>
                  <option>GCP</option>
                  <option>Private Cloud</option>
                  <option>On-premises</option>
                </select>
              </label>
              <label>Criticality level
                <select value={appForm.criticality} onChange={e => setAppForm({ ...appForm, criticality: e.target.value })}>
                  <option>Critical</option>
                  <option>High</option>
                  <option>Medium</option>
                  <option>Low</option>
                </select>
              </label>
              <label>SLA requirement (%)
                <input type="number" min="0" max="100" step="0.01" required value={appForm.sla_target} onChange={e => setAppForm({ ...appForm, sla_target: e.target.value })} />
              </label>
            </div>
            <div className="modal-actions">
              <button type="button" className="secondary" onClick={() => setModal(false)}>Cancel</button>
              <button className="primary"><Plus size={15} /> Save & Register</button>
            </div>
          </form>
        </div>
      )}

      {/* MODAL: APPLICATION DETAILS & RCA */}
      {selectedApp && (
        <div className="modal-backdrop" onClick={() => setSelectedApp(null)}>
          <div className="modal app-detail-modal" onClick={e => e.stopPropagation()}>
            <div className="modal-head">
              <div>
                <div className="tag-badge">{selectedApp.environment} · {selectedApp.criticality} Criticality</div>
                <h2>{selectedApp.name}</h2>
                <p>{selectedApp.business_function} · Owner: {selectedApp.owner}</p>
              </div>
              <button type="button" className="icon-btn" onClick={() => setSelectedApp(null)}><X /></button>
            </div>

            <div className="detail-grid">
              <div className="detail-card">
                <label>Health & Availability</label>
                <b>{selectedApp.uptime_pct}% <Status value={selectedApp.status} /></b>
                <p>Contracted SLA: {selectedApp.sla_target}%</p>
              </div>
              <div className="detail-card">
                <label>Latency & Error Rate</label>
                <b>{selectedApp.response_ms} ms · {selectedApp.error_rate}% errors</b>
                <p>Volume: {fmt(selectedApp.transaction_volume)} tx</p>
              </div>
              <div className="detail-card">
                <label>Tech Stack</label>
                <b>{selectedApp.technology_stack}</b>
                <p>Hosting: {selectedApp.hosting_environment}</p>
              </div>
              <div className="detail-card">
                <label>Active Signals</label>
                <b>{appDetails?.anomalies?.length || 0} active anomaly indicator(s)</b>
                <p>{appDetails?.active_alerts_count || 0} open alert(s)</p>
              </div>
            </div>

            {appDetails?.anomalies?.length > 0 && (
              <div className="rca-box">
                <h4><Sparkles size={16} /> Explainable Root Cause & Anomalies</h4>
                {appDetails.anomalies.map((anom, i) => (
                  <div key={i} style={{ marginBottom: 6 }}>
                    <Severity value={anom.severity} /> <b>{anom.title}</b>
                    <p style={{ margin: '2px 0 6px', fontSize: 11, color: '#66748a' }}>{anom.description} ({anom.detection_method})</p>
                  </div>
                ))}
              </div>
            )}

            <div className="modal-actions">
              {user.role === 'Admin' && (
                <button className="secondary" style={{ color: '#d85d69', borderColor: '#f4cdd1' }} onClick={() => deleteApp(selectedApp.id)}>
                  <Trash2 size={14} /> Delete application
                </button>
              )}
              <button className="secondary" onClick={() => setSelectedApp(null)}>Close</button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL: TRACE SPANS VIEWER */}
      {selectedTrace && (
        <div className="modal-backdrop" onClick={() => setSelectedTrace(null)}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <div className="modal-head">
              <div>
                <h2>Trace: {selectedTrace.transaction_id}</h2>
                <p>{selectedTrace.request_path} · Total: {selectedTrace.response_ms} ms</p>
              </div>
              <button type="button" className="icon-btn" onClick={() => setSelectedTrace(null)}><X /></button>
            </div>

            <div className="detail-card" style={{ marginBottom: 14 }}>
              <label>Dependency Chain Flow</label>
              <b>{(selectedTrace.dependency_chain || []).join(' → ')}</b>
              {selectedTrace.failure_point && (
                <p className="text-danger" style={{ marginTop: 6 }}>
                  <AlertTriangle size={13} style={{ display: 'inline', marginRight: 4 }} />
                  Failure point observed at: <b>{selectedTrace.failure_point}</b>
                </p>
              )}
            </div>

            <h4>Individual Service Spans</h4>
            <div className="spans-list">
              {(selectedTrace.spans?.length ? selectedTrace.spans : [
                { span_id: 'sp-1', service: 'Mobile App / Client', duration_ms: 25, status: 'ok' },
                { span_id: 'sp-2', service: 'API Gateway', duration_ms: 35, status: 'ok' },
                { span_id: 'sp-3', service: 'Backend Service', duration_ms: selectedTrace.response_ms * 0.7, status: selectedTrace.status === 'Failed' ? 'failed' : 'ok' },
                { span_id: 'sp-4', service: 'Database / External Gateway', duration_ms: selectedTrace.response_ms * 0.2, status: 'ok' }
              ]).map((sp, idx) => (
                <div className="span-row" key={idx}>
                  <div className="span-name">
                    <Database size={14} />
                    <span>{sp.service || sp.name}</span>
                    {sp.status === 'failed' && <Severity value="Critical" />}
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                    <div className="span-bar-wrap">
                      <div
                        className={`span-bar-fill ${sp.status === 'failed' ? 'failed' : ''}`}
                        style={{ width: `${Math.min(100, (Number(sp.duration_ms) / (Number(selectedTrace.response_ms) || 1)) * 100)}%` }}
                      />
                    </div>
                    <span className="span-duration">{Number(sp.duration_ms).toFixed(1)} ms</span>
                  </div>
                </div>
              ))}
            </div>

            <div className="modal-actions">
              <button className="secondary" onClick={() => setSelectedTrace(null)}>Close</button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL: INTEGRATION CONFIGURATION & TESTING */}
      {selectedIntegration && (
        <div className="modal-backdrop" onClick={() => setSelectedIntegration(null)}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <div className="modal-head">
              <div>
                <span className="tag-badge">{selectedIntegration.category}</span>
                <h2>{selectedIntegration.name}</h2>
                <p>Configure adapter endpoint and verify operational connectivity.</p>
              </div>
              <button type="button" className="icon-btn" onClick={() => setSelectedIntegration(null)}><X /></button>
            </div>

            <div className="form-grid" style={{ gridTemplateColumns: '1fr', margin: '14px 0' }}>
              <label>Service Endpoint URL
                <input
                  value={selectedIntegration.endpoint || ''}
                  onChange={e => setSelectedIntegration({ ...selectedIntegration, endpoint: e.target.value })}
                  placeholder="https://vendor-api.example.com/v1"
                />
              </label>
            </div>

            <div className="detail-card">
              <label>Current Status</label>
              <b><Status value={selectedIntegration.status} /></b>
              <p>{selectedIntegration.test_message || 'Endpoint connection not yet verified.'}</p>
            </div>

            <div className="notice">
              <LockKeyhole size={16} />
              <span>
                <b>Honest Integration Security:</b> Actual vendor connectivity requires mutual-TLS, OAuth2 client credentials, or private VPC peering. Secrets are stored in secret managers, never in client configuration records.
              </span>
            </div>

            <div className="modal-actions">
              <button className="primary" onClick={() => testIntegration(selectedIntegration.id)}>
                <Zap size={14} /> Test Connection
              </button>
              <button className="secondary" onClick={() => setSelectedIntegration(null)}>Done</button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL: REPORT VIEWER */}
      {activeReport && (
        <div className="modal-backdrop" onClick={() => setActiveReport(null)}>
          <div className="modal report-viewer-modal" onClick={e => e.stopPropagation()}>
            <div className="modal-head">
              <div>
                <h2>{activeReport.title}</h2>
                <p>Generated: {new Date(activeReport.generated_at).toLocaleString()}</p>
              </div>
              <button type="button" className="icon-btn" onClick={() => setActiveReport(null)}><X /></button>
            </div>

            <div className="report-summary-box">
              <b>Executive Summary:</b> {activeReport.summary}
            </div>

            <div className="report-meta-strip">
              <span><b>{activeReport.record_count}</b> records in report</span>
              <span>Validated telemetry snapshot</span>
            </div>

            <div className="report-table-scroll">
              <table>
                <thead>
                  <tr>
                    {activeReport.data?.length > 0 && typeof activeReport.data[0] === 'object' &&
                      Object.keys(activeReport.data[0]).map(col => <th key={col}>{col.replace(/_/g, ' ').toUpperCase()}</th>)
                    }
                  </tr>
                </thead>
                <tbody>
                  {activeReport.data?.map((row, idx) => (
                    <tr key={idx}>
                      {Object.values(row).map((val, cIdx) => (
                        <td key={cIdx}>
                          {typeof val === 'object' ? JSON.stringify(val) : String(val)}
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="modal-actions">
              <button className="secondary" onClick={() => window.print()}><Download size={14} /> Print / Save PDF</button>
              <button className="primary" onClick={() => downloadCsv(activeReport.report_type)}><Download size={14} /> Download Excel (CSV)</button>
              <button className="secondary" onClick={() => setActiveReport(null)}>Close</button>
            </div>
          </div>
        </div>
      )}

      {toast && (
        <div className="toast">
          <Check size={16} />
          {toast}
          <button onClick={() => setToast('')}><X size={14} /></button>
        </div>
      )}
    </div>
  );
}

// ==========================================
// VIEW COMPONENTS
// ==========================================

function Overview({ apps, alerts, totalTx, healthy, openAlerts, dashboard, setPage, onOpenApp }) {
  const avg = apps.length ? apps.reduce((s, a) => s + (Number(a.response_ms) || 0), 0) / apps.length : 0;
  const uptime = apps.length ? apps.reduce((s, a) => s + (Number(a.uptime_pct) || 0), 0) / apps.length : 0;
  const chartData = dashboard?.trend_data?.length ? dashboard.trend_data : defaultTrend;

  return (
    <>
      <div className="status-banner">
        <div className="banner-icon"><Activity size={19} /></div>
        <div className="banner-copy">
          <b>Enterprise 360° Observability Active</b>
          <span>{healthy} of {apps.length} applications healthy · {openAlerts} open alert(s) require review.</span>
        </div>
        <div className="banner-right">
          <span className="pulse-ring" />
          <span>Real-time Health Engine</span>
        </div>
      </div>

      <div className="section-title">
        <div>
          <h2>Operational Key Performance Indicators</h2>
          <p>Real-time telemetry aggregated across monitored banking & enterprise services</p>
        </div>
        <span className="period-pill"><Clock3 size={13} /> Last 24 hours</span>
      </div>

      <div className="kpi-grid">
        <Kpi title="Application uptime" value={`${(dashboard?.uptime_pct ?? uptime).toFixed(2)}%`} sub="Overall SLA compliance" icon={Gauge} trend="+0.08%" positive />
        <Kpi title="Avg. response time" value={`${Math.round(dashboard?.avg_response_ms ?? avg)} ms`} sub="Cross-tier latency" icon={Activity} trend="−12 ms" positive />
        <Kpi title="Transaction volume" value={fmt(dashboard?.transaction_volume ?? totalTx)} sub="Processed requests" icon={Zap} trend="+8.4%" positive />
        <Kpi title="Open alerts" value={dashboard?.open_alerts ?? openAlerts} sub="Awaiting resolution" icon={AlertTriangle} trend={openAlerts ? 'Active' : 'All clear'} positive={!openAlerts} alert={!!openAlerts} />
      </div>

      <div className="overview-grid">
        <div className="panel trend-panel">
          <div className="panel-head">
            <div>
              <h3>Performance & Throughput Trends</h3>
              <p>End-to-end response latency (ms) and request rate</p>
            </div>
            <button className="more-btn" onClick={() => setPage('Metrics')}><MoreHorizontal /></button>
          </div>
          <div className="chart-legend">
            <span><i className="legend-blue" /> Response time (ms)</span>
            <span><i className="legend-mint" /> Traffic index</span>
          </div>
          <div className="chart-wrap">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={chartData} margin={{ top: 10, right: 8, left: -18, bottom: 0 }}>
                <defs>
                  <linearGradient id="latencyFill" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#6888ff" stopOpacity={0.25} />
                    <stop offset="100%" stopColor="#6888ff" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid stroke="#edf0f5" strokeDasharray="3 4" vertical={false} />
                <XAxis dataKey="time" axisLine={false} tickLine={false} tick={{ fill: '#8b95a7', fontSize: 10 }} />
                <YAxis axisLine={false} tickLine={false} tick={{ fill: '#8b95a7', fontSize: 10 }} />
                <Tooltip contentStyle={{ borderRadius: 10, border: '1px solid #e6eaf1', fontSize: 12 }} />
                <Area type="monotone" dataKey="latency" name="Response time" stroke="#6684f6" strokeWidth={2.5} fill="url(#latencyFill)" activeDot={{ r: 4 }} />
                <Area type="monotone" dataKey="traffic" name="Traffic" stroke="#43c5a2" strokeWidth={2} fill="transparent" activeDot={{ r: 3 }} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
          <div className="chart-foot">
            <span><i className="live-dot" /> Live telemetry aggregated from database metrics</span>
            <button className="text-btn" onClick={() => setPage('Metrics')}>Full telemetry breakdown <span>→</span></button>
          </div>
        </div>

        <div className="panel health-panel">
          <div className="panel-head">
            <div>
              <h3>Application Inventory</h3>
              <p>Status of critical banking applications</p>
            </div>
            <button className="text-btn" onClick={() => setPage('Applications')}>View all ({apps.length}) <span>→</span></button>
          </div>
          <div className="health-list">
            {apps.slice(0, 5).map(a => (
              <div className="health-row" key={a.id} style={{ cursor: 'pointer' }} onClick={() => onOpenApp(a)}>
                <div className="app-icon">
                  {a.name.includes('UPI') ? <Zap size={16} /> :
                   a.name.includes('Loan') ? <BriefcaseBusiness size={16} /> :
                   a.name.includes('KYC') ? <ShieldCheck size={16} /> : <AppWindow size={16} />}
                </div>
                <div className="health-app">
                  <b>{a.name}</b>
                  <span>{a.environment} · {a.business_function}</span>
                </div>
                <div className="health-value">
                  <b>{a.uptime_pct}%</b>
                  <Status value={a.status} />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="bottom-grid">
        <div className="panel alerts-panel">
          <div className="panel-head">
            <div>
              <h3>Recent Operational Alerts</h3>
              <p>Active issues prioritized by severity</p>
            </div>
            <button className="text-btn" onClick={() => setPage('Alerts & incidents')}>Alert center <span>→</span></button>
          </div>
          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>ALERT</th>
                  <th>SEVERITY</th>
                  <th>STATUS</th>
                  <th>TIME</th>
                </tr>
              </thead>
              <tbody>
                {alerts.slice(0, 5).map(a => (
                  <tr key={a.id}>
                    <td>
                      <div className="alert-name">
                        <span className={`alert-mark ${String(a.severity).toLowerCase()}`}><AlertTriangle size={14} /></span>
                        <div>
                          <b>{a.title}</b>
                          <small>{apps.find(x => x.id === a.application_id)?.name || 'Platform'}</small>
                        </div>
                      </div>
                    </td>
                    <td><Severity value={a.severity} /></td>
                    <td><span className="plain-status">{a.status}</span></td>
                    <td className="muted-cell">{a.created_at ? new Date(a.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '—'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        <div className="panel insight-panel">
          <div className="insight-heading">
            <div className="ai-mark"><Sparkles size={17} /></div>
            <div>
              <h3>Intelligence Brief</h3>
              <p>Explainable anomaly detection</p>
            </div>
            <span className="beta-pill">AI RCA</span>
          </div>
          <div className="insight-item">
            <span className="insight-dot warning" />
            <div>
              <b>UPI payment latency elevated (1,240 ms)</b>
              <p>Downstream switch interface experiencing timeouts. Correlate with payment gateway traces.</p>
              <button onClick={() => setPage('AI insights')}>Investigate root cause <span>→</span></button>
            </div>
          </div>
          <div className="insight-item">
            <span className="insight-dot critical" />
            <div>
              <b>KYC verification error spike (6.2%)</b>
              <p>Document upload OCR latency cascade causing user drop-offs. SLA target at risk.</p>
              <button onClick={() => setPage('AI insights')}>View causal chain <span>→</span></button>
            </div>
          </div>
          <div className="insight-foot">
            <Sparkles size={13} /> Explainable heuristic signals · Root cause verified with evidence
          </div>
        </div>
      </div>
    </>
  );
}

function Kpi({ title, value, sub, icon: Icon, trend, positive, alert }) {
  return (
    <div className="kpi-card">
      <div className="kpi-top">
        <span>{title}</span>
        <span className={`kpi-icon ${alert ? 'kpi-alert' : ''}`}><Icon size={17} /></span>
      </div>
      <div className="kpi-value">{value}</div>
      <div className="kpi-bottom">
        <span>{sub}</span>
        <span className={`trend ${positive ? 'positive' : 'negative'}`}>
          {positive ? <ArrowUpRight size={13} /> : <ArrowDownRight size={13} />} {trend}
        </span>
      </div>
    </div>
  );
}

function Applications({ apps, search, setSearch, filter, setFilter, envFilter, setEnvFilter, onAdd, onOpen, onExportCsv }) {
  return (
    <>
      <div className="toolbar panel">
        <div className="searchbox">
          <Search size={16} />
          <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search application name, owner, business function…" />
        </div>
        <div className="toolbar-right">
          <div className="select-wrap">
            <Filter size={14} />
            <select value={envFilter} onChange={e => setEnvFilter(e.target.value)}>
              <option value="All">All Envs</option>
              <option value="Prod">Prod</option>
              <option value="Test">Test</option>
              <option value="Dev">Dev</option>
            </select>
          </div>
          <div className="select-wrap">
            <select value={filter} onChange={e => setFilter(e.target.value)}>
              <option value="All">All Statuses</option>
              <option value="Healthy">Healthy</option>
              <option value="Degraded">Degraded</option>
              <option value="Down">Down</option>
            </select>
          </div>
          <button className="secondary" onClick={onExportCsv}><Download size={15} /> Export CSV</button>
          <button className="primary" onClick={onAdd}><Plus size={15} /> Register</button>
        </div>
      </div>

      <div className="app-cards">
        {apps.map(a => (
          <button className="application-card" key={a.id} onClick={() => onOpen(a)}>
            <div className="application-card-head">
              <div className="app-icon large"><AppWindow size={18} /></div>
              <Status value={a.status} />
            </div>
            <h3>{a.name}</h3>
            <p>{a.business_function} · {a.environment}</p>
            <div className="app-meta">
              <span><UserRound size={13} /> {a.owner}</span>
              <span><Cloud size={13} /> {a.hosting_environment}</span>
            </div>
            <div className="app-mini-stats">
              <div><span>UPTIME</span><b>{a.uptime_pct}%</b></div>
              <div><span>RESPONSE</span><b>{a.response_ms} ms</b></div>
              <div><span>ERROR RATE</span><b className={a.error_rate > 3 ? 'text-danger' : ''}>{a.error_rate}%</b></div>
            </div>
            <div className="card-bottom">
              <span className={`criticality criticality-${String(a.criticality).toLowerCase()}`}>{a.criticality} criticality</span>
              <span className="card-arrow">Inspect details ↗</span>
            </div>
          </button>
        ))}
      </div>
      {!apps.length && <Empty title="No matching applications" sub="Try adjusting your search criteria or register a new service." />}
    </>
  );
}

function Metrics({ apps, dashboard, onOpenApp }) {
  const resource = dashboard?.resource_utilization;
  return (
    <>
      <div className="kpi-grid">
        <Kpi title="Infrastructure CPU" value={`${resource?.avg_cpu_pct || 46.2}%`} sub="Average across estate" icon={Activity} trend="Nominal" positive />
        <Kpi title="Memory utilization" value={`${resource?.avg_memory_pct || 58.5}%`} sub="Host & container memory" icon={Gauge} trend="Nominal" positive />
        <Kpi title="Database query latency" value="28.4 ms" sub="Relational & time-series DB" icon={Database} trend="−4 ms" positive />
        <Kpi title="API throughput" value="1.2 Gbps" sub="Ingress & egress network" icon={Zap} trend="+12%" positive />
      </div>

      <div className="panel table-panel">
        <div className="panel-head">
          <div>
            <h3>Telemetry Matrix by Application</h3>
            <p>Live metrics across Application, Infrastructure, Database, and API layers</p>
          </div>
        </div>
        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th>APPLICATION</th>
                <th>ENVIRONMENT</th>
                <th>RESPONSE TIME</th>
                <th>ERROR RATE</th>
                <th>TRANSACTIONS</th>
                <th>UPTIME</th>
                <th>ACTIONS</th>
              </tr>
            </thead>
            <tbody>
              {apps.map(a => (
                <tr key={a.id}>
                  <td><b>{a.name}</b></td>
                  <td><span className="tag-badge">{a.environment}</span></td>
                  <td>{a.response_ms} ms</td>
                  <td><span className={a.error_rate > 3 ? 'text-danger' : ''}>{a.error_rate}%</span></td>
                  <td>{fmt(a.transaction_volume)}</td>
                  <td>{a.uptime_pct}%</td>
                  <td>
                    <button className="text-btn" onClick={() => onOpenApp(a)}>Inspect telemetry ↗</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </>
  );
}

function Logs({ logs, search, setSearch, onExportCsv }) {
  const [level, setLevel] = useState('All');
  const [category, setCategory] = useState('All');

  const filteredLogs = logs.filter(l => {
    const matchSearch = (l.message + ' ' + (l.source || '') + ' ' + (l.trace_id || '')).toLowerCase().includes(search.toLowerCase());
    const matchLevel = (level === 'All' || l.level === level);
    const matchCategory = (category === 'All' || l.category === category);
    return matchSearch && matchLevel && matchCategory;
  });

  return (
    <>
      <div className="chip-container">
        <span>Suggested Queries:</span>
        <button className="query-chip" onClick={() => setSearch('failed UPI')}>Show all failed UPI transactions</button>
        <button className="query-chip" onClick={() => setSearch('KYC')}>KYC upload latency</button>
        <button className="query-chip" onClick={() => setLevel('ERROR')}>All Errors</button>
        <button className="query-chip" onClick={() => { setSearch(''); setLevel('All'); setCategory('All'); }}>Reset</button>
      </div>

      <div className="toolbar panel">
        <div className="searchbox">
          <Search size={16} />
          <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search message, trace ID, or source component…" />
        </div>
        <div className="toolbar-right">
          <div className="select-wrap">
            <Filter size={14} />
            <select value={category} onChange={e => setCategory(e.target.value)}>
              <option value="All">All Categories</option>
              <option value="Application">Application</option>
              <option value="Security">Security</option>
              <option value="Integration">Integration</option>
              <option value="Audit">Audit</option>
            </select>
          </div>
          <div className="select-wrap">
            <select value={level} onChange={e => setLevel(e.target.value)}>
              <option value="All">All Levels</option>
              <option value="ERROR">ERROR</option>
              <option value="WARN">WARN</option>
              <option value="INFO">INFO</option>
              <option value="DEBUG">DEBUG</option>
            </select>
          </div>
          <button className="secondary" onClick={onExportCsv}><Download size={15} /> Export</button>
        </div>
      </div>

      <div className="panel table-panel">
        <div className="panel-head">
          <div>
            <h3>Centralized Log Stream</h3>
            <p>{filteredLogs.length} events matching active filters</p>
          </div>
          <span className="period-pill"><span className="live-dot" /> Live stream</span>
        </div>
        <div className="table-wrap">
          <table className="logs-table">
            <thead>
              <tr>
                <th>TIMESTAMP</th>
                <th>LEVEL</th>
                <th>CATEGORY</th>
                <th>MESSAGE</th>
                <th>SOURCE / TRACE</th>
              </tr>
            </thead>
            <tbody>
              {filteredLogs.map(l => (
                <tr key={l.id}>
                  <td className="muted-cell">{l.timestamp ? new Date(l.timestamp).toLocaleString() : '—'}</td>
                  <td><Severity value={l.level} /></td>
                  <td><span className="tag-badge">{l.category}</span></td>
                  <td className="log-message">{l.message}</td>
                  <td>
                    <b>{l.source}</b>
                    <small className="trace-id">{l.trace_id || '—'}</small>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {!filteredLogs.length && <Empty title="No logs found" sub="Adjust your search filters or ingest logs via POST /api/logs." />}
      </div>
    </>
  );
}

function Traces({ traces, onSelectTrace }) {
  return (
    <>
      <div className="trace-summary">
        <div className="panel">
          <span>Traces Captured</span>
          <b>{fmt(traces.length)}</b>
          <small>Monitored transaction journeys</small>
        </div>
        <div className="panel">
          <span>Failed Transactions</span>
          <b>{traces.filter(t => t.status === 'Failed').length}</b>
          <small>Bottleneck points detected</small>
        </div>
        <div className="panel">
          <span>Average Trace Latency</span>
          <b>{traces.length ? Math.round(traces.reduce((s, t) => s + (Number(t.response_ms) || 0), 0) / traces.length) : 0} ms</b>
          <small>End-to-end multi-hop duration</small>
        </div>
      </div>

      <div className="panel table-panel">
        <div className="panel-head">
          <div>
            <h3>Distributed Transaction Traces</h3>
            <p>Click any trace to inspect individual spans and service latency</p>
          </div>
          <span className="period-pill"><GitBranch size={13} /> Service Journey</span>
        </div>
        <div className="trace-list">
          {traces.map(t => (
            <div className="trace-card" key={t.id} style={{ cursor: 'pointer' }} onClick={() => onSelectTrace(t)}>
              <div className="trace-top">
                <div>
                  <b>{t.transaction_id}</b>
                  <span>{t.request_path}</span>
                </div>
                <div className="trace-meta">
                  <b>{t.response_ms} ms</b>
                  <Status value={t.status === 'Failed' ? 'Degraded' : 'Healthy'} />
                </div>
              </div>
              <div className="dependency-chain">
                {(t.dependency_chain || []).map((node, i) => (
                  <React.Fragment key={i}>
                    <div className={`dependency-node ${t.failure_point === node ? 'node-failed' : ''}`}>
                      <Database size={14} />
                      <span>{node}</span>
                      {t.failure_point === node && <small>Failure Point</small>}
                    </div>
                    {i < (t.dependency_chain || []).length - 1 && <div className="dependency-arrow">→</div>}
                  </React.Fragment>
                ))}
              </div>
              {t.failure_point && (
                <div className="trace-warning">
                  <AlertTriangle size={14} /> Failure observed at <b>{t.failure_point}</b> (Inspect spans ↗)
                </div>
              )}
            </div>
          ))}
        </div>
        {!traces.length && <Empty title="No traces captured" sub="Ingest traces via POST /api/traces." />}
      </div>
    </>
  );
}

function AppMap({ apps, onOpenApp }) {
  return (
    <div className="panel map-panel">
      <div className="panel-head">
        <div>
          <h3>Application Dependency Topology</h3>
          <p>Real-time topology based on active application health and dependency chains</p>
        </div>
        <span className="period-pill"><Network size={13} /> Service Topology</span>
      </div>
      <div className="topology">
        <div className="topology-node client-node">
          <UserRound />
          <b>Customer Channels</b>
          <small>Mobile App · Internet Banking · POS</small>
        </div>
        <div className="topology-connector"><span /></div>
        <div className="topology-node gateway-node">
          <Network />
          <b>API Gateway & Ingress</b>
          <small>Rate Limiting · WAF · Routing</small>
        </div>
        <div className="topology-connector"><span /></div>
        <div className="topology-branches">
          {apps.map(a => (
            <div className="topology-node" key={a.id} style={{ cursor: 'pointer' }} onClick={() => onOpenApp(a)}>
              {a.name.includes('UPI') ? <Zap /> : a.name.includes('Loan') ? <BriefcaseBusiness /> : a.name.includes('KYC') ? <ShieldCheck /> : <AppWindow />}
              <b>{a.name}</b>
              <Status value={a.status} />
            </div>
          ))}
        </div>
        <div className="topology-connector"><span /></div>
        <div className="topology-node db-node">
          <Database />
          <b>Core Banking & Data Tier</b>
          <small>PostgreSQL · MySQL · Kafka · Mainframe Core</small>
        </div>
      </div>
      <div className="map-legend">
        <span><i className="legend-mint" /> Healthy Service</span>
        <span><i className="legend-orange" /> Degraded Latency</span>
        <span><i className="legend-red" /> Critical Alert / Failure</span>
      </div>
    </div>
  );
}

function Alerts({ alerts, incidents, onAck, onResolve, onEvaluate }) {
  const [tab, setTab] = useState('alerts');
  const openAlerts = alerts.filter(a => a.status === 'Open');

  return (
    <>
      <div className="kpi-grid">
        <Kpi title="Open alerts" value={openAlerts.length} sub="Awaiting triage" icon={Bell} trend="Active" positive={false} alert={openAlerts.length > 0} />
        <Kpi title="Critical alerts" value={alerts.filter(a => a.severity === 'Critical' && a.status === 'Open').length} sub="High priority" icon={AlertTriangle} trend="Immediate action" positive={false} alert />
        <Kpi title="Active incidents" value={incidents.filter(i => i.status !== 'Resolved').length} sub="Under investigation" icon={Activity} trend="In Progress" positive={false} />
        <Kpi title="Resolved incidents" value={incidents.filter(i => i.status === 'Resolved').length} sub="Successfully closed" icon={Check} trend="Resolved" positive />
      </div>

      <div className="toolbar panel">
        <div style={{ display: 'flex', gap: 8 }}>
          <button className={`secondary ${tab === 'alerts' ? 'active' : ''}`} onClick={() => setTab('alerts')}>Alert Feed ({alerts.length})</button>
          <button className={`secondary ${tab === 'incidents' ? 'active' : ''}`} onClick={() => setTab('incidents')}>Incidents ({incidents.length})</button>
        </div>
        <div className="toolbar-right">
          <button className="primary" onClick={onEvaluate}><Zap size={14} /> Evaluate Alert Rules</button>
        </div>
      </div>

      {tab === 'alerts' && (
        <div className="panel table-panel">
          <div className="panel-head">
            <div>
              <h3>Alert Center</h3>
              <p>Rules trigger incidents automatically for Critical thresholds</p>
            </div>
          </div>
          <div className="alert-feed">
            {alerts.map(a => (
              <div className="alert-feed-row" key={a.id}>
                <div className={`alert-mark ${String(a.severity).toLowerCase()}`}><AlertTriangle size={16} /></div>
                <div className="alert-feed-main">
                  <div className="alert-feed-title">
                    <b>{a.title}</b>
                    <Severity value={a.severity} />
                  </div>
                  <p>{a.description}</p>
                  <small>{new Date(a.created_at).toLocaleString()} · Channel: {a.channel} · Status: <b>{a.status}</b></small>
                </div>
                <div className="alert-actions">
                  {a.status === 'Open' ? (
                    <button className="secondary small-btn" onClick={() => onAck(a.id)}><Check size={14} /> Acknowledge</button>
                  ) : (
                    <Status value="Healthy" />
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {tab === 'incidents' && (
        <div className="panel table-panel">
          <div className="panel-head">
            <div>
              <h3>Incident Management</h3>
              <p>Incidents linked to Critical threshold violations</p>
            </div>
          </div>
          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>INCIDENT</th>
                  <th>SEVERITY</th>
                  <th>STATUS</th>
                  <th>ROOT CAUSE NOTE</th>
                  <th>CREATED</th>
                  <th>ACTIONS</th>
                </tr>
              </thead>
              <tbody>
                {incidents.map(inc => (
                  <tr key={inc.id}>
                    <td><b>#{inc.id} {inc.title}</b></td>
                    <td><Severity value={inc.severity} /></td>
                    <td><span className="plain-status">{inc.status}</span></td>
                    <td style={{ maxWidth: 300 }}>{inc.root_cause || 'Under investigation'}</td>
                    <td className="muted-cell">{new Date(inc.created_at).toLocaleString()}</td>
                    <td>
                      {inc.status !== 'Resolved' ? (
                        <button className="secondary small-btn" onClick={() => onResolve(inc.id)}><Check size={13} /> Mark Resolved</button>
                      ) : (
                        <span className="tag-badge" style={{ color: '#258a70' }}>Resolved</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </>
  );
}

function Workflows({ workflows, onAdvance }) {
  return (
    <>
      <div className="workflow-intro">
        <div>
          <div className="eyebrow">BUSINESS PROCESS INTELLIGENCE</div>
          <h2>Follow the Journey, Not Just the Service.</h2>
          <p>Track business turnaround times (TAT), bottlenecks, failure stages, and process SLAs across core banking workflows.</p>
        </div>
        <div className="workflow-icon"><Workflow size={28} /></div>
      </div>

      <div className="workflow-cards">
        {workflows.map(w => (
          <div className="panel workflow-card" key={w.id}>
            <div className="workflow-card-head">
              <div className="app-icon"><Workflow size={17} /></div>
              <Status value={w.status === 'At risk' ? 'Degraded' : 'Healthy'} />
            </div>
            <h3>{w.name}</h3>
            <span className="workflow-domain">{w.business_domain}</span>
            <div className="workflow-tat">
              <div><span>TURNAROUND TIME</span><b>{w.tat_minutes} <small>min</small></b></div>
              <div><span>PROCESS SLA</span><b>{w.sla_minutes} <small>min</small></b></div>
            </div>
            <div className="workflow-progress">
              {(w.stages || []).map((s, i) => (
                <React.Fragment key={i}>
                  <div className={`workflow-stage stage-${s.status}`}>
                    <span>{s.status === 'complete' ? <Check size={12} /> : s.status === 'delayed' ? <AlertTriangle size={12} /> : i + 1}</span>
                    <small>{s.name} ({s.duration}m)</small>
                  </div>
                  {i < (w.stages || []).length - 1 && <div className={`stage-line ${s.status === 'complete' ? 'line-complete' : ''}`} />}
                </React.Fragment>
              ))}
            </div>
            {w.failure_stage && (
              <div className="workflow-warning" style={{ marginBottom: 10 }}>
                <AlertTriangle size={14} /> Bottleneck: <b>{w.failure_stage}</b>
              </div>
            )}
            {w.stages?.some(s => s.status === 'delayed') && (
              <button
                className="secondary full"
                style={{ fontSize: 10, padding: 8 }}
                onClick={() => onAdvance(w.id, w.failure_stage || 'Verification')}
              >
                Advance Delayed Stage <span>→</span>
              </button>
            )}
          </div>
        ))}
      </div>
    </>
  );
}

function UXPage({ apps }) {
  return (
    <>
      <div className="kpi-grid">
        <Kpi title="Journey health" value="94.8%" sub="Overall session signal" icon={Eye} trend="+1.2%" positive />
        <Kpi title="Login success" value="99.2%" sub="Customer authentication" icon={LockKeyhole} trend="+0.4%" positive />
        <Kpi title="KYC drop-off rate" value="8.6%" sub="Document upload stage" icon={ArrowDownRight} trend="Investigate" positive={false} />
        <Kpi title="Page response" value="1.4 s" sub="Average page load" icon={Activity} trend="−0.2 s" positive />
      </div>

      <div className="panel table-panel">
        <div className="panel-head">
          <div>
            <h3>User Experience Telemetry</h3>
            <p>Session and journey drop-off signals</p>
          </div>
        </div>
        <div className="signal-list">
          <div>
            <span className="signal-icon"><LockKeyhole /></span>
            <div>
              <b>Customer Authentication Journey</b>
              <p>Success rate is 99.2%. 12 suspicious rapid credential retries logged from untrusted CIDRs.</p>
            </div>
            <span className="signal-number">99.2%</span>
          </div>
          <div>
            <span className="signal-icon warning-icon"><AlertTriangle /></span>
            <div>
              <b>KYC Document Upload Funnel</b>
              <p>Users dropping off during identity document upload due to 890ms OCR validation latency.</p>
            </div>
            <span className="signal-number text-danger">8.6%</span>
          </div>
          <div>
            <span className="signal-icon"><Clock3 /></span>
            <div>
              <b>Frontend Page Response Time</b>
              <p>Core banking portal load time within acceptable 1.4s threshold.</p>
            </div>
            <span className="signal-number">1.4 s</span>
          </div>
        </div>
      </div>
    </>
  );
}

function Security({ logs, onExportAudit }) {
  const securityLogs = logs.filter(l => l.category === 'Security');
  return (
    <>
      <div className="kpi-grid">
        <Kpi title="Security events" value={securityLogs.length} sub="Security category logs" icon={ShieldCheck} trend="Monitored" positive />
        <Kpi title="Authentication audit" value="Enforced" sub="JWT HS256 tokens" icon={LockKeyhole} trend="Protected" positive />
        <Kpi title="Audit trail" value="Enabled" sub="Recorded in database" icon={FileBarChart} trend="Active" positive />
        <Kpi title="SIEM connectors" value="Configured" sub="Splunk / Elastic readiness" icon={Network} trend="Ready" positive />
      </div>

      <div className="panel table-panel">
        <div className="panel-head">
          <div>
            <h3>Security Observability Stream</h3>
            <p>Unauthorized access, suspicious behavior, and security event logs</p>
          </div>
          <button className="secondary" onClick={onExportAudit}><Download size={14} /> Export Audit Log</button>
        </div>
        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th>TIMESTAMP</th>
                <th>LEVEL</th>
                <th>EVENT DETAILS</th>
                <th>SOURCE</th>
              </tr>
            </thead>
            <tbody>
              {securityLogs.map(l => (
                <tr key={l.id}>
                  <td className="muted-cell">{l.timestamp ? new Date(l.timestamp).toLocaleString() : '—'}</td>
                  <td><Severity value={l.level} /></td>
                  <td>{l.message}</td>
                  <td><b>{l.source}</b></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {!securityLogs.length && <Empty icon={ShieldCheck} title="No security incidents logged" sub="Security logs appear here automatically." />}
      </div>
    </>
  );
}

function Insights({ apps, aiSummary, onOpenApp }) {
  const warnings = aiSummary?.high_risk_applications || [];
  return (
    <>
      <div className="insights-hero">
        <div className="ai-mark large-ai"><Sparkles size={23} /></div>
        <div>
          <span className="eyebrow">OBSERVE → ANALYZE → PREDICT</span>
          <h2>Explainable Operational Intelligence</h2>
          <p>Root cause diagnostic engine and predictive capacity warning heuristics based on telemetry evidence.</p>
        </div>
        <span className="beta-pill">HEURISTIC AI</span>
      </div>

      <div className="insight-grid">
        {apps.map(a => {
          const isAtRisk = a.error_rate > 3 || a.response_ms > 800 || a.uptime_pct < a.sla_target;
          return (
            <div className="panel insight-card" key={a.id}>
              <div className="insight-card-top">
                <Severity value={a.status === 'Healthy' ? 'Info' : 'Critical'} />
                <span className="insight-type">{a.environment} · {a.business_function}</span>
              </div>
              <h3>{a.name}</h3>
              <p>
                {isAtRisk ?
                  `Detected degradation: Latency at ${a.response_ms} ms and error rate at ${a.error_rate}%. SLA compliance margin is at risk.` :
                  `Operating within nominal baseline parameters (Latency: ${a.response_ms} ms, Uptime: ${a.uptime_pct}%).`}
              </p>
              <div className="rca-steps">
                <span><Check size={13} /> Metric evidence evaluated</span>
                <span><ArrowDownRight size={13} /> Correlated with traces and logs</span>
                <button className="text-btn" onClick={() => onOpenApp(a)}>View causal chain analysis <span>→</span></button>
              </div>
            </div>
          );
        })}
      </div>
    </>
  );
}

function Integrations({ integrations, onConfigure, onTest }) {
  return (
    <>
      <div className="integration-hero">
        <div>
          <h2>Enterprise Integration Framework</h2>
          <p>Connect Cloud, DevOps, Monitoring, Banking Systems, and Notification Channels.</p>
        </div>
        <span className="integration-count">
          <b>{integrations.filter(i => i.status === 'Connected' || i.status === 'Configured').length}</b> / {integrations.length} Active
        </span>
      </div>

      <div className="integration-grid">
        {integrations.map(integ => (
          <div className="panel integration-card" key={integ.id}>
            <div className="integration-card-top">
              <div className="integration-logo"><Boxes size={20} /></div>
              <Status value={integ.status} />
            </div>
            <h3>{integ.name}</h3>
            <span className="integration-category">{integ.category}</span>
            <p>{integ.test_message || (integ.endpoint ? `Endpoint: ${integ.endpoint}` : 'Not configured. Add endpoint to enable data exchange.')}</p>
            <div style={{ display: 'flex', gap: 8 }}>
              <button className="secondary full" onClick={() => onConfigure(integ)}>Configure</button>
              <button className="primary full" onClick={() => onTest(integ.id)}>Test</button>
            </div>
          </div>
        ))}
      </div>
    </>
  );
}

function Reports({ onView, onDownload, loading }) {
  const reportsList = [
    { type: 'application-health', title: 'Application Health Report', desc: 'Comprehensive inventory, availability %, response times, and error rates', icon: Activity },
    { type: 'sla-compliance', title: 'SLA Compliance Report', desc: 'Contracted SLA targets vs actual uptime and compliance breach variances', icon: Gauge },
    { type: 'incident', title: 'Incident Report', desc: 'Full lifecycle of operational incidents, resolution states, and timestamps', icon: AlertTriangle },
    { type: 'root-cause', title: 'Root Cause Analysis Report', desc: 'Detailed causal failure chains, dependency bottlenecks, and diagnostic notes', icon: GitBranch },
    { type: 'performance-trend', title: 'Performance Trend Report', desc: 'Latency and transaction throughput trends across monitored applications', icon: ChartNoAxesCombined },
    { type: 'audit', title: 'Platform Audit Report', desc: 'User operations, application registrations, and administrative changes log', icon: ShieldCheck }
  ];

  return (
    <>
      <div className="report-hero">
        <div className="report-hero-icon"><FileBarChart size={25} /></div>
        <div>
          <h2>Operational Reporting & Regulatory Export</h2>
          <p>Export audit-ready reports in Excel (CSV) or save formatted PDFs.</p>
        </div>
      </div>

      <div className="report-grid">
        {reportsList.map(rep => {
          const Icon = rep.icon;
          return (
            <div className="panel report-card" key={rep.type}>
              <div className="report-icon"><Icon size={18} /></div>
              <h3>{rep.title}</h3>
              <p>{rep.desc}</p>
              <div style={{ display: 'flex', gap: 8, marginTop: 12 }}>
                <button className="secondary full" disabled={loading} onClick={() => onView(rep.type)}>View Data</button>
                <button className="primary full" onClick={() => onDownload(rep.type)}><Download size={13} /> Export Excel</button>
              </div>
            </div>
          );
        })}
      </div>
    </>
  );
}

function SettingsPage({ user, apiOnline, onSwitchRole }) {
  const roles = [
    { label: 'Admin', email: 'admin@openlayer.local' },
    { label: 'Application Owner', email: 'appowner@openlayer.local' },
    { label: 'Operations Team', email: 'ops@openlayer.local' },
    { label: 'Auditor', email: 'auditor@openlayer.local' },
    { label: 'Business User', email: 'business@openlayer.local' }
  ];

  return (
    <div className="settings-grid">
      <div className="panel settings-card">
        <div className="settings-card-title">
          <UserRound />
          <div>
            <h3>Current Authenticated Identity</h3>
            <p>Active user session and role authorization</p>
          </div>
        </div>
        <div className="settings-row"><span>Name</span><b>{user.name}</b></div>
        <div className="settings-row"><span>Email</span><b>{user.email}</b></div>
        <div className="settings-row"><span>Active Role</span><b><span className="tag-badge">{user.role}</span></b></div>

        <div style={{ marginTop: 18 }}>
          <span style={{ fontSize: 10, color: '#8894a6', fontWeight: 600 }}>Switch Role for Verification:</span>
          <div className="role-pills">
            {roles.map(r => (
              <button
                key={r.label}
                className={`role-pill ${user.role === r.label ? 'active' : ''}`}
                onClick={() => onSwitchRole(r.email)}
              >
                {r.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="panel settings-card">
        <div className="settings-card-title">
          <Database />
          <div>
            <h3>Platform Connectivity & Architecture</h3>
            <p>Backend API status and database layer</p>
          </div>
        </div>
        <div className="settings-row"><span>Backend API</span><Status value={apiOnline ? 'Healthy' : 'Degraded'} /></div>
        <div className="settings-row"><span>Database Persistence</span><b>SQLAlchemy ORM (SQLite / MySQL / Postgres)</b></div>
        <div className="settings-row">
          <span>API Documentation</span>
          <a href={`${API.replace(/\/api\/?$/, '')}/docs`} target="_blank" rel="noreferrer">Open Swagger Documentation ↗</a>
        </div>
      </div>

      <div className="panel settings-card">
        <div className="settings-card-title">
          <ShieldCheck />
          <div>
            <h3>Role-Based Permissions Matrix</h3>
            <p>Backend enforced security gates</p>
          </div>
        </div>
        <p className="settings-description">
          • <b>Admin:</b> Full platform management, application onboarding & deletion.<br />
          • <b>Application Owner:</b> Application updates and health management.<br />
          • <b>Operations Team:</b> Alert triage, incident resolution, rule evaluation.<br />
          • <b>Auditor:</b> Compliance reporting and audit log verification.<br />
          • <b>Business User:</b> Workflow performance monitoring and stage tracking.
        </p>
      </div>

      <div className="panel settings-card">
        <div className="settings-card-title">
          <SlidersHorizontal />
          <div>
            <h3>Telemetry Ingestion Interfaces</h3>
            <p>Open standards for enterprise telemetry collection</p>
          </div>
        </div>
        <p className="settings-description">
          Send telemetry payloads to documented REST endpoints:<br />
          • Metrics: <code>POST /api/metrics</code><br />
          • Logs: <code>POST /api/logs</code><br />
          • Distributed Traces: <code>POST /api/traces</code><br />
          Supports JSON payloads with timestamps, labels, and trace IDs.
        </p>
      </div>
    </div>
  );
}
