'use client';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useState } from 'react';

const navItems = [
  { label: 'Overview', icon: '⬡', href: '/', section: 'Main' },
  { label: 'Production', icon: '⚙️', href: '/production', section: 'Operations' },
  { label: 'Inventory', icon: '📦', href: '/inventory', section: 'Operations' },
  { label: 'Sales & Orders', icon: '💰', href: '/sales', section: 'Operations' },
  { label: 'Suppliers', icon: '🏭', href: '/suppliers', section: 'Supply Chain' },
  { label: 'Employees', icon: '👨‍💼', href: '/employees', section: 'People' },
  { label: 'Raw Materials', icon: '🧱', href: '/raw-materials', section: 'Supply Chain' },
];

export default function Sidebar({ collapsed, setCollapsed }: { collapsed: boolean; setCollapsed: (v: boolean) => void }) {
  const pathname = usePathname();
  const sections = [...new Set(navItems.map(n => n.section))];

  return (
    <aside className={`sidebar ${collapsed ? 'collapsed' : ''}`}>
      <div className="sidebar-header">
        <div className="sidebar-logo">🏗️</div>
        {!collapsed && (
          <div className="sidebar-brand">
            ManufactureBI
            <small>Enterprise Dashboard</small>
          </div>
        )}
        <button className="sidebar-collapse-btn" onClick={() => setCollapsed(!collapsed)}>
          {collapsed ? '▶' : '◀'}
        </button>
      </div>

      <nav className="sidebar-nav">
        {sections.map(section => {
          const items = navItems.filter(n => n.section === section);
          return (
            <div className="nav-section" key={section}>
              <div className="nav-section-label">{section}</div>
              {items.map(item => (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`nav-item ${pathname === item.href ? 'active' : ''}`}
                  title={collapsed ? item.label : undefined}
                >
                  <span className="nav-icon">{item.icon}</span>
                  {!collapsed && <span className="nav-label">{item.label}</span>}
                </Link>
              ))}
            </div>
          );
        })}
      </nav>

      <div className="sidebar-footer">
        {!collapsed && (
          <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', padding: '4px 8px' }}>
            🗄️ Oracle SQL Connected
          </div>
        )}
      </div>
    </aside>
  );
}
