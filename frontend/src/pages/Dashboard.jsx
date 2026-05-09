import React, { useState, useEffect } from 'react';
import {
  LineChart, Line, BarChart, Bar, AreaChart, Area,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer
} from 'recharts';

// ─── Mock data ───────────────────────────────────────────────────────────────
const generateSalesData = () =>
  Array.from({ length: 12 }, (_, i) => ({
    month: ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'][i],
    revenue: Math.floor(Math.random() * 80000 + 40000),
    profit:  Math.floor(Math.random() * 30000 + 15000),
    forecast: Math.floor(Math.random() * 90000 + 45000),
  }));

const kpiData = [
  { label: 'Total Revenue',    value: '$2.4M',  change: '+12.5%', up: true,  icon: '💰' },
  { label: 'Active Customers', value: '8,423',  change: '+4.2%',  up: true,  icon: '👥' },
  { label: 'Churn Rate',       value: '3.8%',   change: '-0.6%',  up: false, icon: '📉' },
  { label: 'Avg Order Value',  value: '$284',   change: '+8.1%',  up: true,  icon: '🛒' },
];

const anomalyPoints = [
  { name: 'Week 1',  value: 320, anomaly: false },
  { name: 'Week 2',  value: 340, anomaly: false },
  { name: 'Week 3',  value: 890, anomaly: true  },
  { name: 'Week 4',  value: 360, anomaly: false },
  { name: 'Week 5',  value: 355, anomaly: false },
  { name: 'Week 6',  value: 125, anomaly: true  },
  { name: 'Week 7',  value: 380, anomaly: false },
  { name: 'Week 8',  value: 370, anomaly: false },
];

const churnData = [
  { segment: 'Enterprise', churnRisk: 12, retained: 88 },
  { segment: 'Mid-Market', churnRisk: 28, retained: 72 },
  { segment: 'SMB',        churnRisk: 45, retained: 55 },
  { segment: 'Startup',    churnRisk: 38, retained: 62 },
];

// ─── Subcomponents ────────────────────────────────────────────────────────────
const KPICard = ({ label, value, change, up, icon }) => (
  <div className="kpi-card">
    <div className="kpi-header">
      <span className="kpi-icon">{icon}</span>
      <span className={`kpi-change ${up ? 'up' : 'down'}`}>{change}</span>
    </div>
    <div className="kpi-value">{value}</div>
    <div className="kpi-label">{label}</div>
  </div>
);

const SectionHeader = ({ title, subtitle }) => (
  <div className="section-header">
    <h2>{title}</h2>
    {subtitle && <p className="section-subtitle">{subtitle}</p>}
  </div>
);

// ─── Dashboard Page ───────────────────────────────────────────────────────────
export default function Dashboard() {
  const [salesData, setSalesData] = useState([]);
  const [activeTab, setActiveTab] = useState('revenue');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setTimeout(() => {
      setSalesData(generateSalesData());
      setLoading(false);
    }, 600);
  }, []);

  if (loading) {
    return (
      <div className="loading-screen">
        <div className="spinner" />
        <p>Loading dashboard…</p>
      </div>
    );
  }

  return (
    <div className="dashboard-page">
      {/* Header */}
      <div className="page-header">
        <div>
          <h1 className="page-title">Business Intelligence Dashboard</h1>
          <p className="page-subtitle">Real-time analytics, forecasting &amp; AI insights</p>
        </div>
        <div className="header-actions">
          <button className="btn-secondary" id="btn-export">⬇ Export</button>
          <button className="btn-primary"   id="btn-refresh" onClick={() => setSalesData(generateSalesData())}>
            ↻ Refresh
          </button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="kpi-grid">
        {kpiData.map(k => <KPICard key={k.label} {...k} />)}
      </div>

      {/* Revenue / Forecast Chart */}
      <div className="chart-card wide">
        <SectionHeader title="Revenue vs Forecast" subtitle="Monthly comparison against AI-generated forecast" />
        <div className="tab-group">
          {['revenue','profit','forecast'].map(t => (
            <button
              key={t}
              id={`tab-${t}`}
              className={`tab-btn ${activeTab === t ? 'active' : ''}`}
              onClick={() => setActiveTab(t)}
            >
              {t.charAt(0).toUpperCase() + t.slice(1)}
            </button>
          ))}
        </div>
        <ResponsiveContainer width="100%" height={280}>
          <AreaChart data={salesData}>
            <defs>
              <linearGradient id="colorGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%"  stopColor="#6366f1" stopOpacity={0.4} />
                <stop offset="95%" stopColor="#6366f1" stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
            <XAxis dataKey="month" stroke="#94a3b8" />
            <YAxis stroke="#94a3b8" tickFormatter={v => `$${(v/1000).toFixed(0)}k`} />
            <Tooltip
              contentStyle={{ background: '#1e293b', border: '1px solid #334155', borderRadius: 8 }}
              formatter={v => [`$${v.toLocaleString()}`, '']}
            />
            <Area
              type="monotone"
              dataKey={activeTab}
              stroke="#6366f1"
              fill="url(#colorGrad)"
              strokeWidth={2}
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>

      {/* Anomaly Detection + Churn Prediction */}
      <div className="chart-row">
        {/* Anomaly Detection */}
        <div className="chart-card">
          <SectionHeader title="🔍 Anomaly Detection" subtitle="AI-flagged irregular data points" />
          <ResponsiveContainer width="100%" height={220}>
            <LineChart data={anomalyPoints}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
              <XAxis dataKey="name" stroke="#94a3b8" />
              <YAxis stroke="#94a3b8" />
              <Tooltip
                contentStyle={{ background: '#1e293b', border: '1px solid #334155', borderRadius: 8 }}
              />
              <Line
                type="monotone"
                dataKey="value"
                stroke="#22d3ee"
                strokeWidth={2}
                dot={({ cx, cy, payload }) => (
                  <circle
                    key={`dot-${payload.name}`}
                    cx={cx} cy={cy} r={payload.anomaly ? 7 : 4}
                    fill={payload.anomaly ? '#f43f5e' : '#22d3ee'}
                    stroke={payload.anomaly ? '#fff' : 'none'}
                    strokeWidth={2}
                  />
                )}
              />
            </LineChart>
          </ResponsiveContainer>
          <div className="legend-note">
            <span className="dot-red" /> Anomaly &nbsp;
            <span className="dot-cyan" /> Normal
          </div>
        </div>

        {/* Churn Prediction */}
        <div className="chart-card">
          <SectionHeader title="⚠️ Churn Risk by Segment" subtitle="Predicted churn probability per customer segment" />
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={churnData} layout="vertical">
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
              <XAxis type="number" stroke="#94a3b8" unit="%" />
              <YAxis dataKey="segment" type="category" stroke="#94a3b8" width={70} />
              <Tooltip
                contentStyle={{ background: '#1e293b', border: '1px solid #334155', borderRadius: 8 }}
                formatter={v => [`${v}%`, '']}
              />
              <Bar dataKey="churnRisk" fill="#f43f5e" radius={[0,4,4,0]} name="Churn Risk %" />
              <Bar dataKey="retained"  fill="#22c55e" radius={[0,4,4,0]} name="Retained %" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
}
