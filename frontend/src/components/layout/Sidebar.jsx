import { useState, useEffect } from 'react'
import { NavLink, useNavigate, useLocation } from 'react-router-dom'
import { useAuth } from '../../contexts/AuthContext'
import { toast } from 'react-toastify'

const navItems = [
  { to: '/dashboard', icon: 'bi-speedometer2', label: 'Dashboard' },
  { to: '/vehicles', icon: 'bi-truck', label: 'Vehicles' },
]

const bottomItems = [
  { to: '/settings', icon: 'bi-gear', label: 'Settings' },
]

export default function Sidebar() {
  const { user, logout } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()
  const [mobileOpen, setMobileOpen] = useState(false)

  // Close sidebar on route change (mobile)
  useEffect(() => {
    setMobileOpen(false)
  }, [location.pathname])

  // Close sidebar on Escape key
  useEffect(() => {
    const handler = (e) => { if (e.key === 'Escape') setMobileOpen(false) }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [])

  // Expose toggle function via a custom event so TopNav can trigger it
  useEffect(() => {
    const handler = () => setMobileOpen((v) => !v)
    window.addEventListener('toggle-sidebar', handler)
    return () => window.removeEventListener('toggle-sidebar', handler)
  }, [])

  const handleLogout = async () => {
    await logout()
    toast.info('Logged out successfully.')
    navigate('/login')
  }

  return (
    <>
      {/* Mobile overlay — clicking it closes the sidebar */}
      <div
        className={`sidebar-overlay${mobileOpen ? ' mobile-open' : ''}`}
        onClick={() => setMobileOpen(false)}
        aria-hidden="true"
      />

      <aside className={`sidebar${mobileOpen ? ' mobile-open' : ''}`}>
        {/* Brand */}
        <div className="sidebar-brand">
          <div className="sidebar-brand-icon">🚛</div>
          <div className="sidebar-brand-text">
            <h6>Fleet Reminder</h6>
            <small>Pro Edition</small>
          </div>
          {/* Close button — mobile only */}
          <button
            onClick={() => setMobileOpen(false)}
            aria-label="Close navigation"
            style={{
              marginLeft: 'auto',
              background: 'none',
              border: 'none',
              color: 'var(--text-muted)',
              cursor: 'pointer',
              fontSize: 18,
              padding: 4,
              display: 'flex',
              alignItems: 'center',
            }}
            className="mobile-menu-btn"
          >
            <i className="bi bi-x-lg" />
          </button>
        </div>

        {/* Navigation */}
        <nav className="sidebar-nav">
          <div className="sidebar-section-title">Main</div>
          {navItems.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              className={({ isActive }) => `sidebar-link${isActive ? ' active' : ''}`}
            >
              <i className={`bi ${item.icon}`}></i>
              <span>{item.label}</span>
            </NavLink>
          ))}

          <div className="sidebar-section-title" style={{ marginTop: 16 }}>System</div>
          {bottomItems.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              className={({ isActive }) => `sidebar-link${isActive ? ' active' : ''}`}
            >
              <i className={`bi ${item.icon}`}></i>
              <span>{item.label}</span>
            </NavLink>
          ))}
        </nav>

        {/* Footer */}
        <div className="sidebar-footer">
          <div
            className="sidebar-link"
            style={{ cursor: 'pointer', marginTop: 0 }}
            onClick={handleLogout}
            role="button"
            aria-label="Logout"
          >
            <div
              style={{
                width: 32,
                height: 32,
                borderRadius: '50%',
                background: 'linear-gradient(135deg, #3b82f6, #2563eb)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontWeight: 700,
                fontSize: 12,
                color: 'white',
                flexShrink: 0,
              }}
            >
              {user?.displayName?.[0] || 'A'}
            </div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-primary)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                {user?.displayName || 'Admin'}
              </div>
              <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>Logout</div>
            </div>
            <i className="bi bi-box-arrow-right" style={{ fontSize: 14 }}></i>
          </div>
        </div>
      </aside>
    </>
  )
}
