export default function StatsCards({ stats, loading }) {
  const cards = [
    { key: 'totalVehicles', label: 'Total Vehicles', icon: 'bi-truck', colorClass: 'stat-blue' },
    { key: 'activeDocuments', label: 'Active Documents', icon: 'bi-shield-check', colorClass: 'stat-green' },
    { key: 'expiredDocuments', label: 'Expired Documents', icon: 'bi-exclamation-triangle', colorClass: 'stat-red' },
    { key: 'expiringToday', label: 'Expiring Today', icon: 'bi-clock', colorClass: 'stat-red' },
    { key: 'expiring7Days', label: 'Expiring in 7 Days', icon: 'bi-calendar-event', colorClass: 'stat-yellow' },
    { key: 'remindersSentToday', label: 'Reminders Sent Today', icon: 'bi-send-fill', colorClass: 'stat-cyan' },
  ]

  if (loading) {
    return (
      <div className="row g-3">
        {cards.map((_, i) => (
          <div key={i} className="col-md-4 col-lg-2">
            <div className="skeleton skeleton-card"></div>
          </div>
        ))}
      </div>
    )
  }

  return (
    <div className="row g-3">
      {cards.map((card) => (
        <div key={card.key} className="col-6 col-md-4 col-lg-2">
          <div className={`stat-card ${card.colorClass}`}>
            <div className="stat-card-icon">
              <i className={`bi ${card.icon}`}></i>
            </div>
            <div className="stat-card-info">
              <div className="stat-card-value">{stats?.[card.key] ?? 0}</div>
              <div className="stat-card-label">{card.label}</div>
            </div>
          </div>
        </div>
      ))}
    </div>
  )
}
