'use client';
import {
  LineChart, Line, BarChart, Bar, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, AreaChart, Area, RadarChart, Radar, PolarGrid, PolarAngleAxis
} from 'recharts';

const COLORS = ['#3b82f6','#10b981','#f59e0b','#8b5cf6','#ef4444','#06b6d4','#f97316','#14b8a6'];

function CustomTooltip({ active, payload, label }: any) {
  if (!active || !payload?.length) return null;
  return (
    <div className="custom-tooltip">
      <div className="tooltip-label">{label}</div>
      {payload.map((p: any, i: number) => (
        <div className="tooltip-row" key={i}>
          <span className="tooltip-dot" style={{ background: p.color }} />
          <span>{p.name}:</span>
          <strong style={{ color: 'var(--text-primary)' }}>
            {typeof p.value === 'number' && p.value > 10000
              ? `₹${p.value.toLocaleString('en-IN')}`
              : p.value?.toLocaleString()}
          </strong>
        </div>
      ))}
    </div>
  );
}

const axisStyle = { fontSize: 11, fill: 'var(--text-muted)' };
const gridStyle = { stroke: 'rgba(255,255,255,0.06)', strokeDasharray: '3 3' };

export function RevenueLineChart({ data }: { data: any[] }) {
  return (
    <ResponsiveContainer width="100%" height={240}>
      <AreaChart data={data} margin={{ top: 5, right: 10, left: 10, bottom: 5 }}>
        <defs>
          <linearGradient id="revGrad" x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3} />
            <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
          </linearGradient>
        </defs>
        <CartesianGrid {...gridStyle} />
        <XAxis dataKey="MONTH" tick={axisStyle} axisLine={false} tickLine={false} />
        <YAxis tick={axisStyle} axisLine={false} tickLine={false} tickFormatter={v => `₹${(v/1000).toFixed(0)}k`} />
        <Tooltip content={<CustomTooltip />} />
        <Area type="monotone" dataKey="REVENUE" name="Revenue" stroke="#3b82f6" fill="url(#revGrad)" strokeWidth={2.5} dot={false} />
      </AreaChart>
    </ResponsiveContainer>
  );
}

export function ProdVsDemandChart({ data }: { data: any[] }) {
  return (
    <ResponsiveContainer width="100%" height={240}>
      <BarChart data={data} margin={{ top: 5, right: 10, left: 10, bottom: 5 }}>
        <CartesianGrid {...gridStyle} />
        <XAxis dataKey="PRODUCT_NAME" tick={{ ...axisStyle, fontSize: 10 }} axisLine={false} tickLine={false} />
        <YAxis tick={axisStyle} axisLine={false} tickLine={false} />
        <Tooltip content={<CustomTooltip />} />
        <Legend wrapperStyle={{ fontSize: 11, color: 'var(--text-muted)' }} />
        <Bar dataKey="PRODUCED" name="Produced" fill="#3b82f6" radius={[4,4,0,0]} />
        <Bar dataKey="ORDERED" name="Ordered"  fill="#10b981" radius={[4,4,0,0]} />
      </BarChart>
    </ResponsiveContainer>
  );
}

export function OrderStatusPie({ data }: { data: any[] }) {
  return (
    <ResponsiveContainer width="100%" height={200}>
      <PieChart>
        <Pie data={data} cx="50%" cy="50%" innerRadius={55} outerRadius={80}
          dataKey="COUNT" nameKey="STATUS" paddingAngle={3}>
          {data.map((_,i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
        </Pie>
        <Tooltip content={<CustomTooltip />} />
        <Legend wrapperStyle={{ fontSize: 11, color: 'var(--text-muted)' }} />
      </PieChart>
    </ResponsiveContainer>
  );
}

export function DailyProductionChart({ data }: { data: any[] }) {
  return (
    <ResponsiveContainer width="100%" height={240}>
      <BarChart data={data} margin={{ top: 5, right: 10, left: 10, bottom: 5 }}>
        <CartesianGrid {...gridStyle} />
        <XAxis dataKey="PRODUCTION_DATE" tick={axisStyle} axisLine={false} tickLine={false} />
        <YAxis tick={axisStyle} axisLine={false} tickLine={false} />
        <Tooltip content={<CustomTooltip />} />
        <Legend wrapperStyle={{ fontSize: 11, color: 'var(--text-muted)' }} />
        <Bar dataKey="TOTAL_PRODUCED" name="Actual" fill="#3b82f6" radius={[4,4,0,0]} />
        <Bar dataKey="PLANNED" name="Planned" fill="rgba(59,130,246,0.25)" radius={[4,4,0,0]} />
      </BarChart>
    </ResponsiveContainer>
  );
}

export function EmployeeOutputChart({ data }: { data: any[] }) {
  return (
    <ResponsiveContainer width="100%" height={260}>
      <BarChart data={data} layout="vertical" margin={{ top: 5, right: 20, left: 60, bottom: 5 }}>
        <CartesianGrid {...gridStyle} horizontal={false} />
        <XAxis type="number" tick={axisStyle} axisLine={false} tickLine={false} />
        <YAxis dataKey="EMPLOYEE_NAME" type="category" tick={{ ...axisStyle, fontSize: 11 }} axisLine={false} tickLine={false} width={80} />
        <Tooltip content={<CustomTooltip />} />
        <Bar dataKey="TOTAL_OUTPUT" name="Output" fill="#8b5cf6" radius={[0,4,4,0]}>
          {data.map((_,i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  );
}

export function WarehouseStockChart({ data }: { data: any[] }) {
  return (
    <ResponsiveContainer width="100%" height={220}>
      <BarChart data={data} margin={{ top: 5, right: 10, left: 10, bottom: 5 }}>
        <CartesianGrid {...gridStyle} />
        <XAxis dataKey="WAREHOUSE_NAME" tick={{ ...axisStyle, fontSize: 10 }} axisLine={false} tickLine={false} />
        <YAxis tick={axisStyle} axisLine={false} tickLine={false} />
        <Tooltip content={<CustomTooltip />} />
        <Bar dataKey="TOTAL_QTY" name="Stock Qty" fill="#06b6d4" radius={[4,4,0,0]} />
      </BarChart>
    </ResponsiveContainer>
  );
}

export function CategoryPie({ data }: { data: any[] }) {
  return (
    <ResponsiveContainer width="100%" height={220}>
      <PieChart>
        <Pie data={data} cx="50%" cy="50%" outerRadius={80}
          dataKey="TOTAL_QTY" nameKey="CATEGORY" paddingAngle={3} label={({ CATEGORY, percent }: any) => `${CATEGORY} ${(percent*100).toFixed(0)}%`}
          labelLine={false}>
          {data.map((_,i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
        </Pie>
        <Tooltip content={<CustomTooltip />} />
      </PieChart>
    </ResponsiveContainer>
  );
}

export function RegionSalesChart({ data }: { data: any[] }) {
  return (
    <ResponsiveContainer width="100%" height={220}>
      <PieChart>
        <Pie data={data} cx="50%" cy="50%" innerRadius={50} outerRadius={80}
          dataKey="TOTAL_REVENUE" nameKey="REGION" paddingAngle={3}>
          {data.map((_,i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
        </Pie>
        <Tooltip content={<CustomTooltip />} />
        <Legend wrapperStyle={{ fontSize: 11, color: 'var(--text-muted)' }} />
      </PieChart>
    </ResponsiveContainer>
  );
}

export function DeliveryRateChart({ data }: { data: any[] }) {
  return (
    <ResponsiveContainer width="100%" height={240}>
      <BarChart data={data} margin={{ top: 5, right: 10, left: 10, bottom: 5 }}>
        <CartesianGrid {...gridStyle} />
        <XAxis dataKey="SUPPLIER_NAME" tick={{ ...axisStyle, fontSize: 10 }} axisLine={false} tickLine={false} />
        <YAxis tick={axisStyle} axisLine={false} tickLine={false} domain={[0,100]} />
        <Tooltip content={<CustomTooltip />} />
        <Bar dataKey="ON_TIME" name="On-Time %" fill="#10b981" radius={[4,4,0,0]} />
      </BarChart>
    </ResponsiveContainer>
  );
}

export function DeptPerformanceChart({ data }: { data: any[] }) {
  return (
    <ResponsiveContainer width="100%" height={240}>
      <BarChart data={data} margin={{ top: 5, right: 10, left: 10, bottom: 5 }}>
        <CartesianGrid {...gridStyle} />
        <XAxis dataKey="DEPARTMENT" tick={axisStyle} axisLine={false} tickLine={false} />
        <YAxis tick={axisStyle} axisLine={false} tickLine={false} />
        <Tooltip content={<CustomTooltip />} />
        <Legend wrapperStyle={{ fontSize: 11, color: 'var(--text-muted)' }} />
        <Bar dataKey="TOTAL_OUTPUT" name="Output" fill="#3b82f6" radius={[4,4,0,0]} />
        <Bar dataKey="AVG_EFFICIENCY" name="Efficiency %" fill="#10b981" radius={[4,4,0,0]} />
      </BarChart>
    </ResponsiveContainer>
  );
}

export function UsageVsStockChart({ data }: { data: any[] }) {
  return (
    <ResponsiveContainer width="100%" height={260}>
      <BarChart data={data} layout="vertical" margin={{ top: 5, right: 20, left: 80, bottom: 5 }}>
        <CartesianGrid {...gridStyle} horizontal={false} />
        <XAxis type="number" tick={axisStyle} axisLine={false} tickLine={false} />
        <YAxis dataKey="MATERIAL_NAME" type="category" tick={{ ...axisStyle, fontSize: 10 }} axisLine={false} tickLine={false} width={100} />
        <Tooltip content={<CustomTooltip />} />
        <Legend wrapperStyle={{ fontSize: 11, color: 'var(--text-muted)' }} />
        <Bar dataKey="STOCK_QTY" name="Stock"  fill="#3b82f6" radius={[0,4,4,0]} />
        <Bar dataKey="TOTAL_USED" name="Used"  fill="#f59e0b" radius={[0,4,4,0]} />
      </BarChart>
    </ResponsiveContainer>
  );
}

export function MonthlyRevenueOrdersChart({ data }: { data: any[] }) {
  return (
    <ResponsiveContainer width="100%" height={240}>
      <AreaChart data={data} margin={{ top: 5, right: 10, left: 10, bottom: 5 }}>
        <defs>
          <linearGradient id="revGrad2" x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3} />
            <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
          </linearGradient>
          <linearGradient id="ordGrad" x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%" stopColor="#10b981" stopOpacity={0.3} />
            <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
          </linearGradient>
        </defs>
        <CartesianGrid {...gridStyle} />
        <XAxis dataKey="MONTH" tick={axisStyle} axisLine={false} tickLine={false} />
        <YAxis yAxisId="rev" tick={axisStyle} axisLine={false} tickLine={false} tickFormatter={v=>`₹${(v/1000).toFixed(0)}k`} />
        <YAxis yAxisId="ord" orientation="right" tick={axisStyle} axisLine={false} tickLine={false} />
        <Tooltip content={<CustomTooltip />} />
        <Legend wrapperStyle={{ fontSize: 11, color: 'var(--text-muted)' }} />
        <Area yAxisId="rev" type="monotone" dataKey="REVENUE" name="Revenue" stroke="#3b82f6" fill="url(#revGrad2)" strokeWidth={2} dot={false} />
        <Area yAxisId="ord" type="monotone" dataKey="ORDER_COUNT" name="Orders" stroke="#10b981" fill="url(#ordGrad)" strokeWidth={2} dot={false} />
      </AreaChart>
    </ResponsiveContainer>
  );
}

export function ShiftPie({ data }: { data: any[] }) {
  return (
    <ResponsiveContainer width="100%" height={200}>
      <PieChart>
        <Pie data={data} cx="50%" cy="50%" outerRadius={70}
          dataKey="HEADCOUNT" nameKey="SHIFT" paddingAngle={3}
          label={({ SHIFT, percent }: any) => `${SHIFT} ${(percent*100).toFixed(0)}%`} labelLine={false}>
          {data.map((_,i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
        </Pie>
        <Tooltip content={<CustomTooltip />} />
      </PieChart>
    </ResponsiveContainer>
  );
}

export function MaterialCostChart({ data }: { data: any[] }) {
  return (
    <ResponsiveContainer width="100%" height={240}>
      <BarChart data={data} margin={{ top: 5, right: 10, left: 10, bottom: 40 }}>
        <CartesianGrid {...gridStyle} />
        <XAxis dataKey="MATERIAL_NAME" tick={{ ...axisStyle, fontSize: 9 }} axisLine={false} tickLine={false} angle={-30} textAnchor="end" />
        <YAxis tick={axisStyle} axisLine={false} tickLine={false} tickFormatter={v=>`₹${(v/1000).toFixed(0)}k`} />
        <Tooltip content={<CustomTooltip />} />
        <Bar dataKey="TOTAL_VALUE" name="Stock Value (₹)" fill="#8b5cf6" radius={[4,4,0,0]}>
          {data.map((_,i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  );
}
