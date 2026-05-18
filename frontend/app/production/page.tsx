'use client';
import { useEffect, useState } from 'react';
import { DailyProductionChart, EmployeeOutputChart } from '@/components/Charts';

function StatusBadge({ s }: { s: string }) {
  const map: Record<string, string> = { Completed: 'badge-success', Pending: 'badge-warning', Delayed: 'badge-danger' };
  return <span className={`badge ${map[s] ?? 'badge-primary'}`}>{s}</span>;
}

function KPICard({ label, value, icon, sub, color, bg }: any) {
  return (
    <div className="kpi-card" style={{ '--kpi-color': color, '--kpi-bg': bg } as any}>
      <div className="kpi-header"><div className="kpi-label">{label}</div><div className="kpi-icon">{icon}</div></div>
      <div className="kpi-value">{value}</div>
      <div className="kpi-meta"><span className="kpi-meta-text">{sub}</span></div>
    </div>
  );
}

export default function ProductionPage() {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [filter, setFilter] = useState('All');

  useEffect(() => {
    fetch('/api/production')
      .then(r => r.json())
      .then(d => { setData(d); setLoading(false); })
      .catch(() => { setError('Failed to load data'); setLoading(false); });
  }, []);

  if (loading) return <div style={{ textAlign:'center', padding:80, color:'var(--text-muted)' }}>⚡ Loading production data from Oracle DB…</div>;
  if (error || data?.error) return <div className="alert-card danger">{error || data.error}</div>;

  const completed   = data.statusCounts?.find((s:any) => s.STATUS === 'Completed')?.COUNT ?? 0;
  const pending     = data.statusCounts?.find((s:any) => s.STATUS === 'Pending')?.COUNT   ?? 0;
  const delayed     = data.statusCounts?.find((s:any) => s.STATUS === 'Delayed')?.COUNT   ?? 0;
  const totalPlanned = data.schedule?.reduce((a:number,r:any) => a + Number(r.PLANNED_QTY), 0) ?? 0;
  const totalActual  = data.schedule?.reduce((a:number,r:any) => a + Number(r.ACTUAL_QTY), 0)  ?? 0;
  const efficiency   = totalPlanned > 0 ? ((totalActual / totalPlanned) * 100).toFixed(1) : '0';

  const filteredSchedule = filter === 'All' ? data.schedule : data.schedule?.filter((r:any) => r.STATUS === filter);

  return (
    <div>
      {/* KPI Row */}
      <div className="kpi-grid">
        <KPICard label="Completed Runs"   value={completed}      icon="✅" sub="production runs"          color="#10b981" bg="rgba(16,185,129,0.12)" />
        <KPICard label="Pending Runs"     value={pending}        icon="⏳" sub="awaiting execution"       color="#f59e0b" bg="rgba(245,158,11,0.12)" />
        <KPICard label="Delayed Runs"     value={delayed}        icon="🚨" sub="need attention"           color="#ef4444" bg="rgba(239,68,68,0.12)" />
        <KPICard label="Overall Efficiency" value={`${efficiency}%`} icon="📊" sub="actual vs planned"   color="#8b5cf6" bg="rgba(139,92,246,0.12)" />
      </div>

      {/* Charts Row */}
      <div className="chart-grid chart-grid-2" style={{ marginBottom: 16 }}>
        <div className="chart-card">
          <div className="chart-header">
            <div><div className="chart-title">Daily Production Output</div><div className="chart-subtitle">Actual vs planned by date</div></div>
          </div>
          <DailyProductionChart data={data.dailyOutput} />
        </div>
        <div className="chart-card">
          <div className="chart-header">
            <div><div className="chart-title">Machine Utilization (Employee Output)</div><div className="chart-subtitle">Total units produced per operator</div></div>
          </div>
          <EmployeeOutputChart data={data.employeeOutput} />
        </div>
      </div>

      {/* Product Breakdown */}
      <div className="chart-card" style={{ marginBottom: 16 }}>
        <div className="chart-header">
          <div className="chart-title">Product-wise Production Breakdown</div>
        </div>
        <table className="data-table">
          <thead>
            <tr><th>Product</th><th>Total Planned</th><th>Total Produced</th><th>Efficiency</th><th>Progress</th></tr>
          </thead>
          <tbody>
            {data.productBreakdown?.map((p:any, i:number) => {
              const pct = p.TOTAL_PLANNED > 0 ? Math.min(100, Math.round((p.TOTAL_PRODUCED / p.TOTAL_PLANNED) * 100)) : 0;
              return (
                <tr key={i}>
                  <td style={{ fontWeight:600, color:'var(--text-primary)' }}>{p.PRODUCT_NAME}</td>
                  <td>{Number(p.TOTAL_PLANNED).toLocaleString()}</td>
                  <td>{Number(p.TOTAL_PRODUCED).toLocaleString()}</td>
                  <td><span className={`badge ${pct >= 90 ? 'badge-success' : pct >= 70 ? 'badge-warning' : 'badge-danger'}`}>{pct}%</span></td>
                  <td style={{ width:160 }}>
                    <div className="progress-wrap">
                      <div className="progress-fill" style={{ width:`${pct}%`, background: pct>=90?'var(--success)':pct>=70?'var(--warning)':'var(--danger)' }} />
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Production Schedule */}
      <div className="table-card">
        <div className="table-header">
          <div className="table-title">📋 Production Schedule</div>
          <div className="filters-bar" style={{ margin:0 }}>
            {['All','Completed','Pending','Delayed'].map(f => (
              <button key={f} onClick={() => setFilter(f)}
                className={`btn ${filter === f ? 'btn-primary' : 'btn-ghost'} btn-sm`}>{f}</button>
            ))}
          </div>
        </div>
        <div style={{ overflowX:'auto' }}>
          <table className="data-table">
            <thead>
              <tr><th>#</th><th>Product</th><th>Employee</th><th>Machine</th><th>Shift</th><th>Date</th><th>Planned</th><th>Actual</th><th>Efficiency</th><th>Status</th></tr>
            </thead>
            <tbody>
              {filteredSchedule?.map((r:any, i:number) => (
                <tr key={i}>
                  <td style={{ color:'var(--text-muted)' }}>#{r.PRODUCTION_ID}</td>
                  <td style={{ fontWeight:600, color:'var(--text-primary)' }}>{r.PRODUCT_NAME}</td>
                  <td>{r.EMPLOYEE_NAME}</td>
                  <td><code style={{ fontSize:'0.75rem', background:'var(--bg-input)', padding:'2px 6px', borderRadius:4 }}>{r.MACHINE_ID}</code></td>
                  <td>{r.SHIFT}</td>
                  <td style={{ color:'var(--text-muted)', fontSize:'0.8rem' }}>{String(r.PRODUCTION_DATE).split('T')[0]}</td>
                  <td>{Number(r.PLANNED_QTY).toLocaleString()}</td>
                  <td style={{ fontWeight:600 }}>{Number(r.ACTUAL_QTY).toLocaleString()}</td>
                  <td><span style={{ color: Number(r.EFFICIENCY_PCT) >= 90 ? 'var(--success)' : Number(r.EFFICIENCY_PCT) >= 70 ? 'var(--warning)' : 'var(--danger)', fontWeight:600 }}>{r.EFFICIENCY_PCT}%</span></td>
                  <td><StatusBadge s={r.STATUS} /></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
