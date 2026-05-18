'use client';
import { useEffect, useState } from 'react';
import { DeptPerformanceChart, ShiftPie } from '@/components/Charts';

function KPICard({ label, value, icon, sub, color, bg }: any) {
  return (
    <div className="kpi-card" style={{ '--kpi-color': color, '--kpi-bg': bg } as any}>
      <div className="kpi-header"><div className="kpi-label">{label}</div><div className="kpi-icon">{icon}</div></div>
      <div className="kpi-value">{value}</div>
      <div className="kpi-meta"><span className="kpi-meta-text">{sub}</span></div>
    </div>
  );
}

export default function EmployeesPage() {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/employees').then(r => r.json()).then(d => { setData(d); setLoading(false); });
  }, []);

  if (loading) return <div style={{ textAlign: 'center', padding: 80, color: 'var(--text-muted)' }}>⚡ Loading employee data from Oracle DB…</div>;
  if (data?.error) return <div className="alert-card danger">{data.error}</div>;

  const totalEmployees = data.employees?.length ?? 0;
  const activeEmployees = data.employees?.filter((e: any) => e.STATUS === 'Active').length ?? 0;
  const avgEfficiency = data.employees?.reduce((a: number, e: any) => a + Number(e.AVG_EFFICIENCY), 0) / (data.employees?.length || 1);

  return (
    <div>
      <div className="kpi-grid">
        <KPICard label="Total Workforce" value={totalEmployees} icon="👨‍🏭" sub="registered staff" color="#3b82f6" bg="rgba(59,130,246,0.12)" />
        <KPICard label="Active Staff" value={activeEmployees} icon="✅" sub="currently on duty" color="#10b981" bg="rgba(16,185,129,0.12)" />
        <KPICard label="Avg Efficiency" value={`${avgEfficiency.toFixed(1)}%`} icon="📈" sub="across all shifts" color="#f59e0b" bg="rgba(245,158,11,0.12)" />
        <KPICard label="Departments" value={data.deptPerformance?.length ?? 0} icon="🏢" sub="active units" color="#8b5cf6" bg="rgba(139,92,246,0.12)" />
      </div>

      <div className="chart-grid chart-grid-2" style={{ marginBottom: 16 }}>
        <div className="chart-card">
          <div className="chart-header">
            <div><div className="chart-title">Department Performance</div><div className="chart-subtitle">Output vs efficiency per department</div></div>
          </div>
          <DeptPerformanceChart data={data.deptPerformance} />
        </div>
        <div className="chart-card">
          <div className="chart-header">
            <div><div className="chart-title">Shift Distribution</div><div className="chart-subtitle">Headcount by shift</div></div>
          </div>
          <ShiftPie data={data.shiftDistribution} />
        </div>
      </div>

      <div className="chart-card" style={{ marginBottom: 16 }}>
        <div className="chart-header">
          <div className="chart-title">🏆 Top Performers (Production Output)</div>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: 12 }}>
          {data.topProducers?.map((e: any, i: number) => (
            <div key={i} className="kpi-card" style={{ padding: 16 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 12 }}>
                <span className={`rank-badge rank-${i + 1}`}>{i + 1}</span>
                <div style={{ fontWeight: 700 }}>{e.NAME}</div>
              </div>
              <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginBottom: 8 }}>{e.DEPARTMENT}</div>
              <div style={{ fontSize: '1.2rem', fontWeight: 800 }}>{Number(e.TOTAL_OUTPUT).toLocaleString()} units</div>
              <div style={{ fontSize: '0.75rem', color: 'var(--success)', fontWeight: 600 }}>{e.EFFICIENCY}% Efficiency</div>
            </div>
          ))}
        </div>
      </div>

      <div className="table-card">
        <div className="table-header">
          <div className="table-title">Workforce Directory</div>
        </div>
        <div style={{ overflowX: 'auto' }}>
          <table className="data-table">
            <thead>
              <tr><th>Employee</th><th>Department</th><th>Role</th><th>Shift</th><th>Output</th><th>Efficiency</th><th>Status</th></tr>
            </thead>
            <tbody>
              {data.employees?.map((e: any, i: number) => (
                <tr key={i}>
                  <td style={{ fontWeight: 600, color: 'var(--text-primary)' }}>{e.NAME}</td>
                  <td>{e.DEPARTMENT}</td>
                  <td>{e.ROLE}</td>
                  <td>{e.SHIFT}</td>
                  <td style={{ fontWeight: 600 }}>{Number(e.TOTAL_OUTPUT).toLocaleString()}</td>
                  <td>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <div className="progress-wrap" style={{ flex: 1 }}>
                        <div className="progress-fill" style={{ width: `${e.AVG_EFFICIENCY}%`, background: e.AVG_EFFICIENCY >= 90 ? 'var(--success)' : e.AVG_EFFICIENCY >= 70 ? 'var(--warning)' : 'var(--danger)' }} />
                      </div>
                      <span style={{ fontSize: '0.8rem', minWidth: 36 }}>{e.AVG_EFFICIENCY}%</span>
                    </div>
                  </td>
                  <td><span className={`badge ${e.STATUS === 'Active' ? 'badge-success' : 'badge-danger'}`}>{e.STATUS}</span></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
