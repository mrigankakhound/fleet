import { useState } from 'react'
import Swal from 'sweetalert2'
import { toast } from 'react-toastify'
import { deleteVehicle } from '../../../api/vehicles'
import StatusBadge from '../../../components/shared/StatusBadge'
import RenewModal from './RenewModal'
import { formatDisplayDate, timeAgo } from '../../../utils/dateUtils'

export default function VehicleDrawer({ vehicle, onClose, onUpdated, onDeleted }) {
  const [renewModal, setRenewModal] = useState(null) // 'insurance' | 'pollution' | 'gps'
  const [currentVehicle, setCurrentVehicle] = useState(vehicle)

  const handleDelete = async () => {
    const result = await Swal.fire({
      title: 'Delete Vehicle?',
      text: `Are you sure you want to delete ${currentVehicle.vehicleNumber}? This cannot be undone.`,
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#ef4444',
      cancelButtonColor: '#334155',
      confirmButtonText: 'Yes, Delete',
      cancelButtonText: 'Cancel',
      background: '#1e293b',
      color: '#f1f5f9',
    })
    if (!result.isConfirmed) return
    try {
      await deleteVehicle(currentVehicle._id)
      toast.success(`Vehicle ${currentVehicle.vehicleNumber} deleted.`)
      onDeleted(currentVehicle._id)
      onClose()
    } catch {
      toast.error('Failed to delete vehicle.')
    }
  }

  const handleRenewed = (updatedVehicle) => {
    setCurrentVehicle(updatedVehicle)
    onUpdated(updatedVehicle)
  }

  const v = currentVehicle

  return (
    <>
      <div className="drawer-overlay" onClick={onClose} />
      <div className="drawer">
        <div className="drawer-header">
          <div>
            <h2 style={{ fontSize: 16, fontWeight: 700, margin: 0 }}>
              <i className="bi bi-truck" style={{ color: 'var(--primary)', marginRight: 8 }}></i>
              {v.vehicleNumber}
            </h2>
            <p style={{ fontSize: 12, color: 'var(--text-muted)', margin: '3px 0 0' }}>
              ID #{v.vehicleId} · Added {timeAgo(v.createdAt)}
            </p>
          </div>
          <div style={{ display: 'flex', gap: 8 }}>
            <button
              className="btn-fleet btn-sm-fleet btn-icon"
              style={{ background: 'rgba(239,68,68,0.1)', color: 'var(--danger)', border: '1px solid rgba(239,68,68,0.2)' }}
              onClick={handleDelete}
              title="Delete vehicle"
            >
              <i className="bi bi-trash"></i>
            </button>
            <button className="drawer-close" onClick={onClose}><i className="bi bi-x"></i></button>
          </div>
        </div>

        <div className="drawer-body">
          {/* Vehicle Info */}
          <div style={{ marginBottom: 20 }}>
            <p style={{ fontSize: 11, fontWeight: 600, letterSpacing: '0.5px', color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: 8 }}>
              Vehicle Information
            </p>
            <div className="card" style={{ border: 'none', background: 'rgba(15,23,42,0.5)' }}>
              <div className="card-body" style={{ padding: '4px 16px' }}>
                <div className="info-row">
                  <span className="info-label">Vehicle Name</span>
                  <span className="info-value">{v.vehicleName || '—'}</span>
                </div>
                <div className="info-row">
                  <span className="info-label">Owner</span>
                  <span className="info-value">{v.ownerName || '—'}</span>
                </div>
                <div className="info-row">
                  <span className="info-label">Driver</span>
                  <span className="info-value">{v.driverName || '—'}</span>
                </div>
                <div className="info-row">
                  <span className="info-label">WhatsApp</span>
                  <span className="info-value" style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                    {v.whatsappNumber || '—'}
                    {v.whatsappNumber && (
                      <a
                        href={`https://wa.me/${v.whatsappNumber.replace(/[^0-9]/g, '')}`}
                        target="_blank"
                        rel="noreferrer"
                        style={{ color: '#25d366', fontSize: 14 }}
                        title="Open in WhatsApp"
                      >
                        <i className="bi bi-whatsapp"></i>
                      </a>
                    )}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Documents */}
          <div style={{ marginBottom: 20 }}>
            <p style={{ fontSize: 11, fontWeight: 600, letterSpacing: '0.5px', color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: 8 }}>
              Document Expiry Dates
            </p>

            {[
              { key: 'insurance', label: 'Insurance', icon: 'bi-shield', color: '#3b82f6', field: 'insuranceExpiry' },
              { key: 'pollution', label: 'Pollution (PUC)', icon: 'bi-cloud', color: '#22c55e', field: 'pollutionExpiry' },
              { key: 'gps', label: 'GPS', icon: 'bi-geo-alt', color: '#f59e0b', field: 'gpsExpiry' },
            ].map((doc) => (
              <div key={doc.key} style={{
                background: 'rgba(15,23,42,0.5)',
                border: '1px solid var(--border)',
                borderRadius: 10,
                padding: '14px 16px',
                marginBottom: 8,
                display: 'flex',
                alignItems: 'center',
                gap: 14,
              }}>
                <div style={{
                  width: 40, height: 40, borderRadius: 10,
                  background: `${doc.color}18`,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  color: doc.color, fontSize: 17, flexShrink: 0,
                }}>
                  <i className={`bi ${doc.icon}`}></i>
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 11, color: 'var(--text-muted)', fontWeight: 600, marginBottom: 4 }}>{doc.label}</div>
                  <StatusBadge expiryDate={v[doc.field]} />
                </div>
                <button
                  className="btn-fleet btn-sm-fleet"
                  style={{
                    background: `${doc.color}15`,
                    color: doc.color,
                    border: `1px solid ${doc.color}30`,
                    flexShrink: 0,
                  }}
                  onClick={() => setRenewModal(doc.key)}
                >
                  <i className="bi bi-arrow-repeat"></i>
                  Renew
                </button>
              </div>
            ))}
          </div>

          {/* Notes */}
          {v.notes && (
            <div style={{ marginBottom: 20 }}>
              <p style={{ fontSize: 11, fontWeight: 600, letterSpacing: '0.5px', color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: 8 }}>
                Notes
              </p>
              <div style={{
                background: 'rgba(15,23,42,0.5)',
                border: '1px solid var(--border)',
                borderRadius: 10,
                padding: '12px 16px',
                fontSize: 13,
                color: 'var(--text-secondary)',
                lineHeight: 1.6,
              }}>
                {v.notes}
              </div>
            </div>
          )}

          {/* Reminder History */}
          {v.reminderHistory?.length > 0 && (
            <div>
              <p style={{ fontSize: 11, fontWeight: 600, letterSpacing: '0.5px', color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: 8 }}>
                Reminder History
              </p>
              <div style={{
                background: 'rgba(15,23,42,0.5)',
                border: '1px solid var(--border)',
                borderRadius: 10,
                overflow: 'hidden',
                maxHeight: 200,
                overflowY: 'auto',
              }}>
                {v.reminderHistory.map((log) => (
                  <div key={log._id} style={{
                    display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                    padding: '10px 14px',
                    borderBottom: '1px solid rgba(51,65,85,0.5)',
                    fontSize: 12,
                  }}>
                    <div>
                      <span style={{ fontWeight: 600, color: 'var(--text-primary)', textTransform: 'capitalize' }}>
                        {log.documentType}
                      </span>
                      <span style={{ color: 'var(--text-muted)', marginLeft: 6 }}>
                        · {log.reminderDays === 0 ? 'Today' : `${log.reminderDays}d prior`}
                      </span>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <span style={{
                        fontSize: 10,
                        padding: '2px 7px',
                        borderRadius: 10,
                        background: log.status === 'sent' ? 'rgba(34,197,94,0.15)' : log.status === 'mock' ? 'rgba(59,130,246,0.15)' : 'rgba(239,68,68,0.15)',
                        color: log.status === 'sent' ? '#22c55e' : log.status === 'mock' ? '#3b82f6' : '#ef4444',
                        fontWeight: 600,
                      }}>
                        {log.status}
                      </span>
                      <span style={{ color: 'var(--text-muted)' }}>{timeAgo(log.sentAt)}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      {renewModal && (
        <RenewModal
          vehicle={v}
          documentType={renewModal}
          onClose={() => setRenewModal(null)}
          onRenewed={handleRenewed}
        />
      )}
    </>
  )
}
