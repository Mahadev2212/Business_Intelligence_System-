import React, { useState, useEffect } from 'react';

// ─── Mock security log generator ─────────────────────────────────────────────
const SEVERITY = ['critical','high','medium','low','info'];
const EVENT_TYPES = [
  'Failed Login Attempt',
  'Unauthorized API Access',
  'Suspicious IP Detected',
  'Token Expired',
  'Data Export Triggered',
  'Privilege Escalation Attempt',
  'Brute Force Detected',
  'New Device Login',
  'Password Reset',
  'Role Change',
];
const USERS = ['admin','jsmith','alice.wu','m.patel','r.jones','service-bot'];
const IPS = ['192.168.1.45','10.0.0.23','203.0.113.14','198.51.100.7','172.16.0.88'];

const randomItem = arr => arr[Math.floor(Math.random() * arr.length)];
const randomDate = () => {
  const now = new Date();
  now.setMinutes(now.getMinutes() - Math.floor(Math.random() * 10000));
  return now.toISOString().replace('T',' ').slice(0,19);
};

const generateLogs = (n = 50) =>
  Array.from({ length: n }, (_, i) => ({
    id:         `LOG-${String(10000 + i).padStart(5,'0')}`,
    timestamp:  randomDate(),
    event:      randomItem(EVENT_TYPES),
    severity:   randomItem(SEVERITY),
    user:       randomItem(USERS),
    ip:         randomItem(IPS),
    status:     Math.random() > 0.3 ? 'resolved' : 'open',
    details:    `Event triggered on resource /api/${randomItem(['users','data','admin','export'])}`,
  })).sort((a,b) => b.timestamp.localeCompare(a.timestamp));

// ─── Severity badge ───────────────────────────────────────────────────────────
const SeverityBadge = ({ level }) => (
  <span className={`severity-badge severity-${level}`}>{level.toUpperCase()}</span>
);

const StatusBadge = ({ status }) => (
  <span className={`status-badge status-${status}`}>{status}</span>
);

// ─── SecurityLogs Page ────────────────────────────────────────────────────────
export default function SecurityLogs() {
  const [logs, setLogs] = useState([]);
  const [filtered, setFiltered] = useState([]);
  const [search, setSearch] = useState('');
  const [severityFilter, setSeverityFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  const [selectedLog, setSelectedLog] = useState(null);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const PAGE_SIZE = 15;

  useEffect(() => {
    setTimeout(() => {
      const data = generateLogs(120);
      setLogs(data);
      setFiltered(data);
      setLoading(false);
    }, 400);
  }, []);

  useEffect(() => {
    let result = logs;
    if (search)          result = result.filter(l =>
      l.event.toLowerCase().includes(search.toLowerCase()) ||
      l.user.toLowerCase().includes(search.toLowerCase()) ||
      l.ip.includes(search)
    );
    if (severityFilter !== 'all') result = result.filter(l => l.severity === severityFilter);
    if (statusFilter   !== 'all') result = result.filter(l => l.status   === statusFilter);
    setFiltered(result);
    setPage(1);
  }, [search, severityFilter, statusFilter, logs]);

  const paginated = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);
  const totalPages = Math.ceil(filtered.length / PAGE_SIZE);

  const stats = {
    critical: logs.filter(l => l.severity === 'critical').length,
    high:     logs.filter(l => l.severity === 'high').length,
    open:     logs.filter(l => l.status   === 'open').length,
    total:    logs.length,
  };

  if (loading) {
    return (
      <div className="loading-screen">
        <div className="spinner" />
        <p>Loading security logs…</p>
      </div>
    );
  }

  return (
    <div className="security-logs-page">
      {/* Header */}
      <div className="page-header">
        <div>
          <h1 className="page-title">🔐 Security Logs</h1>
          <p className="page-subtitle">Audit trail, threat monitoring &amp; access control events</p>
        </div>
        <button className="btn-primary" id="btn-refresh-logs"
          onClick={() => { const d = generateLogs(120); setLogs(d); setFiltered(d); }}>
          ↻ Refresh
        </button>
      </div>

      {/* Stats strip */}
      <div className="stat-strip">
        <div className="stat-item">
          <span className="stat-val danger">{stats.critical}</span>
          <span className="stat-lbl">Critical Events</span>
        </div>
        <div className="stat-item">
          <span className="stat-val warn">{stats.high}</span>
          <span className="stat-lbl">High Severity</span>
        </div>
        <div className="stat-item">
          <span className="stat-val info">{stats.open}</span>
          <span className="stat-lbl">Open Issues</span>
        </div>
        <div className="stat-item">
          <span className="stat-val">{stats.total}</span>
          <span className="stat-lbl">Total Logs</span>
        </div>
      </div>

      {/* Filters */}
      <div className="filter-bar">
        <input
          id="search-logs"
          className="search-input"
          type="text"
          placeholder="Search by event, user, or IP…"
          value={search}
          onChange={e => setSearch(e.target.value)}
        />
        <select id="filter-severity" className="filter-select" value={severityFilter}
          onChange={e => setSeverityFilter(e.target.value)}>
          <option value="all">All Severities</option>
          {SEVERITY.map(s => <option key={s} value={s}>{s.charAt(0).toUpperCase()+s.slice(1)}</option>)}
        </select>
        <select id="filter-status" className="filter-select" value={statusFilter}
          onChange={e => setStatusFilter(e.target.value)}>
          <option value="all">All Statuses</option>
          <option value="open">Open</option>
          <option value="resolved">Resolved</option>
        </select>
        <span className="result-count">{filtered.length} results</span>
      </div>

      {/* Table */}
      <div className="table-wrapper">
        <table className="log-table">
          <thead>
            <tr>
              <th>ID</th>
              <th>Timestamp</th>
              <th>Event</th>
              <th>Severity</th>
              <th>User</th>
              <th>IP Address</th>
              <th>Status</th>
            </tr>
          </thead>
          <tbody>
            {paginated.map(log => (
              <tr key={log.id} className="log-row" onClick={() => setSelectedLog(log)}>
                <td className="log-id">{log.id}</td>
                <td className="log-ts">{log.timestamp}</td>
                <td>{log.event}</td>
                <td><SeverityBadge level={log.severity} /></td>
                <td>{log.user}</td>
                <td className="monospace">{log.ip}</td>
                <td><StatusBadge status={log.status} /></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      <div className="pagination">
        <button id="btn-prev-page" className="page-btn" disabled={page === 1}
          onClick={() => setPage(p => p - 1)}>← Prev</button>
        <span className="page-info">Page {page} of {totalPages}</span>
        <button id="btn-next-page" className="page-btn" disabled={page === totalPages}
          onClick={() => setPage(p => p + 1)}>Next →</button>
      </div>

      {/* Log Detail Modal */}
      {selectedLog && (
        <div className="modal-overlay" onClick={() => setSelectedLog(null)}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h3>Log Details — {selectedLog.id}</h3>
              <button className="modal-close" id="btn-close-modal"
                onClick={() => setSelectedLog(null)}>✕</button>
            </div>
            <div className="modal-body">
              {Object.entries(selectedLog).map(([k, v]) => (
                <div key={k} className="modal-row">
                  <span className="modal-key">{k.charAt(0).toUpperCase()+k.slice(1)}</span>
                  <span className="modal-val">{v}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
