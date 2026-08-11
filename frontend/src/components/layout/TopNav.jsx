import { useLocation, Link } from 'react-router-dom'
import { useAuth } from '../../contexts/AuthContext'

const breadcrumbMap = {
  '/dashboard': [{ label: 'Dashboard' }],
  '/vehicles': [{ label: 'Vehicles', to: '/vehicles' }],
  '/settings': [{ label: 'Settings' }],
}

const handleHamburger = () => {
  // Dispatch custom event — Sidebar.jsx listens for it
  window.dispatchEvent(new Event('toggle-sidebar'))
}

export default function TopNav({ onSearchChange, searchValue }) {
  const { user } = useAuth()
  const location = useLocation()

  const crumbs = breadcrumbMap[location.pathname] || []

  return (
    <header className="topbar">
      {/* Hamburger — mobile only */}
      <button
        className="mobile-menu-btn"
        onClick={handleHamburger}
        aria-label="Open navigation menu"
        title="Menu"
      >
        <i className="bi bi-list" />
      </button>

      {/* Breadcrumb — hidden on mobile via CSS */}
      <div className="breadcrumb-nav" style={{ minWidth: 120 }}>
        <Link to="/dashboard" style={{ color: 'var(--text-muted)', textDecoration: 'none' }}>
          <i className="bi bi-house"></i>
        </Link>
        {crumbs.map((crumb, i) => (
          <span key={i} style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <i className="bi bi-chevron-right"></i>
            {crumb.to ? (
              <Link to={crumb.to} style={{ color: 'var(--text-muted)', textDecoration: 'none' }}>
                {crumb.label}
              </Link>
            ) : (
              <span>{crumb.label}</span>
            )}
          </span>
        ))}
      </div>

      {/* Global Search */}
      {onSearchChange && (
        <div className="topbar-search">
          <i className="bi bi-search"></i>
          <input
            type="text"
            placeholder="Search vehicles..."
            value={searchValue || ''}
            onChange={(e) => onSearchChange(e.target.value)}
            id="global-search"
          />
        </div>
      )}

      {/* Actions */}
      <div className="topbar-actions">
        {/* Date — hidden on mobile via CSS */}
        <div className="topbar-date" style={{ fontSize: 12, color: 'var(--text-muted)' }}>
          {new Date().toLocaleDateString('en-IN', { weekday: 'short', day: '2-digit', month: 'short', year: 'numeric' })}
        </div>
        <div className="topbar-user">
          <div className="topbar-avatar">
            {user?.displayName?.[0] || 'A'}
          </div>
          <div className="topbar-user-name" style={{ lineHeight: 1.2 }}>
            <div style={{ fontSize: 12, fontWeight: 600 }}>{user?.displayName || 'Admin'}</div>
            <div style={{ fontSize: 10, color: 'var(--text-muted)' }}>Administrator</div>
          </div>
        </div>
      </div>
    </header>
  )
}
