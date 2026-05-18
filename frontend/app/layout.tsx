'use client';
import './globals.css';
import { useState, useEffect } from 'react';
import Sidebar from '@/components/Sidebar';
import Topbar from '@/components/Topbar';
import { usePathname } from 'next/navigation';

const pageMeta: Record<string, { title: string; subtitle: string }> = {
  '/':              { title: 'Overview Dashboard',     subtitle: 'Real-time manufacturing KPIs & analytics' },
  '/production':    { title: 'Production Management',  subtitle: 'Schedule, output & efficiency tracking' },
  '/inventory':     { title: 'Inventory Management',   subtitle: 'Stock levels, alerts & warehouse distribution' },
  '/sales':         { title: 'Sales & Orders',         subtitle: 'Revenue, order tracking & customer analysis' },
  '/suppliers':     { title: 'Supplier Management',    subtitle: 'Performance scorecards & raw material supply' },
  '/employees':     { title: 'Employee Performance',   subtitle: 'Productivity, efficiency & department analytics' },
  '/raw-materials': { title: 'Raw Material Management',subtitle: 'Stock levels, usage tracking & reorder alerts' },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  const [collapsed, setCollapsed] = useState(false);
  const [theme, setTheme] = useState('dark');
  const pathname = usePathname();
  const meta = pageMeta[pathname] ?? { title: 'Dashboard', subtitle: '' };

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
  }, [theme]);

  return (
    <html lang="en" data-theme="dark">
      <head>
        <title>ManufactureBI — Enterprise Dashboard</title>
        <meta name="description" content="Enterprise manufacturing BI dashboard with real-time Oracle SQL analytics" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="" />
      </head>
      <body>
        <div className="app-layout">
          <Sidebar collapsed={collapsed} setCollapsed={setCollapsed} />
          <div className={`main-content ${collapsed ? 'collapsed' : ''}`}>
            <Topbar
              collapsed={collapsed}
              title={meta.title}
              subtitle={meta.subtitle}
              theme={theme}
              setTheme={setTheme}
            />
            <main className="page-body">{children}</main>
          </div>
        </div>
      </body>
    </html>
  );
}
