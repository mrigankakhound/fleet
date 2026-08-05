import { useState, useEffect } from 'react'
import { getCalendar } from '../../../api/dashboard'

const DAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']
const MONTHS = ['January','February','March','April','May','June','July','August','September','October','November','December']

export default function CalendarWidget() {
  const [calData, setCalData] = useState([])
  const [currentDate, setCurrentDate] = useState(new Date())
  const [selectedDay, setSelectedDay] = useState(null)
  const [loading, setLoading] = useState(true)

  const month = currentDate.getMonth() + 1
  const year = currentDate.getFullYear()

  useEffect(() => {
    const fetchCalendar = async () => {
      setLoading(true)
      try {
        const res = await getCalendar({ month, year })
        setCalData(res.data.data)
      } catch {}
      finally { setLoading(false) }
    }
    fetchCalendar()
  }, [month, year])

  const dateMap = {}
  calData.forEach((d) => { dateMap[d.date] = d })

  const firstDay = new Date(year, month - 1, 1).getDay()
  const daysInMonth = new Date(year, month, 0).getDate()
  const today = new Date()

  const cells = []
  for (let i = 0; i < firstDay; i++) cells.push(null)
  for (let d = 1; d <= daysInMonth; d++) cells.push(d)

  const prevMonth = () => setCurrentDate(new Date(year, month - 2, 1))
  const nextMonth = () => setCurrentDate(new Date(year, month, 1))

  const getCellClass = (day) => {
    if (!day) return 'calendar-day other-month'
    const key = `${year}-${String(month).padStart(2,'0')}-${String(day).padStart(2,'0')}`
    const isToday = today.getDate() === day && today.getMonth() + 1 === month && today.getFullYear() === year
    const dayData = dateMap[key]
    let cls = 'calendar-day'
    if (isToday) cls += ' today'
    if (dayData) {
      if (dayData.status === 'expired') cls += ' has-expired'
      else if (dayData.status === 'expiring') cls += ' has-expiring'
      else cls += ' has-valid'
    }
    return cls
  }

  const handleDayClick = (day) => {
    if (!day) return
    const key = `${year}-${String(month).padStart(2,'0')}-${String(day).padStart(2,'0')}`
    const dayData = dateMap[key]
    if (dayData) setSelectedDay(dayData)
  }

  return (
    <div className="card" style={{ height: '100%' }}>
      <div className="card-header">
        <h3 className="card-title">
          <i className="bi bi-calendar3" style={{ color: 'var(--primary)' }}></i>
          Expiry Calendar
        </h3>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <button onClick={prevMonth} style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', fontSize: 14, padding: '2px 6px' }}>
            <i className="bi bi-chevron-left"></i>
          </button>
          <span style={{ fontSize: 12, fontWeight: 700, color: 'var(--text-secondary)', minWidth: 100, textAlign: 'center' }}>
            {MONTHS[month-1]} {year}
          </span>
          <button onClick={nextMonth} style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', fontSize: 14, padding: '2px 6px' }}>
            <i className="bi bi-chevron-right"></i>
          </button>
        </div>
      </div>
      <div className="card-body" style={{ padding: '12px 16px' }}>
        {loading ? (
          <div className="skeleton" style={{ height: 200, borderRadius: 8 }}></div>
        ) : (
          <>
            {/* Legend */}
            <div style={{ display: 'flex', gap: 12, marginBottom: 10, flexWrap: 'wrap' }}>
              {[
                { color: 'rgba(34,197,94,0.3)', label: 'Valid' },
                { color: 'rgba(245,158,11,0.3)', label: 'Expiring' },
                { color: 'rgba(239,68,68,0.3)', label: 'Expired' },
              ].map((l) => (
                <div key={l.label} style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: 11, color: 'var(--text-muted)' }}>
                  <span style={{ width: 10, height: 10, borderRadius: 2, background: l.color, display: 'inline-block' }}></span>
                  {l.label}
                </div>
              ))}
            </div>

            {/* Day headers */}
            <div className="calendar-grid" style={{ marginBottom: 4 }}>
              {DAYS.map((d) => (
                <div key={d} className="calendar-day-header">{d}</div>
              ))}
            </div>

            {/* Day cells */}
            <div className="calendar-grid">
              {cells.map((day, i) => (
                <div key={i} className={getCellClass(day)} onClick={() => handleDayClick(day)}>
                  <span>{day || ''}</span>
                </div>
              ))}
            </div>

            {/* Selected day popup */}
            {selectedDay && (
              <div style={{
                marginTop: 12, padding: '12px 14px',
                background: 'rgba(15,23,42,0.8)',
                border: '1px solid var(--border)',
                borderRadius: 10,
              }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8, alignItems: 'center' }}>
                  <span style={{ fontSize: 12, fontWeight: 700, color: 'var(--text-secondary)' }}>
                    📅 {selectedDay.date}
                  </span>
                  <button onClick={() => setSelectedDay(null)} style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', fontSize: 14 }}>
                    <i className="bi bi-x"></i>
                  </button>
                </div>
                {selectedDay.items.map((item, idx) => (
                  <div key={idx} style={{
                    display: 'flex', justifyContent: 'space-between',
                    padding: '4px 0',
                    fontSize: 12,
                    borderBottom: idx < selectedDay.items.length - 1 ? '1px solid rgba(51,65,85,0.5)' : 'none',
                  }}>
                    <span style={{ fontWeight: 600, color: 'var(--text-primary)' }}>{item.vehicleNumber}</span>
                    <span style={{
                      color: item.status === 'expired' ? 'var(--danger)' : item.status === 'expiring' ? 'var(--warning)' : 'var(--success)',
                      fontWeight: 600,
                    }}>{item.docType}</span>
                  </div>
                ))}
              </div>
            )}
          </>
        )}
      </div>
    </div>
  )
}
