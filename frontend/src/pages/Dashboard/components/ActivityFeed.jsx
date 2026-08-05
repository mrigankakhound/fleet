import { useEffect, useState, useCallback } from 'react'
import { getActivity } from '../../../api/dashboard'
import { timeAgo } from '../../../utils/dateUtils'

const ACTION_CONFIG = {
  vehicle_added: { icon: 'bi-plus-circle', color: '#3b82f6', bg: 'rgba(59,130,246,0.15)', label: 'Vehicle Added' },
  vehicle_updated: { icon: 'bi-pencil', color: '#f59e0b', bg: 'rgba(245,158,11,0.15)', label: 'Vehicle Updated' },
  vehicle_deleted: { icon: 'bi-trash', color: '#ef4444', bg: 'rgba(239,68,68,0.15)', label: 'Vehicle Deleted' },
  insurance_renewed: { icon: 'bi-shield-check', color: '#22c55e', bg: 'rgba(34,197,94,0.15)', label: 'Insurance Renewed' },
  pollution_renewed: { icon: 'bi-cloud-check', color: '#22c55e', bg: 'rgba(34,197,94,0.15)', label: 'Pollution Renewed' },
  gps_renewed: { icon: 'bi-geo-alt', color: '#22c55e', bg: 'rgba(34,197,94,0.15)', label: 'GPS Renewed' },
  reminder_sent: { icon: 'bi-send-fill', color: '#3b82f6', bg: 'rgba(59,130,246,0.15)', label: 'Reminder Sent' },
  settings_updated: { icon: 'bi-gear', color: '#64748b', bg: 'rgba(100,116,139,0.15)', label: 'Settings Updated' },
  admin_login: { icon: 'bi-box-arrow-in-right', color: '#06b6d4', bg: 'rgba(6,182,212,0.15)', label: 'Admin Login' },
  admin_logout: { icon: 'bi-box-arrow-right', color: '#64748b', bg: 'rgba(100,116,139,0.15)', label: 'Admin Logout' },
  backup_created: { icon: 'bi-download', color: '#8b5cf6', bg: 'rgba(139,92,246,0.15)', label: 'Backup Created' },
}

export default function ActivityFeed() {
  const [activities, setActivities] = useState([])
  const [loading, setLoading] = useState(true)

  const fetchActivity = useCallback(async () => {
    try {
      const res = await getActivity({ limit: 20 })
      setActivities(res.data.data)
    } catch {}
    finally { setLoading(false) }
  }, [])

  useEffect(() => {
    fetchActivity()
    const interval = setInterval(fetchActivity, 30000)
    return () => clearInterval(interval)
  }, [fetchActivity])

  return (
    <div className="card" style={{ height: '100%' }}>
      <div className="card-header">
        <h3 className="card-title">
          <i className="bi bi-activity" style={{ color: 'var(--primary)' }}></i>
          Recent Activity
        </h3>
        <button
          onClick={fetchActivity}
          style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', fontSize: 14 }}
          title="Refresh"
        >
          <i className="bi bi-arrow-clockwise"></i>
        </button>
      </div>
      <div className="card-body" style={{ padding: '8px 20px', maxHeight: 360, overflowY: 'auto' }}>
        {loading ? (
          Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="activity-item">
              <div className="skeleton" style={{ width: 36, height: 36, borderRadius: '50%', flexShrink: 0 }}></div>
              <div style={{ flex: 1 }}>
                <div className="skeleton skeleton-text" style={{ width: '60%' }}></div>
                <div className="skeleton skeleton-text" style={{ width: '40%', height: 10 }}></div>
              </div>
            </div>
          ))
        ) : activities.length === 0 ? (
          <div className="empty-state" style={{ padding: 30 }}>
            <div className="empty-state-icon">📋</div>
            <div className="empty-state-text">No activity yet</div>
          </div>
        ) : (
          activities.map((a) => {
            const cfg = ACTION_CONFIG[a.action] || ACTION_CONFIG.vehicle_added
            return (
              <div key={a._id} className="activity-item">
                <div className="activity-icon" style={{ background: cfg.bg }}>
                  <i className={`bi ${cfg.icon}`} style={{ color: cfg.color }}></i>
                </div>
                <div className="activity-info">
                  <div className="activity-title">
                    {cfg.label}
                    {a.vehicleNumber && (
                      <span style={{ marginLeft: 6, fontWeight: 800, color: 'var(--primary)' }}>
                        · {a.vehicleNumber}
                      </span>
                    )}
                  </div>
                  <div className="activity-meta">
                    {a.details && <span>{a.details} · </span>}
                    {timeAgo(a.createdAt)}
                  </div>
                </div>
              </div>
            )
          })
        )}
      </div>
    </div>
  )
}
