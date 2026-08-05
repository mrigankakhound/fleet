import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { toast } from 'react-toastify'
import { renewDocument } from '../../../api/vehicles'
import { formatDisplayDate, formatInputDate } from '../../../utils/dateUtils'

const DOC_CONFIG = {
  insurance: { label: 'Insurance', icon: 'bi-shield', color: '#3b82f6' },
  pollution: { label: 'Pollution (PUC)', icon: 'bi-cloud', color: '#22c55e' },
  gps: { label: 'GPS', icon: 'bi-geo-alt', color: '#f59e0b' },
}

const EXPIRY_FIELD = {
  insurance: 'insuranceExpiry',
  pollution: 'pollutionExpiry',
  gps: 'gpsExpiry',
}

export default function RenewModal({ vehicle, documentType, onClose, onRenewed }) {
  const [loading, setLoading] = useState(false)
  const cfg = DOC_CONFIG[documentType]
  const currentExpiry = vehicle?.[EXPIRY_FIELD[documentType]]

  const { register, handleSubmit, formState: { errors } } = useForm({
    defaultValues: { newExpiryDate: '' },
  })

  const onSubmit = async (data) => {
    setLoading(true)
    try {
      const res = await renewDocument(vehicle._id, {
        documentType,
        newExpiryDate: data.newExpiryDate,
      })
      toast.success(`${cfg.label} renewed successfully!`)
      onRenewed(res.data.data)
      onClose()
    } catch (err) {
      toast.error(err.response?.data?.message || 'Renewal failed.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-box" style={{ maxWidth: 420 }} onClick={(e) => e.stopPropagation()}>
        <div style={{ textAlign: 'center', marginBottom: 20 }}>
          <div style={{
            width: 56, height: 56,
            background: `${cfg.color}20`,
            borderRadius: '50%',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            margin: '0 auto 12px',
            fontSize: 22, color: cfg.color,
          }}>
            <i className={`bi ${cfg.icon}`}></i>
          </div>
          <h2 style={{ fontSize: 17, fontWeight: 700, margin: 0 }}>Renew {cfg.label}</h2>
          <p style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 4 }}>
            Vehicle: <strong style={{ color: 'var(--text-primary)' }}>{vehicle?.vehicleNumber}</strong>
          </p>
        </div>

        {/* Current expiry */}
        <div style={{
          background: 'rgba(15,23,42,0.6)',
          border: '1px solid var(--border)',
          borderRadius: 10,
          padding: '12px 16px',
          marginBottom: 20,
          display: 'flex', justifyContent: 'space-between',
        }}>
          <div>
            <div style={{ fontSize: 11, color: 'var(--text-muted)', fontWeight: 600, marginBottom: 2 }}>CURRENT EXPIRY</div>
            <div style={{ fontSize: 14, fontWeight: 700, color: currentExpiry ? 'var(--danger)' : 'var(--text-muted)' }}>
              {currentExpiry ? formatDisplayDate(currentExpiry) : 'Not set'}
            </div>
          </div>
          <i className="bi bi-arrow-right" style={{ color: 'var(--text-muted)', fontSize: 18, alignSelf: 'center' }}></i>
          <div>
            <div style={{ fontSize: 11, color: 'var(--text-muted)', fontWeight: 600, marginBottom: 2, textAlign: 'right' }}>NEW EXPIRY</div>
            <div style={{ fontSize: 14, fontWeight: 700, color: 'var(--success)', textAlign: 'right' }}>— set below —</div>
          </div>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} noValidate>
          <div style={{ marginBottom: 20 }}>
            <label className="form-label-fleet">New Expiry Date *</label>
            <input
              id="renew-expiry-date"
              type="date"
              className="form-control-fleet"
              min={new Date().toISOString().split('T')[0]}
              {...register('newExpiryDate', { required: 'Please select a new expiry date' })}
            />
            {errors.newExpiryDate && <p className="form-error">{errors.newExpiryDate.message}</p>}
          </div>

          <div style={{ display: 'flex', gap: 10 }}>
            <button type="button" className="btn-fleet btn-ghost" onClick={onClose} style={{ flex: 1, justifyContent: 'center' }}>
              Cancel
            </button>
            <button type="submit" disabled={loading} className="btn-fleet btn-success-fleet" style={{ flex: 2, justifyContent: 'center' }}>
              {loading ? (
                <><span className="spinner-border spinner-border-sm me-2"></span>Renewing...</>
              ) : (
                <><i className="bi bi-check-circle"></i>Renew {cfg.label}</>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
