import { Link } from 'react-router-dom'

export default function WarningBanner({ stats }) {
  const { expiringToday = 0, expiring7Days = 0, expiredDocuments = 0 } = stats || {}

  if (expiringToday === 0 && expiredDocuments === 0 && expiring7Days === 0) return null

  const isUrgent = expiringToday > 0 || expiredDocuments > 0

  return (
    <div className={`warning-banner ${isUrgent ? 'urgent' : 'caution'}`}>
      <span style={{ fontSize: 22 }}>{isUrgent ? '⚠️' : '📅'}</span>
      <div style={{ flex: 1 }}>
        {expiredDocuments > 0 && (
          <div style={{ fontWeight: 700, color: 'var(--danger)', fontSize: 14 }}>
            🔴 {expiredDocuments} document{expiredDocuments !== 1 ? 's' : ''} have already expired.
          </div>
        )}
        {expiringToday > 0 && (
          <div style={{ fontWeight: 700, color: 'var(--danger)', fontSize: 14 }}>
            ⚠️ {expiringToday} document{expiringToday !== 1 ? 's' : ''} expire today.
          </div>
        )}
        {expiring7Days > 0 && (
          <div style={{ fontWeight: 600, color: 'var(--warning)', fontSize: 13, marginTop: 2 }}>
            📅 {expiring7Days} document{expiring7Days !== 1 ? 's' : ''} expire within 7 days.
          </div>
        )}
      </div>
      <Link
        to="/vehicles?status=expired"
        className="btn-fleet btn-sm-fleet"
        style={{
          background: isUrgent ? 'rgba(239,68,68,0.2)' : 'rgba(245,158,11,0.2)',
          color: isUrgent ? 'var(--danger)' : 'var(--warning)',
          border: `1px solid ${isUrgent ? 'rgba(239,68,68,0.4)' : 'rgba(245,158,11,0.4)'}`,
          flexShrink: 0,
          textDecoration: 'none',
        }}
      >
        View Details
        <i className="bi bi-arrow-right"></i>
      </Link>
    </div>
  )
}
