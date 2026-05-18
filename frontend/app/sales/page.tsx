'use client';
import { useEffect, useState } from 'react';
import { MonthlyRevenueOrdersChart, RegionSalesChart } from '@/components/Charts';

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

function StatusBadge({ s }: { s: string }) {
  const map: Record<string, string> = {
    Delivered: 'badge-success', Shipped: 'badge-info', Pending: 'badge-warning', Cancelled: 'badge-danger',
  };
  return <span className={`badge ${map[s] ?? 'badge-primary'}`}>{s}</span>;
}

export default function SalesPage() {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/sales').then(r => r.json()).then(d => { setData(d); setLoading(false); });
  }, []);

  if (loading) return <div style={{ textAlign: 'center', padding: 80, color: 'var(--text-muted)' }}>⚡ Loading sales data from Oracle DB…</div>;
  if (data?.error) return <div className="alert-card danger">{data.error}</div>;

  const totalRevenue = data.orderStatus?.reduce((a: number, r: any) => a + Number(r.TOTAL_AMOUNT), 0) ?? 0;
  const totalOrders = data.orderStatus?.reduce((a: number, r: any) => a + Number(r.COUNT), 0) ?? 0;
  const pendingOrders = data.orderStatus?.find((s: any) => s.STATUS === 'Pending')?.COUNT ?? 0;
  const shippedOrders = data.orderStatus?.find((s: any) => s.STATUS === 'Shipped')?.COUNT ?? 0;

  return (
    <div>
      <div className="kpi-grid">
        <KPICard label="Total Revenue" value={fmt(totalRevenue)} icon="💰" sub="all orders" color="#3b82f6" bg="rgba(59,130,246,0.12)" />
        <KPICard label="Total Orders" value={totalOrders} icon="📦" sub="lifetime volume" color="#10b981" bg="rgba(16,185,129,0.12)" />
        <KPICard label="Pending" value={pendingOrders} icon="⏳" sub="to be processed" color="#f59e0b" bg="rgba(245,158,11,0.12)" />
        <KPICard label="In Transit" value={shippedOrders} icon="🚚" sub="shipped orders" color="#06b6d4" bg="rgba(6,182,212,0.12)" />
      </div>

      <div className="chart-grid chart-grid-2" style={{ marginBottom: 16 }}>
        <div className="chart-card">
          <div className="chart-header">
            <div><div className="chart-title">Sales Revenue vs Volume</div><div className="chart-subtitle">Monthly breakdown (Oracle SQL)</div></div>
          </div>
          <MonthlyRevenueOrdersChart data={data.monthlyRevenue} />
        </div>
        <div className="chart-card">
          <div className="chart-header">
            <div><div className="chart-title">Region-wise Sales</div><div className="chart-subtitle">Revenue distribution by customer region</div></div>
          </div>
          <RegionSalesChart data={data.regionSales} />
        </div>
      </div>

      <div className="chart-grid chart-grid-2" style={{ marginBottom: 16 }}>
        <div className="chart-card">
          <div className="chart-header">
            <div className="chart-title">Top Customers</div>
          </div>
          <table className="data-table">
            <thead>
              <tr><th>Customer</th><th>Company</th><th>Orders</th><th>Total Spent</th></tr>
            </thead>
            <tbody>
              {data.topCustomers?.map((c: any, i: number) => (
                <tr key={i}>
                  <td style={{ fontWeight: 600, color: 'var(--text-primary)' }}>{c.CUSTOMER_NAME}</td>
                  <td>{c.COMPANY}</td>
                  <td>{c.ORDER_COUNT}</td>
                  <td style={{ fontWeight: 600, color: 'var(--success)' }}>{fmt(c.TOTAL_SPENT)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div className="chart-card">
          <div className="chart-header">
            <div className="chart-title">Profit per Order (Top 10)</div>
          </div>
          <table className="data-table">
            <thead>
              <tr><th>Order ID</th><th>Customer</th><th>Revenue</th><th>Profit</th></tr>
            </thead>
            <tbody>
              {data.profitPerOrder?.map((o: any, i: number) => (
                <tr key={i}>
                  <td>#{o.ORDER_ID}</td>
                  <td>{o.CUSTOMER_NAME}</td>
                  <td>{fmt(o.REVENUE)}</td>
                  <td style={{ fontWeight: 600, color: 'var(--success)' }}>{fmt(o.PROFIT)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <div className="table-card">
        <div className="table-header">
          <div className="table-title">Order Tracking</div>
        </div>
        <div style={{ overflowX: 'auto' }}>
          <table className="data-table">
            <thead>
              <tr><th>Order ID</th><th>Customer</th><th>Company</th><th>Region</th><th>Date</th><th>Amount</th><th>Status</th></tr>
            </thead>
            <tbody>
              {data.orders?.map((o: any, i: number) => (
                <tr key={i}>
                  <td>#{o.ORDER_ID}</td>
                  <td style={{ fontWeight: 600, color: 'var(--text-primary)' }}>{o.CUSTOMER_NAME}</td>
                  <td>{o.COMPANY}</td>
                  <td>{o.REGION}</td>
                  <td style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>{String(o.ORDER_DATE).split('T')[0]}</td>
                  <td style={{ fontWeight: 600 }}>{fmt(o.TOTAL_AMOUNT)}</td>
                  <td><StatusBadge s={o.STATUS} /></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
