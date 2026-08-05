import { useEffect, useState } from 'react'
import {
  Chart as ChartJS,
  CategoryScale, LinearScale, BarElement,
  Title, Tooltip, Legend,
} from 'chart.js'
import { Bar } from 'react-chartjs-2'
import { getMonthlyChart } from '../../../api/dashboard'

ChartJS.register(CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend)

export default function MonthlyChart() {
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)
  const year = new Date().getFullYear()

  useEffect(() => {
    getMonthlyChart({ year })
      .then((res) => setData(res.data.data))
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [year])

  const chartData = {
    labels: data?.labels || [],
    datasets: [
      {
        label: 'Insurance',
        data: data?.insurance || [],
        backgroundColor: 'rgba(59,130,246,0.8)',
        borderRadius: 6,
        borderSkipped: false,
      },
      {
        label: 'Pollution',
        data: data?.pollution || [],
        backgroundColor: 'rgba(34,197,94,0.8)',
        borderRadius: 6,
        borderSkipped: false,
      },
      {
        label: 'GPS',
        data: data?.gps || [],
        backgroundColor: 'rgba(245,158,11,0.8)',
        borderRadius: 6,
        borderSkipped: false,
      },
    ],
  }

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        labels: { color: '#94a3b8', font: { family: 'Inter', size: 11 }, boxWidth: 12, padding: 16 },
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
          label: (ctx) => ` ${ctx.dataset.label}: ${ctx.parsed.y} documents`,
        },
      },
    },
    scales: {
      x: {
        grid: { color: 'rgba(51,65,85,0.5)', drawBorder: false },
        ticks: { color: '#64748b', font: { family: 'Inter', size: 11 } },
      },
      y: {
        grid: { color: 'rgba(51,65,85,0.5)', drawBorder: false },
        ticks: { color: '#64748b', font: { family: 'Inter', size: 11 }, stepSize: 1 },
        beginAtZero: true,
      },
    },
  }

  return (
    <div className="card">
      <div className="card-header">
        <h3 className="card-title">
          <i className="bi bi-bar-chart" style={{ color: 'var(--primary)' }}></i>
          Monthly Expiry Chart — {year}
        </h3>
      </div>
      <div className="card-body">
        {loading ? (
          <div className="skeleton" style={{ height: 220, borderRadius: 8 }}></div>
        ) : (
          <div style={{ height: 220 }}>
            <Bar data={chartData} options={options} />
          </div>
        )}
      </div>
    </div>
  )
}
