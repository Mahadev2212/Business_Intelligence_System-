import React, { useState } from 'react';
import { BrowserRouter as Router, Routes, Route, NavLink } from 'react-router-dom';
import Dashboard from './pages/Dashboard';
import SecurityLogs from './pages/SecurityLogs';
import './index.css';

const NAV_ITEMS = [
  { path: '/',        label: '📊 Dashboard',      id: 'nav-dashboard' },
  { path: '/security', label: '🔐 Security Logs', id: 'nav-security'  },
];

function Sidebar({ collapsed, onToggle }) {
  return (
    <aside className={`sidebar ${collapsed ? 'collapsed' : ''}`}>
      <div className="sidebar-brand">
        {!collapsed && <span className="brand-text">BI<span className="brand-accent">System</span></span>}
        <button className="collapse-btn" id="btn-collapse-sidebar" onClick={onToggle}>
          {collapsed ? '▶' : '◀'}
        </button>
      </div>
      <nav className="sidebar-nav">
        {NAV_ITEMS.map(item => (
          <NavLink
            key={item.path}
            to={item.path}
            end={item.path === '/'}
            id={item.id}
            className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}
          >
            <span className="nav-icon">{item.label.split(' ')[0]}</span>
            {!collapsed && <span className="nav-label">{item.label.split(' ').slice(1).join(' ')}</span>}
          </NavLink>
        ))}
      </nav>
      {!collapsed && (
        <div className="sidebar-footer">
          <div className="user-avatar">A</div>
          <div>
            <div className="user-name">Admin User</div>
            <div className="user-role">Administrator</div>
          </div>
        </div>
      )}
    </aside>
  );
}

export default function App() {
  const [collapsed, setCollapsed] = useState(false);

  return (
    <Router>
      <div className="app-shell">
        <Sidebar collapsed={collapsed} onToggle={() => setCollapsed(c => !c)} />
        <main className="main-content">
          <Routes>
            <Route path="/"         element={<Dashboard />} />
            <Route path="/security" element={<SecurityLogs />} />
          </Routes>
        </main>
      </div>
    </Router>
  );
}
