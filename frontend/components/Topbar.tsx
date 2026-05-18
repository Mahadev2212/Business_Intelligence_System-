'use client';

interface TopbarProps {
  collapsed: boolean;
  title: string;
  subtitle?: string;
  theme: string;
  setTheme: (t: string) => void;
}

export default function Topbar({ collapsed, title, subtitle, theme, setTheme }: TopbarProps) {
  return (
    <header className={`topbar ${collapsed ? 'collapsed' : ''}`}>
      <div>
        <div className="topbar-title">{title}</div>
        {subtitle && <div className="topbar-subtitle">{subtitle}</div>}
      </div>

      <div className="topbar-search">
        <span className="topbar-search-icon">🔍</span>
        <input type="text" placeholder="Search metrics, products, employees…" />
      </div>

      <div className="topbar-actions">
        <button
          className="icon-btn"
          onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
          title="Toggle theme"
        >
          {theme === 'dark' ? '☀️' : '🌙'}
        </button>
        <button className="icon-btn" title="Notifications">
          🔔<span className="badge-dot" />
        </button>
        <button className="icon-btn" title="Settings">⚙️</button>
        <div className="avatar-btn" title="Admin User">AD</div>
      </div>
    </header>
  );
}
