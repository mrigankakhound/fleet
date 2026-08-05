import { getDocumentStatus, formatDisplayDate } from '../../utils/dateUtils'

export default function StatusBadge({ expiryDate, showDate = true }) {
  const s = getDocumentStatus(expiryDate)

  if (s.status === 'na') {
    return <span className="status-badge status-na">⚪ N/A</span>
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
      {showDate && (
        <span style={{ fontSize: 12, fontWeight: 600, color: '#0c0909' }}>
          {s.emoji} {formatDisplayDate(expiryDate)}
        </span>
      )}
      <span className={`status-badge ${s.badgeClass}`}>{s.label}</span>
    </div>
  )
}
