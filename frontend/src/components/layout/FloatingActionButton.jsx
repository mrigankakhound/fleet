import { useState } from 'react'

export default function FloatingActionButton({ onAddVehicle }) {
  const [open, setOpen] = useState(false)

  return (
    <div className="fab">
      {open && (
        <div className="fab-menu">
          <button
            className="fab-menu-item"
            id="fab-add-vehicle"
            onClick={() => {
              setOpen(false)
              onAddVehicle?.()
            }}
          >
            <i className="bi bi-plus-circle" style={{ color: 'var(--primary)' }}></i>
            Add Vehicle
          </button>
        </div>
      )}
      <button
        className="fab-btn"
        id="fab-main-btn"
        onClick={() => setOpen((v) => !v)}
        title="Quick Actions"
      >
        <i className={`bi ${open ? 'bi-x' : 'bi-plus'}`}></i>
      </button>
    </div>
  )
}
