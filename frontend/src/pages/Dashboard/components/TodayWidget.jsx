export default function TodayWidget({ data, loading }) {
  const items = [
    { key: 'insurance', label: 'Insurance', icon: 'bi-shield', color: '#3b82f6' },
    { key: 'pollution', label: 'Pollution (PUC)', icon: 'bi-cloud', color: '#22c55e' },
    { key: 'gps', label: 'GPS', icon: 'bi-geo-alt', color: '#f59e0b' },
  ]

  return (
    <div className="card" style={{ height: '100%' }}>
      <div className="card-header">
        <h3 className="card-title">
          <i className="bi bi-calendar-check" style={{ color: 'var(--primary)' }}></i>
          Today's Workload
        </h3>
        <span style={{
          fontSize: 11,
          background: 'rgba(59,130,246,0.1)',
          color: 'var(--primary)',
          padding: '3px 8px',
          borderRadius: 20,
          fontWeight: 600,
        }}>
          {new Date().toLocaleDateString('en-IN', { day: '2-digit', month: 'short' })}
        </span>
      </div>
      <div className="card-body">
        {loading ? (
          <>
            <div className="skeleton skeleton-row" style={{ height: 48 }}></div>
            <div className="skeleton skeleton-row" style={{ height: 48, marginTop: 8 }}></div>
            <div className="skeleton skeleton-row" style={{ height: 48, marginTop: 8 }}></div>
          </>
        ) : (
          <>
            {items.map((item) => (
              <div key={item.key} className="today-widget-row">
                <div className="today-doc-type">
                  <span style={{
                    width: 34, height: 34, borderRadius: 8,
                    background: `${item.color}20`,
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    color: item.color, fontSize: 15,
                  }}>
                    <i className={`bi ${item.icon}`}></i>
                  </span>
                  {item.label}
                </div>
                <div className="today-count" style={{ color: data?.[item.key] > 0 ? '#ef4444' : 'var(--text-muted)' }}>
                  {data?.[item.key] ?? 0}
                </div>
              </div>
            ))}
            <div style={{
              marginTop: 12, paddingTop: 12,
              borderTop: '1px solid var(--border)',
              display: 'flex', justifyContent: 'space-between', alignItems: 'center',
            }}>
              <span style={{ fontSize: 12, color: 'var(--text-muted)', fontWeight: 600 }}>TOTAL TODAY</span>
              <span style={{ fontSize: 24, fontWeight: 800, color: (data?.total || 0) > 0 ? '#ef4444' : 'var(--text-muted)' }}>
                {data?.total ?? 0}
              </span>
            </div>
          </>
        )}
      </div>
    </div>
  )
}
