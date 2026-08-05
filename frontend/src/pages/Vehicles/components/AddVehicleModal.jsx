import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { toast } from 'react-toastify'
import { createVehicle } from '../../../api/vehicles'

export default function AddVehicleModal({ onClose, onAdded }) {
  const [loading, setLoading] = useState(false)
  const { register, handleSubmit, formState: { errors }, reset } = useForm()

  const onSubmit = async (data) => {
    setLoading(true)
    try {
      const res = await createVehicle(data)
      toast.success(`Vehicle ${res.data.data.vehicleNumber} added successfully!`)
      reset()
      onAdded(res.data.data)
      onClose()
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to add vehicle.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-box" style={{ maxWidth: 560 }} onClick={(e) => e.stopPropagation()}>
        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
          <div>
            <h2 style={{ fontSize: 18, fontWeight: 700, margin: 0 }}>
              <i className="bi bi-plus-circle" style={{ color: 'var(--primary)', marginRight: 8 }}></i>
              Add New Vehicle
            </h2>
            <p style={{ fontSize: 12, color: 'var(--text-muted)', margin: '4px 0 0' }}>Fill in the vehicle details below</p>
          </div>
          <button className="drawer-close" onClick={onClose}><i className="bi bi-x"></i></button>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} noValidate>
          <div className="row g-3">

            {/* Row 1: Vehicle Name | Vehicle Number */}
            <div className="col-md-6">
              <label className="form-label-fleet">Vehicle Name</label>
              <input
                className="form-control-fleet"
                placeholder="e.g. Truck A, Bus 1"
                {...register('vehicleName')}
              />
            </div>

            <div className="col-md-6">
              <label className="form-label-fleet">Vehicle Number *</label>
              <input
                className="form-control-fleet"
                placeholder="e.g. AS03AB4642"
                style={{ textTransform: 'uppercase' }}
                {...register('vehicleNumber', { required: 'Vehicle number is required' })}
              />
              {errors.vehicleNumber && <p className="form-error">{errors.vehicleNumber.message}</p>}
            </div>

            {/* Row 2: Owner Name (optional) | WhatsApp Number */}
            <div className="col-md-6">
              <label className="form-label-fleet">
                Owner Name
                <span style={{ fontSize: 10, color: 'var(--text-muted)', fontWeight: 400, marginLeft: 6 }}>(optional)</span>
              </label>
              <input
                className="form-control-fleet"
                placeholder="Owner full name"
                {...register('ownerName')}
              />
            </div>

            <div className="col-md-6">
              <label className="form-label-fleet">
                WhatsApp Number
                <span style={{ fontSize: 10, color: 'var(--text-muted)', fontWeight: 400, marginLeft: 6 }}>(for reminders)</span>
              </label>
              <input
                className="form-control-fleet"
                placeholder="+91 9876543210"
                {...register('whatsappNumber')}
              />
            </div>

            {/* Divider */}
            <div className="col-12">
              <div style={{ height: 1, background: 'var(--border)', margin: '4px 0 8px' }}></div>
              <p style={{ fontSize: 11, color: 'var(--text-muted)', fontWeight: 600, letterSpacing: '0.5px', textTransform: 'uppercase' }}>
                Document Expiry Dates
              </p>
            </div>

            {/* Document Dates */}
            <div className="col-md-4">
              <label className="form-label-fleet">
                <i className="bi bi-shield" style={{ color: '#3b82f6', marginRight: 4 }}></i>
                Insurance Expiry
              </label>
              <input type="date" className="form-control-fleet" {...register('insuranceExpiry')} />
            </div>

            <div className="col-md-4">
              <label className="form-label-fleet">
                <i className="bi bi-cloud" style={{ color: '#22c55e', marginRight: 4 }}></i>
                Pollution Expiry
              </label>
              <input type="date" className="form-control-fleet" {...register('pollutionExpiry')} />
            </div>

            <div className="col-md-4">
              <label className="form-label-fleet">
                <i className="bi bi-geo-alt" style={{ color: '#f59e0b', marginRight: 4 }}></i>
                GPS Expiry
              </label>
              <input type="date" className="form-control-fleet" {...register('gpsExpiry')} />
            </div>

            {/* Notes */}
            <div className="col-12">
              <label className="form-label-fleet">Notes</label>
              <textarea
                className="form-control-fleet"
                rows={2}
                placeholder="Any additional notes..."
                {...register('notes')}
                style={{ resize: 'none' }}
              />
            </div>
          </div>

          <div style={{ display: 'flex', gap: 10, marginTop: 24 }}>
            <button type="button" className="btn-fleet btn-ghost" onClick={onClose} style={{ flex: 1, justifyContent: 'center' }}>
              Cancel
            </button>
            <button type="submit" disabled={loading} className="btn-fleet btn-primary-fleet" style={{ flex: 2, justifyContent: 'center' }}>
              {loading ? (
                <><span className="spinner-border spinner-border-sm me-2"></span>Adding...</>
              ) : (
                <><i className="bi bi-plus-lg"></i>Add Vehicle</>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
