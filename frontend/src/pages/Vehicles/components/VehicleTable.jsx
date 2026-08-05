import StatusBadge from '../../../components/shared/StatusBadge'

export default function VehicleTable({ vehicles, loading, onRowClick }) {
  if (loading) {
    return (
      <div style={{ padding: '20px' }}>
        {Array.from({ length: 8 }).map((_, i) => (
          <div key={i} className="skeleton skeleton-row" style={{ marginBottom: 4 }}></div>
        ))}
      </div>
    )
  }

  if (vehicles.length === 0) {
    return (
      <div className="empty-state">
        <div className="empty-state-icon">🚛</div>
        <div className="empty-state-title">No vehicles found</div>
        <div className="empty-state-text">Try adjusting your search or add a new vehicle using the + button.</div>
      </div>
    )
  }

  return (
    <div style={{ overflowX: 'auto' }}>
      <table className="fleet-table" id="vehicles-table">
        <thead>
          <tr>
            <th>ID</th>
            <th>Vehicle</th>
            <th>Owner / WhatsApp</th>
            <th>Insurance</th>
            <th>Pollution (PUC)</th>
            <th>GPS</th>
          </tr>
        </thead>
        <tbody>
          {vehicles.map((v) => (
            <tr key={v._id} onClick={() => onRowClick(v)} title="Click to view details">
              <td>
                <span className="vehicle-id-badge">{v.vehicleId}</span>
              </td>
              <td className="vehicle-number">
                <div>{v.vehicleNumber}</div>
                {v.vehicleName && (
                  <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 2, fontWeight: 500 }}>
                    <i className="bi bi-tag me-1"></i>{v.vehicleName}
                  </div>
                )}
              </td>
              <td>
                <div style={{ fontWeight: 600, color: 'var(--primary-dark)', fontSize: 13 }}>
                  {v.ownerName || '—'}
                </div>
                {v.whatsappNumber && (
                  <div style={{ fontSize: 11, color: '#25d366', marginTop: 2 }}>
                    <i className="bi bi-whatsapp me-1"></i>{v.whatsappNumber}
                  </div>
                )}
              </td>
              <td><StatusBadge expiryDate={v.insuranceExpiry} /></td>
              <td><StatusBadge expiryDate={v.pollutionExpiry} /></td>
              <td><StatusBadge expiryDate={v.gpsExpiry} /></td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
