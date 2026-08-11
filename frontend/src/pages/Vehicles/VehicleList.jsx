import { useState, useEffect, useCallback, useRef } from 'react'
import { useSearchParams } from 'react-router-dom'
import { toast } from 'react-toastify'
import { getVehicles, exportVehicles } from '../../api/vehicles'
import TopNav from '../../components/layout/TopNav'
import FloatingActionButton from '../../components/layout/FloatingActionButton'
import VehicleTable from './components/VehicleTable'
import VehicleDrawer from './components/VehicleDrawer'
import AddVehicleModal from './components/AddVehicleModal'

const STATUS_FILTERS = [
  { value: '', label: 'All Vehicles' },
  { value: 'expired', label: '🔴 Expired' },
  { value: 'expiring7', label: '🟠 Expiring in 7 Days' },
  { value: 'expiring30', label: '🟡 Expiring in 30 Days' },
]

export default function VehicleList() {
  const [searchParams] = useSearchParams()
  const [vehicles, setVehicles] = useState([])
  const [pagination, setPagination] = useState({ page: 1, limit: 25, total: 0, totalPages: 1 })
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [status, setStatus] = useState(searchParams.get('status') || '')
  const [selectedVehicle, setSelectedVehicle] = useState(null)
  const [showAddModal, setShowAddModal] = useState(false)
  const [exportLoading, setExportLoading] = useState(false)
  const searchTimer = useRef(null)

  const fetchVehicles = useCallback(async (page = 1, searchVal = search, statusVal = status) => {
    setLoading(true)
    try {
      const res = await getVehicles({ page, limit: 25, search: searchVal, status: statusVal })
      setVehicles(res.data.data.vehicles)
      setPagination(res.data.data.pagination)
    } catch {
      toast.error('Failed to load vehicles.')
    } finally {
      setLoading(false)
    }
  }, [search, status])

  useEffect(() => { fetchVehicles(1) }, [status])

  // Debounced search
  const handleSearch = (val) => {
    setSearch(val)
    clearTimeout(searchTimer.current)
    searchTimer.current = setTimeout(() => {
      fetchVehicles(1, val, status)
    }, 300)
  }

  const handleExport = async () => {
    setExportLoading(true)
    try {
      const res = await exportVehicles({ search, status })
      const url = window.URL.createObjectURL(new Blob([res.data]))
      const a = document.createElement('a')
      a.href = url
      a.download = `fleet-vehicles-${new Date().toISOString().slice(0, 10)}.xlsx`
      document.body.appendChild(a)
      a.click()
      a.remove()
      window.URL.revokeObjectURL(url)
      toast.success('Export downloaded successfully!')
    } catch {
      toast.error('Export failed.')
    } finally {
      setExportLoading(false)
    }
  }

  const handleVehicleUpdated = (updatedVehicle) => {
    setVehicles((prev) => prev.map((v) => v._id === updatedVehicle._id ? updatedVehicle : v))
    if (selectedVehicle?._id === updatedVehicle._id) {
      setSelectedVehicle(updatedVehicle)
    }
  }

  const handleVehicleDeleted = (id) => {
    setVehicles((prev) => prev.filter((v) => v._id !== id))
    setSelectedVehicle(null)
    setPagination((prev) => ({ ...prev, total: prev.total - 1 }))
  }

  const handleAdded = () => {
    fetchVehicles(1)
  }

  const pages = Array.from({ length: Math.min(pagination.totalPages, 7) }, (_, i) => i + 1)

  return (
    <>
      <TopNav onSearchChange={handleSearch} searchValue={search} />
      <div className="page-content">
        {/* Header */}
        <div className="page-header">
          <div>
            <h1 className="page-title">
              <span style={{ color: 'var(--primary)' }}>Vehicles</span>
            </h1>
            <p className="page-subtitle">
              {pagination.total} vehicle{pagination.total !== 1 ? 's' : ''} · {search ? `"${search}"` : 'All records'}
            </p>
          </div>
          <div className="page-header-actions">
            <button
              className="btn-fleet btn-ghost"
              onClick={handleExport}
              disabled={exportLoading}
              id="export-vehicles-btn"
            >
              {exportLoading ? (
                <span className="spinner-border spinner-border-sm"></span>
              ) : (
                <i className="bi bi-file-earmark-excel"></i>
              )}
              Export
            </button>
            <button
              className="btn-fleet btn-primary-fleet"
              onClick={() => setShowAddModal(true)}
              id="add-vehicle-btn"
            >
              <i className="bi bi-plus-lg"></i>
              Add Vehicle
            </button>
          </div>
        </div>

        {/* Filter Bar */}
        <div className="filter-bar" style={{ display: 'flex', gap: 8, marginBottom: 16, flexWrap: 'wrap', alignItems: 'center' }}>
          <div className="tab-nav" style={{ flex: 'none' }}>
            {STATUS_FILTERS.map((f) => (
              <button
                key={f.value}
                className={`tab-btn${status === f.value ? ' active' : ''}`}
                onClick={() => { setStatus(f.value); fetchVehicles(1, search, f.value) }}
              >
                {f.label}
              </button>
            ))}
          </div>
          <div style={{ marginLeft: 'auto', fontSize: 12, color: 'var(--text-muted)' }}>
            Page {pagination.page} of {pagination.totalPages}
          </div>
        </div>

        {/* Table Card */}
        <div className="card">
          <VehicleTable
            vehicles={vehicles}
            loading={loading}
            onRowClick={setSelectedVehicle}
          />

          {/* Pagination */}
          {pagination.totalPages > 1 && (
            <div className="pagination-fleet">
              <button
                className="page-btn"
                onClick={() => fetchVehicles(pagination.page - 1)}
                disabled={pagination.page <= 1}
              >
                <i className="bi bi-chevron-left"></i>
              </button>

              {Array.from({ length: pagination.totalPages }, (_, i) => i + 1)
                .filter((p) => p === 1 || p === pagination.totalPages || Math.abs(p - pagination.page) <= 2)
                .map((p, idx, arr) => (
                  <div key={p} style={{ display: 'contents' }}>
                    {idx > 0 && arr[idx - 1] !== p - 1 && (
                      <span style={{ color: 'var(--text-muted)', padding: '0 4px' }}>…</span>
                    )}
                    <button
                      className={`page-btn${pagination.page === p ? ' active' : ''}`}
                      onClick={() => fetchVehicles(p)}
                    >
                      {p}
                    </button>
                  </div>
                ))}

              <button
                className="page-btn"
                onClick={() => fetchVehicles(pagination.page + 1)}
                disabled={pagination.page >= pagination.totalPages}
              >
                <i className="bi bi-chevron-right"></i>
              </button>

              <span style={{ marginLeft: 'auto', fontSize: 12, color: 'var(--text-muted)' }}>
                {pagination.total} total
              </span>
            </div>
          )}
        </div>
      </div>

      {/* Vehicle Drawer */}
      {selectedVehicle && (
        <VehicleDrawer
          vehicle={selectedVehicle}
          onClose={() => setSelectedVehicle(null)}
          onUpdated={handleVehicleUpdated}
          onDeleted={handleVehicleDeleted}
        />
      )}

      {/* Add Vehicle Modal */}
      {showAddModal && (
        <AddVehicleModal
          onClose={() => setShowAddModal(false)}
          onAdded={handleAdded}
        />
      )}

      <FloatingActionButton onAddVehicle={() => setShowAddModal(true)} />
    </>
  )
}
