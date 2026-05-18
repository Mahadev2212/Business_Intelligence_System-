'use client';
import { useEffect, useState } from 'react';
import { UsageVsStockChart, MaterialCostChart } from '@/components/Charts';

function KPICard({ label, value, icon, sub, color, bg }: any) {
  return (
    <div className="kpi-card" style={{ '--kpi-color': color, '--kpi-bg': bg } as any}>
      <div className="kpi-header"><div className="kpi-label">{label}</div><div className="kpi-icon">{icon}</div></div>
      <div className="kpi-value">{value}</div>
      <div className="kpi-meta"><span className="kpi-meta-text">{sub}</span></div>
    </div>
  );
}

export default function RawMaterialsPage() {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/raw-materials').then(r => r.json()).then(d => { setData(d); setLoading(false); });
  }, []);

  if (loading) return <div style={{ textAlign: 'center', padding: 80, color: 'var(--text-muted)' }}>⚡ Loading material data from Oracle DB…</div>;
  if (data?.error) return <div className="alert-card danger">{data.error}</div>;

  const totalMaterials = data.materials?.length ?? 0;
  const lowStockCount = data.lowStockAlerts?.length ?? 0;
  const totalStockValue = data.costAnalysis?.reduce((a: number, m: any) => a + Number(m.TOTAL_VALUE), 0) ?? 0;
  const totalUsage = data.materials?.reduce((a: number, m: any) => a + Number(m.TOTAL_USED), 0) ?? 0;

  return (
    <div>
      <div className="kpi-grid">
        <KPICard label="Total Materials" value={totalMaterials} icon="🧱" sub="inventory SKUs" color="#3b82f6" bg="rgba(59,130,246,0.12)" />
        <KPICard label="Low Stock Alerts" value={lowStockCount} icon="🚨" sub="need replenishment" color="#ef4444" bg="rgba(239,68,68,0.12)" />
        <KPICard label="Inventory Value" value={`₹${(totalStockValue / 100000).toFixed(1)}L`} icon="💰" sub="total valuation" color="#10b981" bg="rgba(16,185,129,0.12)" />
        <KPICard label="Total Usage" value={totalUsage.toLocaleString()} icon="📊" sub="units consumed" color="#f59e0b" bg="rgba(245,158,11,0.12)" />
      </div>

      <div className="chart-grid chart-grid-2" style={{ marginBottom: 16 }}>
        <div className="chart-card">
          <div className="chart-header">
            <div><div className="chart-title">Usage vs Stock Availability</div><div className="chart-subtitle">Consumption vs on-hand inventory</div></div>
          </div>
          <UsageVsStockChart data={data.usageVsAvailability} />
        </div>
        <div className="chart-card">
          <div className="chart-header">
            <div><div className="chart-title">Material Stock Valuation</div><div className="chart-subtitle">Value by material (Oracle SQL CALC)</div></div>
          </div>
          <MaterialCostChart data={data.costAnalysis} />
        </div>
      </div>

      {lowStockCount > 0 && (
        <div className="chart-card" style={{ marginBottom: 16 }}>
          <div className="chart-header">
            <div className="chart-title">🚨 Replenishment Alerts</div>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 12 }}>
            {data.lowStockAlerts?.map((m: any, i: number) => (
              <div key={i} className="alert-card warning">
                <span className="alert-icon">⚠️</span>
                <div style={{ flex: 1 }}>
                  <div className="alert-title">{m.MATERIAL_NAME}</div>
                  <div className="alert-desc">Stock: {m.STOCK_QTY} / Reorder: {m.REORDER_LEVEL}</div>
                  <div style={{ marginTop: 4, fontSize: '0.75rem', fontWeight: 700 }}>Supplier: {m.SUPPLIER_NAME}</div>
                </div>
                <div className="badge badge-danger">Short: {m.SHORTAGE}</div>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="table-card">
        <div className="table-header">
          <div className="table-title">Raw Material Inventory</div>
        </div>
        <div style={{ overflowX: 'auto' }}>
          <table className="data-table">
            <thead>
              <tr><th>Material</th><th>Supplier</th><th>Unit Cost</th><th>Stock Qty</th><th>Used</th><th>Waste</th><th>Status</th></tr>
            </thead>
            <tbody>
              {data.materials?.map((m: any, i: number) => (
                <tr key={i}>
                  <td style={{ fontWeight: 600, color: 'var(--text-primary)' }}>{m.MATERIAL_NAME}</td>
                  <td>{m.SUPPLIER_NAME}</td>
                  <td>₹{m.UNIT_COST}</td>
                  <td style={{ fontWeight: 600 }}>{Number(m.STOCK_QTY).toLocaleString()} {m.UNIT}</td>
                  <td>{Number(m.TOTAL_USED).toLocaleString()}</td>
                  <td style={{ color: Number(m.TOTAL_WASTE) > 0 ? 'var(--danger)' : 'var(--text-muted)' }}>{m.TOTAL_WASTE}</td>
                  <td><span className={`badge ${m.STOCK_STATUS === 'Low' ? 'badge-danger' : 'badge-success'}`}>{m.STOCK_STATUS === 'Low' ? 'Reorder' : 'Healthy'}</span></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
