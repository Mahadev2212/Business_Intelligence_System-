'use client';
import { useEffect, useState } from 'react';
import { WarehouseStockChart, CategoryPie } from '@/components/Charts';

function KPICard({ label, value, icon, sub, color, bg }: any) {
  return (
    <div className="kpi-card" style={{ '--kpi-color': color, '--kpi-bg': bg } as any}>
      <div className="kpi-header"><div className="kpi-label">{label}</div><div className="kpi-icon">{icon}</div></div>
      <div className="kpi-value">{value}</div>
      <div className="kpi-meta"><span className="kpi-meta-text">{sub}</span></div>
    </div>
  );
}

export default function InventoryPage() {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  useEffect(() => {
    fetch('/api/inventory').then(r=>r.json()).then(d=>{setData(d);setLoading(false);});
  }, []);

  if (loading) return <div style={{textAlign:'center',padding:80,color:'var(--text-muted)'}}>⚡ Loading inventory data from Oracle DB…</div>;
  if (data?.error) return <div className="alert-card danger">{data.error}</div>;

  const totalItems   = data.stockLevels?.length ?? 0;
  const lowCount     = data.lowStockAlerts?.length ?? 0;
  const totalQty     = data.stockLevels?.reduce((a:number,r:any)=>a+Number(r.QUANTITY),0) ?? 0;
  const warehouseCount = data.warehouseStock?.length ?? 0;

  const filtered = data.stockLevels?.filter((r:any) =>
    !search || r.PRODUCT_NAME.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div>
      {/* KPIs */}
      <div className="kpi-grid">
        <KPICard label="Total SKUs"        value={totalItems}              icon="📦" sub="unique products"   color="#3b82f6"  bg="rgba(59,130,246,0.12)" />
        <KPICard label="Low Stock Alerts"  value={lowCount}                icon="🚨" sub="need reordering"  color="#ef4444"  bg="rgba(239,68,68,0.12)" />
        <KPICard label="Total Stock Units" value={totalQty.toLocaleString()} icon="📊" sub="across all warehouses" color="#10b981" bg="rgba(16,185,129,0.12)" />
        <KPICard label="Warehouses"        value={warehouseCount}          icon="🏭" sub="active locations"  color="#8b5cf6"  bg="rgba(139,92,246,0.12)" />
      </div>

      {/* Low Stock Alerts Section */}
      {data.lowStockAlerts?.length > 0 && (
        <div className="chart-card" style={{ marginBottom:16 }}>
          <div className="chart-header">
            <div><div className="chart-title">🚨 Reorder Suggestions</div><div className="chart-subtitle">Products at or below reorder level — immediate action required</div></div>
          </div>
          <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill,minmax(280px,1fr))', gap:10 }}>
            {data.lowStockAlerts.map((item:any, i:number) => (
              <div key={i} className="alert-card danger">
                <span className="alert-icon">📉</span>
                <div style={{ flex:1 }}>
                  <div className="alert-title">{item.PRODUCT_NAME}</div>
                  <div className="alert-desc">{item.WAREHOUSE_NAME} · Stock: <strong>{item.QUANTITY}</strong> · Reorder: {item.REORDER_LEVEL}</div>
                  <div style={{ marginTop:6 }}>
                    <span className="badge badge-danger">Shortage: {item.SHORTAGE_QTY} units</span>
                  </div>
                </div>
                <button className="btn btn-sm btn-primary">Reorder</button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Charts Row */}
      <div className="chart-grid chart-grid-2" style={{ marginBottom:16 }}>
        <div className="chart-card">
          <div className="chart-header">
            <div><div className="chart-title">Warehouse Stock Distribution</div><div className="chart-subtitle">Total quantity per warehouse</div></div>
          </div>
          <WarehouseStockChart data={data.warehouseStock} />
        </div>
        <div className="chart-card">
          <div className="chart-header">
            <div><div className="chart-title">Stock by Category</div><div className="chart-subtitle">Inventory breakdown by product category</div></div>
          </div>
          <CategoryPie data={data.categoryBreakdown} />
        </div>
      </div>

      {/* Stock Levels Table */}
      <div className="table-card">
        <div className="table-header">
          <div className="table-title">📋 Stock Level Dashboard</div>
          <input
            placeholder="🔍 Search product…"
            value={search} onChange={e=>setSearch(e.target.value)}
            className="filter-select" style={{ minWidth:220 }}
          />
        </div>
        <div style={{ overflowX:'auto' }}>
          <table className="data-table">
            <thead>
              <tr><th>Product</th><th>Category</th><th>Warehouse</th><th>Quantity</th><th>Reorder Level</th><th>Stock %</th><th>Status</th></tr>
            </thead>
            <tbody>
              {filtered?.map((r:any, i:number) => {
                const pct = Math.min(100, Math.round(Number(r.STOCK_PCT)));
                return (
                  <tr key={i}>
                    <td style={{ fontWeight:600, color:'var(--text-primary)' }}>{r.PRODUCT_NAME}</td>
                    <td>{r.CATEGORY}</td>
                    <td>{r.WAREHOUSE_NAME}</td>
                    <td style={{ fontWeight:600 }}>{Number(r.QUANTITY).toLocaleString()}</td>
                    <td style={{ color:'var(--text-muted)' }}>{Number(r.REORDER_LEVEL).toLocaleString()}</td>
                    <td style={{ width:160 }}>
                      <div style={{ display:'flex', alignItems:'center', gap:8 }}>
                        <div className="progress-wrap" style={{ flex:1 }}>
                          <div className="progress-fill" style={{ width:`${Math.min(pct,100)}%`, background: r.STOCK_STATUS==='Low'?'var(--danger)':'var(--success)' }} />
                        </div>
                        <span style={{ fontSize:'0.75rem', minWidth:36 }}>{pct}%</span>
                      </div>
                    </td>
                    <td><span className={`badge ${r.STOCK_STATUS==='Low'?'badge-danger':'badge-success'}`}>{r.STOCK_STATUS==='Low'?'Low Stock':'In Stock'}</span></td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
