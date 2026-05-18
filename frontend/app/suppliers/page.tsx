'use client';
import { useEffect, useState } from 'react';
import { DeliveryRateChart } from '@/components/Charts';

function KPICard({ label, value, icon, sub, color, bg }: any) {
  return (
    <div className="kpi-card" style={{ '--kpi-color': color, '--kpi-bg': bg } as any}>
      <div className="kpi-header"><div className="kpi-label">{label}</div><div className="kpi-icon">{icon}</div></div>
      <div className="kpi-value">{value}</div>
      <div className="kpi-meta"><span className="kpi-meta-text">{sub}</span></div>
    </div>
  );
}

function fmt(n: number) {
  if (n >= 10000000) return `₹${(n / 10000000).toFixed(2)}Cr`;
  if (n >= 100000)   return `₹${(n / 100000).toFixed(2)}L`;
  return `₹${n.toLocaleString('en-IN')}`;
}

export default function SuppliersPage() {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/suppliers').then(r => r.json()).then(d => { setData(d); setLoading(false); });
  }, []);

  if (loading) return <div style={{ textAlign: 'center', padding: 80, color: 'var(--text-muted)' }}>⚡ Loading supplier data from Oracle DB…</div>;
  if (data?.error) return <div className="alert-card danger">{data.error}</div>;

  const activeSuppliers = data.suppliers?.filter((s: any) => s.STATUS === 'Active').length ?? 0;
  const avgRating = data.suppliers?.reduce((a: number, s: any) => a + Number(s.RATING), 0) / (data.suppliers?.length || 1);
  const totalStockValue = data.suppliers?.reduce((a: number, s: any) => a + Number(s.TOTAL_STOCK_VALUE), 0) ?? 0;

  return (
    <div>
      <div className="kpi-grid">
        <KPICard label="Total Suppliers" value={data.suppliers?.length ?? 0} icon="🏭" sub="registered partners" color="#3b82f6" bg="rgba(59,130,246,0.12)" />
        <KPICard label="Active Partners" value={activeSuppliers} icon="✅" sub="currently supplying" color="#10b981" bg="rgba(16,185,129,0.12)" />
        <KPICard label="Avg Rating" value={avgRating.toFixed(1)} icon="⭐" sub="supplier quality" color="#f59e0b" bg="rgba(245,158,11,0.12)" />
        <KPICard label="Stock Value" value={fmt(totalStockValue)} icon="💰" sub="raw material value" color="#8b5cf6" bg="rgba(139,92,246,0.12)" />
      </div>

      <div className="chart-grid chart-grid-2" style={{ marginBottom: 16 }}>
        <div className="chart-card">
          <div className="chart-header">
            <div><div className="chart-title">On-Time Delivery Rates</div><div className="chart-subtitle">Percentage of orders delivered on time</div></div>
          </div>
          <DeliveryRateChart data={data.deliveryChart} />
        </div>
        <div className="chart-card">
          <div className="chart-header">
            <div className="chart-title">Cost Comparison (Raw Materials)</div>
          </div>
          <table className="data-table">
            <thead>
              <tr><th>Material</th><th>Supplier</th><th>Unit Cost</th><th>Unit</th></tr>
            </thead>
            <tbody>
              {data.costComparison?.map((c: any, i: number) => (
                <tr key={i}>
                  <td style={{ fontWeight: 600, color: 'var(--text-primary)' }}>{c.MATERIAL_NAME}</td>
                  <td>{c.SUPPLIER_NAME}</td>
                  <td style={{ fontWeight: 600 }}>₹{c.UNIT_COST}</td>
                  <td style={{ color: 'var(--text-muted)' }}>{c.UNIT}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <div className="table-card">
        <div className="table-header">
          <div className="table-title">Supplier Performance Scorecard</div>
        </div>
        <div style={{ overflowX: 'auto' }}>
          <table className="data-table">
            <thead>
              <tr><th>Supplier</th><th>Contact</th><th>Country</th><th>Rating</th><th>On-Time</th><th>Materials</th><th>Status</th></tr>
            </thead>
            <tbody>
              {data.suppliers?.map((s: any, i: number) => (
                <tr key={i}>
                  <td style={{ fontWeight: 600, color: 'var(--text-primary)' }}>{s.SUPPLIER_NAME}</td>
                  <td style={{ fontSize: '0.8rem' }}>{s.CONTACT_PERSON}<br/><span style={{ color: 'var(--text-muted)' }}>{s.EMAIL}</span></td>
                  <td>{s.COUNTRY}</td>
                  <td>
                    <span className="rating-stars">{'★'.repeat(Math.round(s.RATING))}{'☆'.repeat(5 - Math.round(s.RATING))}</span>
                    <span style={{ marginLeft: 6, fontSize: '0.8rem', color: 'var(--text-muted)' }}>{s.RATING}</span>
                  </td>
                  <td>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <div className="progress-wrap" style={{ flex: 1 }}>
                        <div className="progress-fill" style={{ width: `${s.ON_TIME_DELIVERY}%`, background: s.ON_TIME_DELIVERY >= 90 ? 'var(--success)' : s.ON_TIME_DELIVERY >= 80 ? 'var(--warning)' : 'var(--danger)' }} />
                      </div>
                      <span style={{ fontSize: '0.8rem', minWidth: 36 }}>{s.ON_TIME_DELIVERY}%</span>
                    </div>
                  </td>
                  <td>{s.MATERIAL_COUNT} items</td>
                  <td><span className={`badge ${s.STATUS === 'Active' ? 'badge-success' : 'badge-danger'}`}>{s.STATUS}</span></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
