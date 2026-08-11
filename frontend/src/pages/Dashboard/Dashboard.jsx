import { useEffect, useState } from 'react'
import { getDashboardStats, getTodayWidget } from '../../api/dashboard'
import StatsCards from './components/StatsCards'
import WarningBanner from './components/WarningBanner'
import TodayWidget from './components/TodayWidget'
import CalendarWidget from './components/CalendarWidget'
import MonthlyChart from './components/MonthlyChart'
import PieChart from './components/PieChart'
import ActivityFeed from './components/ActivityFeed'
import TopNav from '../../components/layout/TopNav'

export default function Dashboard() {
  const [stats, setStats] = useState(null)
  const [todayData, setTodayData] = useState(null)
  const [statsLoading, setStatsLoading] = useState(true)
  const [todayLoading, setTodayLoading] = useState(true)

  useEffect(() => {
    getDashboardStats()
      .then((r) => setStats(r.data.data))
      .catch(() => {})
      .finally(() => setStatsLoading(false))

    getTodayWidget()
      .then((r) => setTodayData(r.data.data))
      .catch(() => {})
      .finally(() => setTodayLoading(false))
  }, [])

  return (
    <>
      <TopNav />
      <div className="page-content">
        {/* Header */}
        <div className="page-header">
          <div>
            <h1 className="page-title">
              <span style={{ color: 'var(--primary)' }}>Dashboard</span>
            </h1>
            <p className="page-subtitle">
              {new Date().toLocaleDateString('en-IN', { weekday: 'long', day: '2-digit', month: 'long', year: 'numeric' })}
            </p>
          </div>
          <div>
            <span style={{
              background: 'rgba(34,197,94,0.1)',
              border: '1px solid rgba(34,197,94,0.2)',
              color: '#22c55e',
              fontSize: 11,
              fontWeight: 600,
              padding: '5px 12px',
              borderRadius: 20,
              display: 'inline-flex', alignItems: 'center', gap: 5,
              whiteSpace: 'nowrap',
            }}>
              <span style={{ width: 6, height: 6, background: '#22c55e', borderRadius: '50%', animation: 'glowPulse 2s infinite' }}></span>
              System Online
            </span>
          </div>
        </div>

        {/* Warning Banner */}
        <WarningBanner stats={stats} />

        {/* Stats Cards */}
        <div style={{ marginBottom: 20 }}>
          <StatsCards stats={stats} loading={statsLoading} />
        </div>

        {/* Middle row: Today Widget + Calendar + Pie */}
        <div className="row g-3 mb-3">
          <div className="col-md-3 col-12">
            <TodayWidget data={todayData} loading={todayLoading} />
          </div>
          <div className="col-md-5 col-12">
            <CalendarWidget />
          </div>
          <div className="col-md-4 col-12">
            <PieChart />
          </div>
        </div>

        {/* Bottom row: Monthly Chart + Activity */}
        <div className="row g-3">
          <div className="col-md-7 col-12">
            <MonthlyChart />
          </div>
          <div className="col-md-5 col-12">
            <ActivityFeed />
          </div>
        </div>
      </div>
    </>
  )
}
