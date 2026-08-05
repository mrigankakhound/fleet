import { useEffect, useState } from 'react'
import { Chart as ChartJS, ArcElement, Tooltip, Legend } from 'chart.js'
import { Doughnut } from 'react-chartjs-2'
import { getDistributionChart } from '../../../api/dashboard'

ChartJS.register(ArcElement, Tooltip, Legend)

export default function PieChart() {
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    getDistributionChart()
      .then((res) => setData(res.data.data))
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [])

  const total = data ? data.valid + data.expiringSoon + data.expired : 0

  const chartData = {
    labels: ['Valid', 'Expiring Soon', 'Expired'],
    datasets: [
      {
        data: data ? [data.valid, data.expiringSoon, data.expired] : [0, 0, 0],
        backgroundColor: [
          'rgba(34,197,94,0.85)',
          'rgba(245,158,11,0.85)',
          'rgba(239,68,68,0.85)',
        ],
        borderColor: ['#22c55e', '#f59e0b', '#ef4444'],
        borderWidth: 2,
        hoverOffset: 8,
      },
    ],
  }

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    cutout: '68%',
    plugins: {
      legend: {
        position: 'bottom',
        labels: {
          color: '#94a3b8',
          font: { family: 'Inter', size: 11 },
          boxWidth: 12,
          padding: 14,
        },
      },
      tooltip: {
        backgroundColor: '#1e293b',
        borderColor: '#334155',
        borderWidth: 1,
        titleColor: '#f1f5f9',
        bodyColor: '#94a3b8',
        titleFont: { family: 'Inter', size: 12 },
        bodyFont: { family: 'Inter', size: 12 },
        padding: 10,
        callbacks: {
          label: (ctx) => {
            const pct = total ? ((ctx.parsed / total) * 100).toFixed(1) : 0
            return ` ${ctx.label}: ${ctx.parsed} (${pct}%)`
          },
        },
      },
    },
  }

  return (
    <div className="card" style={{ height: '100%' }}>
      <div className="card-header">
        <h3 className="card-title">
          <i className="bi bi-pie-chart" style={{ color: 'var(--primary)' }}></i>
          Document Distribution
        </h3>
        {total > 0 && (
          <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>{total} total</span>
        )}
      </div>
      <div className="card-body" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        {loading ? (
          <div className="skeleton" style={{ width: 180, height: 180, borderRadius: '50%' }}></div>
        ) : total === 0 ? (
          <div className="empty-state" style={{ padding: 20 }}>
            <div className="empty-state-icon">📊</div>
            <div className="empty-state-text">No data yet</div>
          </div>
        ) : (
          <div style={{ height: 200, width: '100%', position: 'relative' }}>
            <Doughnut data={chartData} options={options} />
            <div style={{
              position: 'absolute', top: '38%', left: '50%',
              transform: 'translate(-50%, -50%)',
              textAlign: 'center', pointerEvents: 'none',
            }}>
              <div style={{ fontSize: 22, fontWeight: 800, color: 'var(--text-primary)' }}>{total}</div>
              <div style={{ fontSize: 10, color: 'var(--text-muted)', fontWeight: 600 }}>DOCS</div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
