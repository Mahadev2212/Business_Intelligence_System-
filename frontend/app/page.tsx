'use client';
import { useEffect, useState } from 'react';
import { RevenueLineChart, ProdVsDemandChart, OrderStatusPie } from '@/components/Charts';

function KPICard({ label, value, icon, change, changeLabel, color, bg }: any) {
  return (
    <div className="kpi-card" style={{ '--kpi-color': color, '--kpi-bg': bg } as any}>
      <div className="kpi-header">
        <div className="kpi-label">{label}</div>
        <div className="kpi-icon">{icon}</div>
      </div>
      <div className="kpi-value">{value}</div>
      <div className="kpi-meta">
        {change && <span className={`kpi-change ${change > 0 ? 'up' : 'down'}`}>{change > 0 ? '▲' : '▼'} {Math.abs(change)}%</span>}
        <span className="kpi-meta-text">{changeLabel}</span>
      </div>
    </div>
  );
}

function fmt(n: number) {
  if (n >= 10000000) return `₹${(n / 10000000).toFixed(2)}Cr`;
  if (n >= 100000)   return `₹${(n / 100000).toFixed(2)}L`;
  return `₹${n.toLocaleString('en-IN')}`;
}

function StatusBadge({ s }: { s: string }) {
  const map: Record<string, string> = {
    Delivered: 'badge-success', Shipped: 'badge-info', Pending: 'badge-warning', Cancelled: 'badge-danger',
  };
  return <span className={`badge ${map[s] ?? 'badge-primary'}`}>{s}</span>;
}

export default function OverviewPage() {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    fetch('/api/stats')
      .then(r => r.json())
      .then(d => { setData(d); setLoading(false); })
      .catch(() => { setError('Failed to load data from Oracle DB'); setLoading(false); });
  }, []);

  if (loading) return (
    <div>
      <div className="kpi-grid">
        {[...Array(4)].map((_,i) => <div key={i} className="kpi-card skeleton" style={{ height: 130 }} />)}
      </div>
      <div style={{ textAlign: 'center', padding: '60px', color: 'var(--text-muted)' }}>
        <div style={{ fontSize: '2rem', marginBottom: 12 }}>⚡</div>
        Querying Oracle SQL database…
      </div>
    </div>
  );

  if (error || data?.error) return (
    <div className="alert-card danger" style={{ borderRadius: 'var(--radius-lg)', padding: 24 }}>
      <div className="alert-icon">⚠️</div>
      <div>
        <div className="alert-title">Oracle DB Connection Error</div>
        <div className="alert-desc">{error || data.error} — Check your .env.local credentials and ensure Oracle DB is running.</div>
      </div>
    </div>
  );

  return (
    <div>
      {/* KPI Row */}
      <div className="kpi-grid">
        <KPICard label="Total Revenue" value={fmt(data.revenue)} icon="💰" change={12.4} changeLabel="vs last quarter" color="#3b82f6" bg="rgba(59,130,246,0.12)" />
        <KPICard label="Total Profit"  value={fmt(data.profit)}  icon="📈" change={8.7}  changeLabel="profit margin"  color="#10b981" bg="rgba(16,185,129,0.12)" />
        <KPICard label="Production Units" value={data.productionUnits.toLocaleString()} icon="⚙️" change={5.2} changeLabel="completed units" color="#8b5cf6" bg="rgba(139,92,246,0.12)" />
        <KPICard label="Total Orders" value={data.totalOrders.toLocaleString()} icon="📦" change={18.3} changeLabel="this period" color="#f59e0b" bg="rgba(245,158,11,0.12)" />
      </div>

      {/* Low Stock Alerts */}
      {data.lowStock?.length > 0 && (
        <div className="chart-card" style={{ marginBottom: 16 }}>
          <div className="chart-header">
            <div>
              <div className="chart-title">🚨 Low Stock Alerts</div>
              <div className="chart-subtitle">{data.lowStock.length} products at or below reorder level</div>
            </div>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(280px,1fr))', gap: 10 }}>
            {data.lowStock.map((item: any, i: number) => (
              <div key={i} className="alert-card danger">
                <span className="alert-icon">📉</span>
                <div>
                  <div className="alert-title">{item.PRODUCT_NAME}</div>
                  <div className="alert-desc">{item.WAREHOUSE_NAME} — Stock: {item.QUANTITY} / Reorder: {item.REORDER_LEVEL}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Charts Row 1 */}
      <div className="chart-grid chart-grid-2" style={{ marginBottom: 16 }}>
        <div className="chart-card">
          <div className="chart-header">
            <div>
              <div className="chart-title">Monthly Revenue</div>
              <div className="chart-subtitle">SQL GROUP BY month from orders table</div>
            </div>
          </div>
          <RevenueLineChart data={data.monthlyRevenue} />
        </div>
        <div className="chart-card">
          <div className="chart-header">
            <div>
              <div className="chart-title">Production vs Demand</div>
              <div className="chart-subtitle">Actual output vs ordered quantities</div>
            </div>
          </div>
          <ProdVsDemandChart data={data.prodVsDemand} />
        </div>
      </div>

      {/* Charts Row 2 */}
      <div className="chart-grid" style={{ gridTemplateColumns: '2fr 1fr', marginBottom: 16 }}>
        {/* Top 5 Products */}
        <div className="chart-card">
          <div className="chart-header">
            <div className="chart-title">🏆 Top 5 Products by Revenue</div>
          </div>
          <table className="data-table" style={{ width: '100%' }}>
            <thead>
              <tr>
                <th>#</th>
                <th>Product</th>
                <th>Qty Sold</th>
                <th>Revenue</th>
              </tr>
            </thead>
            <tbody>
              {data.topProducts?.map((p: any, i: number) => (
                <tr key={i}>
                  <td>
                    <span className={`rank-badge rank-${i < 3 ? i+1 : 'other'}`}>{i+1}</span>
                  </td>
                  <td style={{ fontWeight: 600, color: 'var(--text-primary)' }}>{p.PRODUCT_NAME}</td>
                  <td>{p.TOTAL_QTY?.toLocaleString()}</td>
                  <td style={{ color: 'var(--success)', fontWeight: 600 }}>{fmt(p.TOTAL_REVENUE)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Order Status */}
        <div className="chart-card">
          <div className="chart-header">
            <div>
              <div className="chart-title">Order Status</div>
              <div className="chart-subtitle">Distribution by status</div>
            </div>
          </div>
          <OrderStatusPie data={data.orderStatus} />
        </div>
      </div>

      {/* Supplier Performance */}
      <div className="chart-card">
        <div className="chart-header">
          <div className="chart-title">🏭 Supplier Performance Scorecard</div>
        </div>
        <table className="data-table">
          <thead>
            <tr>
              <th>Supplier</th>
              <th>Country</th>
              <th>Rating</th>
              <th>On-Time Delivery</th>
              <th>Status</th>
            </tr>
          </thead>
          <tbody>
            {data.suppliers?.map((s: any, i: number) => (
              <tr key={i}>
                <td style={{ fontWeight: 600, color: 'var(--text-primary)' }}>{s.SUPPLIER_NAME}</td>
                <td>{s.COUNTRY}</td>
                <td>
                  <span className="rating-stars">{'★'.repeat(Math.round(s.RATING))}{'☆'.repeat(5-Math.round(s.RATING))}</span>
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
                <td><span className={`badge ${s.STATUS === 'Active' ? 'badge-success' : 'badge-danger'}`}>{s.STATUS}</span></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
