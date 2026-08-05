import { useState, useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { toast } from 'react-toastify'
import Swal from 'sweetalert2'
import {
  getSettings, updateSettings, testTelegram, testEmail,
  downloadBackup, triggerReminders,
} from '../../api/settings'
import { changePassword } from '../../api/auth'
import TopNav from '../../components/layout/TopNav'

const TABS = [
  { id: 'general', label: 'General', icon: 'bi-building' },
  { id: 'manager', label: 'Manager', icon: 'bi-person-badge' },
  { id: 'reminders', label: 'Reminders', icon: 'bi-bell' },
  { id: 'notifications', label: 'Notifications', icon: 'bi-bell-fill' },
  { id: 'security', label: 'Security', icon: 'bi-shield-lock' },
  { id: 'backup', label: 'Backup & Tools', icon: 'bi-cloud-download' },
]

// Sample data for live previews
const PREVIEW_VARS = {
  companyName: 'Fleet Reminder Pro',
  vehicleNumber: 'AS03AB4642',
  ownerName: 'Rahul Sharma',
  documentType: 'Insurance',
  days: '7',
  expiryDate: '29 Jul 2026',
}

const applyVars = (template, companyName) =>
  (template || '')
    .replace(/{companyName}/g, companyName || PREVIEW_VARS.companyName)
    .replace(/{vehicleNumber}/g, PREVIEW_VARS.vehicleNumber)
    .replace(/{ownerName}/g, PREVIEW_VARS.ownerName)
    .replace(/{documentType}/g, PREVIEW_VARS.documentType)
    .replace(/{days}/g, PREVIEW_VARS.days)
    .replace(/{expiryDate}/g, PREVIEW_VARS.expiryDate)

/* ─── Telegram Preview Card ──────────────────────────────────────────────── */
function TelegramPreview({ template, companyName }) {
  const text = applyVars(template, companyName)
  const now = new Date().toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })

  return (
    <div style={{ background: '#17212b', borderRadius: 14, overflow: 'hidden', width: '100%', maxWidth: 320, boxShadow: '0 8px 32px rgba(0,0,0,0.35)' }}>
      {/* Telegram header */}
      <div style={{ background: '#232e3c', padding: '10px 14px', display: 'flex', alignItems: 'center', gap: 10, borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
        <div style={{ width: 34, height: 34, borderRadius: '50%', background: 'linear-gradient(135deg,#2196f3,#0d47a1)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 16, flexShrink: 0 }}>🚛</div>
        <div>
          <div style={{ fontSize: 13, fontWeight: 700, color: '#fff' }}>{companyName || 'Fleet Reminder Pro'} Bot</div>
          <div style={{ fontSize: 11, color: '#6c8898' }}>bot</div>
        </div>
        {/* Telegram logo accent */}
        <div style={{ marginLeft: 'auto', color: '#2196f3', fontSize: 18 }}>
          <i className="bi bi-telegram" />
        </div>
      </div>
      {/* Chat area */}
      <div style={{ padding: '12px 10px', minHeight: 120, background: '#17212b' }}>
        <div style={{
          background: '#182533',
          border: '1px solid rgba(33,150,243,0.2)',
          borderRadius: '4px 12px 12px 12px',
          padding: '10px 12px',
          fontSize: 12.5,
          color: '#d1d5db',
          lineHeight: 1.75,
          whiteSpace: 'pre-wrap',
          wordBreak: 'break-word',
          display: 'inline-block',
          maxWidth: '92%',
        }}>
          {text}
          <div style={{ fontSize: 10, color: '#6c8898', textAlign: 'right', marginTop: 4 }}>{now} ✓</div>
        </div>
      </div>
    </div>
  )
}

/* ─── Email Preview Card ─────────────────────────────────────────────────── */
function EmailPreview({ template, companyName, managerEmail }) {
  const body = applyVars(template, companyName)
  const subject = `Fleet Reminder - Insurance expires in 7 days`
  const now = new Date().toLocaleDateString('en-IN', { weekday: 'short', day: '2-digit', month: 'short', year: 'numeric' })

  return (
    <div style={{ background: '#1e293b', borderRadius: 14, overflow: 'hidden', width: '100%', maxWidth: 320, boxShadow: '0 8px 32px rgba(0,0,0,0.35)' }}>
      {/* Email client header */}
      <div style={{ background: '#0f172a', padding: '10px 14px', borderBottom: '1px solid rgba(255,255,255,0.06)', display: 'flex', alignItems: 'center', gap: 8 }}>
        <div style={{ color: '#3b82f6', fontSize: 16 }}><i className="bi bi-envelope-fill" /></div>
        <span style={{ fontSize: 12, fontWeight: 700, color: '#94a3b8' }}>Email Preview</span>
      </div>
      {/* Email meta */}
      <div style={{ padding: '10px 14px', background: '#1e293b', borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
        <div style={{ fontSize: 11, color: '#64748b', marginBottom: 3 }}>
          <span style={{ color: '#94a3b8', fontWeight: 600 }}>To: </span>
          {managerEmail || 'manager@company.com'}
        </div>
        <div style={{ fontSize: 11, color: '#64748b', marginBottom: 3 }}>
          <span style={{ color: '#94a3b8', fontWeight: 600 }}>From: </span>
          {companyName || 'Fleet Reminder Pro'}
        </div>
        <div style={{ fontSize: 11, color: '#64748b', marginBottom: 4 }}>
          <span style={{ color: '#94a3b8', fontWeight: 600 }}>Date: </span>{now}
        </div>
        <div style={{ fontSize: 12, fontWeight: 700, color: '#e2e8f0', borderTop: '1px solid rgba(255,255,255,0.07)', paddingTop: 6, marginTop: 4 }}>
          {subject}
        </div>
      </div>
      {/* Email body */}
      <div style={{ padding: '12px 14px', background: '#1e293b' }}>
        <div style={{ fontSize: 11.5, color: '#cbd5e1', lineHeight: 1.75, whiteSpace: 'pre-wrap', wordBreak: 'break-word' }}>
          {body}
        </div>
      </div>
    </div>
  )
}

/* ─── Toggle Switch ──────────────────────────────────────────────────────── */
function ToggleSwitch({ id, checked, onChange, label, sublabel, color = '#3b82f6' }) {
  return (
    <label htmlFor={id} style={{ display: 'flex', alignItems: 'center', gap: 14, cursor: 'pointer', padding: '14px 18px', borderRadius: 12, border: `1px solid ${checked ? color + '44' : 'var(--border)'}`, background: checked ? `${color}0f` : 'transparent', transition: 'all 0.2s' }}>
      {/* Toggle */}
      <div
        style={{
          width: 46, height: 26, borderRadius: 13, background: checked ? color : '#334155',
          position: 'relative', transition: 'background 0.2s', flexShrink: 0,
        }}
      >
        <div style={{
          width: 20, height: 20, borderRadius: '50%', background: '#fff',
          position: 'absolute', top: 3, left: checked ? 23 : 3,
          transition: 'left 0.2s', boxShadow: '0 1px 4px rgba(0,0,0,0.3)',
        }} />
        <input id={id} type="checkbox" checked={checked} onChange={onChange} style={{ position: 'absolute', opacity: 0, width: 0, height: 0 }} />
      </div>
      <div>
        <div style={{ fontWeight: 700, fontSize: 14, color: checked ? '#e2e8f0' : 'var(--text-secondary)' }}>{label}</div>
        {sublabel && <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 2 }}>{sublabel}</div>}
      </div>
      {checked && <span style={{ marginLeft: 'auto', fontSize: 11, fontWeight: 700, color, background: `${color}22`, padding: '2px 10px', borderRadius: 20 }}>Enabled</span>}
    </label>
  )
}

/* ═══════════════════════════════════════════════════════════════════════════
   Main Component
══════════════════════════════════════════════════════════════════════════ */
export default function Settings() {
  const [activeTab, setActiveTab] = useState('general')
  const [settings, setSettings] = useState(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [testTgLoading, setTestTgLoading] = useState(false)
  const [testEmailLoading, setTestEmailLoading] = useState(false)
  const [triggerLoading, setTriggerLoading] = useState(false)
  const [backupLoading, setBackupLoading] = useState(false)

  // Notification toggles (local state for responsive UI)
  const [telegramEnabled, setTelegramEnabled] = useState(false)
  const [emailEnabled, setEmailEnabled] = useState(false)

  // Live preview state
  const [template, setTemplate] = useState('')
  const [companyNamePreview, setCompanyNamePreview] = useState('')
  const [managerEmailPreview, setManagerEmailPreview] = useState('')

  // Forms
  const { register, handleSubmit, reset, watch, formState: { errors } } = useForm()
  const { register: regPw, handleSubmit: handlePw, formState: { errors: pwErrors }, reset: resetPw } = useForm()
  const { register: regTg, handleSubmit: handleTg, reset: resetTg } = useForm()
  const { register: regEmail, handleSubmit: handleEmailForm, reset: resetEmailForm } = useForm()
  const { register: regMgr, handleSubmit: handleMgr, reset: resetMgr, watch: watchMgr } = useForm()

  const watchedTemplate = watch('messageTemplate', template)
  const watchedCompany = watch('companyName', companyNamePreview)
  const watchedManagerEmail = watchMgr('managerEmail', managerEmailPreview)

  useEffect(() => {
    getSettings()
      .then((res) => {
        const s = res.data.data
        setSettings(s)
        setTemplate(s.messageTemplate || '')
        setCompanyNamePreview(s.companyName || '')
        setManagerEmailPreview(s.managerEmail || '')
        setTelegramEnabled(!!s.telegramEnabled)
        setEmailEnabled(!!s.emailEnabled)

        reset({
          companyName: s.companyName,
          timezone: s.timezone,
          reminderDays: (s.reminderDays || []).join(', '),
          reminderCronTime: s.reminderCronTime,
          messageTemplate: s.messageTemplate,
        })
        resetTg({
          telegramChatId: s.telegramChatId || '',
          telegramBotToken: '',  // never pre-fill masked token
        })
        resetEmailForm({
          smtpHost: s.smtpHost || '',
          smtpPort: s.smtpPort || 587,
          smtpUser: s.smtpUser || '',
          smtpPass: '',           // never pre-fill masked password
          smtpFromEmail: s.smtpFromEmail || '',
          smtpFromName: s.smtpFromName || '',
        })
        resetMgr({
          managerName: s.managerName || '',
          managerEmail: s.managerEmail || '',
        })
      })
      .catch(() => toast.error('Failed to load settings.'))
      .finally(() => setLoading(false))
  }, [reset, resetTg, resetEmailForm, resetMgr])

  /* ── Save handlers ─────────────────────────────────────────────────────── */
  const onSaveGeneral = async (data) => {
    setSaving(true)
    try {
      const reminderDaysArr = data.reminderDays
        .split(',')
        .map((d) => parseInt(d.trim()))
        .filter((d) => !isNaN(d))
        .sort((a, b) => b - a)

      await updateSettings({
        companyName: data.companyName,
        timezone: data.timezone,
        reminderDays: reminderDaysArr,
        reminderCronTime: data.reminderCronTime,
        messageTemplate: data.messageTemplate,
      })
      setCompanyNamePreview(data.companyName)
      toast.success('General settings saved!')
    } catch {
      toast.error('Failed to save settings.')
    } finally {
      setSaving(false)
    }
  }

  const onSaveTelegram = async (data) => {
    setSaving(true)
    try {
      const updates = {
        telegramChatId: data.telegramChatId,
        telegramEnabled,
      }
      if (data.telegramBotToken) updates.telegramBotToken = data.telegramBotToken
      await updateSettings(updates)
      toast.success('Telegram settings saved!')
    } catch {
      toast.error('Failed to save Telegram settings.')
    } finally {
      setSaving(false)
    }
  }

  const onSaveEmail = async (data) => {
    setSaving(true)
    try {
      const updates = {
        smtpHost: data.smtpHost,
        smtpPort: parseInt(data.smtpPort) || 587,
        smtpUser: data.smtpUser,
        smtpFromEmail: data.smtpFromEmail,
        smtpFromName: data.smtpFromName,
        emailEnabled,
      }
      if (data.smtpPass) updates.smtpPass = data.smtpPass
      await updateSettings(updates)
      toast.success('Email settings saved!')
    } catch {
      toast.error('Failed to save Email settings.')
    } finally {
      setSaving(false)
    }
  }

  const onSaveManager = async (data) => {
    setSaving(true)
    try {
      await updateSettings({
        managerName: data.managerName,
        managerEmail: data.managerEmail,
      })
      setManagerEmailPreview(data.managerEmail)
      toast.success('Manager settings saved!')
    } catch {
      toast.error('Failed to save manager settings.')
    } finally {
      setSaving(false)
    }
  }

  const onTestTelegram = async () => {
    setTestTgLoading(true)
    try {
      await testTelegram()
      toast.success('✅ Telegram test message sent successfully!')
    } catch (err) {
      toast.error(err.response?.data?.message || 'Telegram test failed.')
    } finally {
      setTestTgLoading(false)
    }
  }

  const onTestEmail = async () => {
    setTestEmailLoading(true)
    try {
      await testEmail()
      toast.success('✅ Test email sent successfully!')
    } catch (err) {
      toast.error(err.response?.data?.message || 'Email test failed.')
    } finally {
      setTestEmailLoading(false)
    }
  }

  const onChangePassword = async (data) => {
    try {
      await changePassword(data)
      toast.success('Password changed successfully!')
      resetPw()
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to change password.')
    }
  }

  const handleTriggerReminders = async () => {
    const result = await Swal.fire({
      title: 'Trigger Reminders Now?',
      text: 'This will send notifications for all vehicles with matching expiry thresholds.',
      icon: 'question',
      showCancelButton: true,
      confirmButtonColor: '#3b82f6',
      cancelButtonColor: '#334155',
      confirmButtonText: 'Yes, Run Now',
      background: '#1e293b',
      color: '#f1f5f9',
    })
    if (!result.isConfirmed) return
    setTriggerLoading(true)
    try {
      const res = await triggerReminders()
      const { totalSent, totalSkipped, totalFailed } = res.data.data
      toast.success(`Done! Sent: ${totalSent}, Skipped: ${totalSkipped}, Failed: ${totalFailed}`)
    } catch {
      toast.error('Failed to trigger reminders.')
    } finally {
      setTriggerLoading(false)
    }
  }

  const handleBackup = async () => {
    setBackupLoading(true)
    try {
      const res = await downloadBackup()
      const url = window.URL.createObjectURL(new Blob([res.data], { type: 'application/json' }))
      const a = document.createElement('a')
      a.href = url
      a.download = `fleet-backup-${new Date().toISOString().replace(/[:.]/g, '-')}.json`
      document.body.appendChild(a)
      a.click()
      a.remove()
      window.URL.revokeObjectURL(url)
      toast.success('Backup downloaded successfully!')
    } catch {
      toast.error('Backup failed.')
    } finally {
      setBackupLoading(false)
    }
  }

  /* ── Loading skeleton ──────────────────────────────────────────────────── */
  if (loading) {
    return (
      <>
        <TopNav />
        <div className="page-content">
          <div className="skeleton" style={{ height: 40, width: 300, marginBottom: 20 }}></div>
          <div className="skeleton skeleton-card" style={{ height: 400 }}></div>
        </div>
      </>
    )
  }

  /* ── Render ────────────────────────────────────────────────────────────── */
  return (
    <>
      <TopNav />
      <div className="page-content">
        <div className="page-header">
          <div>
            <h1 className="page-title"> <span style={{ color: 'var(--primary)' }}>Settings</span> </h1>
            <p className="page-subtitle">Configure Fleet Reminder Pro</p>
          </div>
        </div>

        {/* Tab Nav */}
        <div style={{ display: 'flex', gap: 4, marginBottom: 20, flexWrap: 'wrap' }}>
          {TABS.map((t) => (
            <button
              key={t.id}
              id={`settings-tab-${t.id}`}
              className="btn-fleet btn-ghost"
              style={{
                background: activeTab === t.id ? 'rgba(59,130,246,0.15)' : 'transparent',
                color: activeTab === t.id ? 'var(--primary)' : 'var(--text-secondary)',
                border: activeTab === t.id ? '1px solid rgba(59,130,246,0.3)' : '1px solid var(--border)',
                fontWeight: activeTab === t.id ? 700 : 500,
              }}
              onClick={() => setActiveTab(t.id)}
            >
              <i className={`bi ${t.icon}`}></i>
              {t.label}
            </button>
          ))}
        </div>

        {/* ─── General Tab ──────────────────────────────────────────────── */}
        {activeTab === 'general' && (
          <div className="card">
            <div className="card-header">
              <h3 className="card-title"><i className="bi bi-building" style={{ color: 'var(--primary)' }}></i>General Settings</h3>
            </div>
            <div className="card-body">
              <form onSubmit={handleSubmit(onSaveGeneral)} noValidate>
                <div className="row g-3">
                  <div className="col-md-6">
                    <label className="form-label-fleet">Company Name</label>
                    <input className="form-control-fleet" placeholder="Your company name" {...register('companyName')} />
                  </div>
                  <div className="col-md-6">
                    <label className="form-label-fleet">Timezone</label>
                    <select className="form-control-fleet" {...register('timezone')}>
                      <option value="Asia/Kolkata">Asia/Kolkata (IST +5:30)</option>
                      <option value="Asia/Dubai">Asia/Dubai (GST +4:00)</option>
                      <option value="UTC">UTC</option>
                      <option value="America/New_York">America/New_York (EST)</option>
                    </select>
                  </div>

                  <div className="col-12">
                    <div className="divider"></div>
                    <p style={{ fontSize: 14, fontWeight: 700, color: 'var(--text-secondary)', marginBottom: 4 }}>
                      <i className="bi bi-bell me-2" style={{ color: 'var(--warning)' }}></i>
                      Reminder Schedule
                    </p>
                  </div>

                  <div className="col-md-6">
                    <label className="form-label-fleet">Reminder Days (comma-separated)</label>
                    <input className="form-control-fleet" placeholder="e.g. 30,15,7,4,2,1,0" {...register('reminderDays')} />
                    <p style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 5 }}>
                      <i className="bi bi-info-circle me-1"></i>
                      0 = day of expiry. Changes take effect on next cron execution.
                    </p>
                  </div>

                  <div className="col-md-6">
                    <label className="form-label-fleet">Cron Schedule (advanced)</label>
                    <input className="form-control-fleet" placeholder="0 8 * * *" {...register('reminderCronTime')} />
                    <p style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 5 }}>
                      Default: <code style={{ color: 'var(--primary)' }}>0 8 * * *</code> = 8:00 AM daily
                    </p>
                  </div>

                  <div className="col-12">
                    <button type="submit" disabled={saving} className="btn-fleet btn-primary-fleet">
                      {saving ? <span className="spinner-border spinner-border-sm me-2"></span> : <i className="bi bi-check-lg"></i>}
                      Save General Settings
                    </button>
                  </div>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* ─── Manager Tab ──────────────────────────────────────────────── */}
        {activeTab === 'manager' && (
          <div className="row g-3">
            <div className="col-12">
              <div style={{
                background: 'linear-gradient(135deg, rgba(59,130,246,0.12) 0%, rgba(99,102,241,0.12) 100%)',
                border: '1px solid rgba(99,102,241,0.35)',
                borderRadius: 14, padding: '16px 20px',
                display: 'flex', gap: 14, alignItems: 'flex-start', marginBottom: 4,
              }}>
                <span style={{ fontSize: 28, lineHeight: 1 }}>👤</span>
                <div>
                  <p style={{ fontWeight: 700, fontSize: 14, color: 'var(--primary)', marginBottom: 4 }}>
                    Notification Recipient — Manager Only
                  </p>
                  <p style={{ fontSize: 12, color: 'var(--text-secondary)', lineHeight: 1.6, margin: 0 }}>
                    All vehicle document expiry reminders are sent <strong style={{ color: 'red' }}>exclusively</strong> to the Manager
                    via Telegram and/or Email. Vehicle owners never receive automated messages.
                    The owner's phone number stored on a vehicle record is for reference only.
                  </p>
                </div>
              </div>
            </div>

            <div className="col-md-8">
              <div className="card">
                <div className="card-header">
                  <h3 className="card-title">
                    <i className="bi bi-person-badge" style={{ color: 'var(--primary)' }}></i>
                    Manager Configuration
                  </h3>
                </div>
                <div className="card-body">
                  <form onSubmit={handleMgr(onSaveManager)} noValidate>
                    <div className="row g-3">
                      <div className="col-md-6">
                        <label className="form-label-fleet">
                          <i className="bi bi-person me-1" style={{ color: 'var(--primary)' }}></i>
                          Manager Name
                        </label>
                        <input
                          id="manager-name-input"
                          className="form-control-fleet"
                          placeholder="e.g. Rahul Sharma"
                          {...regMgr('managerName')}
                        />
                      </div>

                      <div className="col-md-6">
                        <label className="form-label-fleet">
                          <i className="bi bi-envelope me-1" style={{ color: 'var(--primary)' }}></i>
                          Manager Email
                          <span style={{ color: 'var(--danger)', marginLeft: 4 }}>*</span>
                        </label>
                        <input
                          id="manager-email-input"
                          type="email"
                          className="form-control-fleet"
                          placeholder="manager@company.com"
                          {...regMgr('managerEmail')}
                        />
                        <p style={{ fontSize: 11, color: 'var(--warning)', marginTop: 5 }}>
                          <i className="bi bi-exclamation-triangle me-1"></i>
                          Used for email reminders. Configure SMTP in the Notifications tab.
                        </p>
                      </div>

                      <div className="col-12">
                        <button
                          id="save-manager-btn"
                          type="submit"
                          disabled={saving}
                          className="btn-fleet btn-primary-fleet"
                        >
                          {saving
                            ? <span className="spinner-border spinner-border-sm me-2"></span>
                            : <i className="bi bi-check-lg"></i>
                          }
                          Save Manager Settings
                        </button>
                      </div>
                    </div>
                  </form>
                </div>
              </div>
            </div>

            {/* Info side panel */}
            <div className="col-md-4">
              <div className="card" style={{ background: 'rgba(17,24,39,0.6)' }}>
                <div className="card-header">
                  <h3 className="card-title">
                    <i className="bi bi-info-circle" style={{ color: 'var(--primary)' }}></i>
                    How Reminders Work
                  </h3>
                </div>
                <div className="card-body" style={{ fontSize: 13, color: 'var(--text-secondary)', lineHeight: 1.8 }}>
                  <p style={{ marginBottom: 10 }}>
                    <i className="bi bi-1-circle-fill me-2" style={{ color: 'var(--primary)' }}></i>
                    The cron job checks all vehicles daily.
                  </p>
                  <p style={{ marginBottom: 10 }}>
                    <i className="bi bi-2-circle-fill me-2" style={{ color: 'var(--primary)' }}></i>
                    When a document matches a threshold (30, 15, 7, 4, 2, 1, or 0 days), a notification is generated.
                  </p>
                  <p style={{ marginBottom: 10 }}>
                    <i className="bi bi-3-circle-fill me-2" style={{ color: 'var(--primary)' }}></i>
                    The notification is sent <strong style={{ color: 'white' }}>only</strong> to the Manager via Telegram/Email — never to the vehicle owner.
                  </p>
                  <p style={{ marginBottom: 0 }}>
                    <i className="bi bi-4-circle-fill me-2" style={{ color: 'var(--primary)' }}></i>
                    The manager then contacts the customer and arranges renewal.
                  </p>
                  <div style={{
                    marginTop: 16, background: 'rgba(33,150,243,0.08)',
                    border: '1px solid rgba(33,150,243,0.25)', borderRadius: 10, padding: '10px 14px', fontSize: 12,
                  }}>
                    <i className="bi bi-telegram me-2" style={{ color: '#2196f3' }}></i>
                    <strong style={{ color: '#2196f3' }}>Example Telegram message:</strong>
                    <pre style={{ marginTop: 8, fontSize: 11, color: '#fff', whiteSpace: 'pre-wrap', fontFamily: 'monospace', background: 'transparent', border: 'none', padding: 0 }}>{`🚗 Fleet Reminder Pro

Vehicle:
AS 03 AB 1234

Document:
Insurance

Expires In:
7 days

Owner:
Rahul Sharma

Please renew before expiry.`}</pre>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ─── Reminders Tab ────────────────────────────────────────────── */}
        {activeTab === 'reminders' && (
          <div className="card">
            <div className="card-header">
              <h3 className="card-title"><i className="bi bi-bell" style={{ color: 'var(--warning)' }}></i>Reminder Engine</h3>
            </div>
            <div className="card-body">
              <form onSubmit={handleSubmit(onSaveGeneral)} noValidate>
                <div className="row g-3">
                  <div className="col-md-6">
                    <label className="form-label-fleet">Reminder Days</label>
                    <input className="form-control-fleet" placeholder="30,15,7,4,2,1,0" {...register('reminderDays')} />
                    <p style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 5 }}>
                      Comma-separated days before expiry to send reminders. 0 = day of expiry.
                    </p>
                  </div>
                  <div className="col-md-6">
                    <label className="form-label-fleet">Run Time (Cron Expression)</label>
                    <input className="form-control-fleet" placeholder="0 8 * * *" {...register('reminderCronTime')} />
                    <p style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 5 }}>
                      Default: Every day at 8:00 AM. Changes take effect on restart.
                    </p>
                  </div>
                  <div className="col-12">
                    <button type="submit" disabled={saving} className="btn-fleet btn-primary-fleet">
                      <i className="bi bi-check-lg"></i>Save Reminder Settings
                    </button>
                  </div>
                </div>
              </form>

              <div className="divider"></div>

              <div>
                <p style={{ fontSize: 13, fontWeight: 700, color: 'var(--text-secondary)', marginBottom: 6 }}>Manual Trigger</p>
                <p style={{ fontSize: 12, color: 'var(--text-muted)', marginBottom: 12 }}>
                  Run the reminder engine now, outside of the scheduled cron job. This will send notifications for all matching vehicles.
                </p>
                <button
                  className="btn-fleet btn-primary-fleet"
                  disabled={triggerLoading}
                  onClick={handleTriggerReminders}
                  id="trigger-reminders-btn"
                >
                  {triggerLoading ? (
                    <><span className="spinner-border spinner-border-sm me-2"></span>Running...</>
                  ) : (
                    <><i className="bi bi-play-circle"></i>Run Reminders Now</>
                  )}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* ─── Notifications Tab ────────────────────────────────────────── */}
        {activeTab === 'notifications' && (
          <div className="row g-3">
            {/* Left column: Config forms */}
            <div className="col-lg-7">

              {/* Provider Toggles */}
              <div className="card" style={{ marginBottom: 16 }}>
                <div className="card-header">
                  <h3 className="card-title">
                    <i className="bi bi-toggles" style={{ color: 'var(--primary)' }}></i>
                    Notification Providers
                  </h3>
                </div>
                <div className="card-body" style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                  <ToggleSwitch
                    id="toggle-telegram"
                    checked={telegramEnabled}
                    onChange={(e) => setTelegramEnabled(e.target.checked)}
                    label="☑ Telegram Notifications"
                    sublabel="Send reminders via Telegram Bot"
                    color="#2196f3"
                  />
                  <ToggleSwitch
                    id="toggle-email"
                    checked={emailEnabled}
                    onChange={(e) => setEmailEnabled(e.target.checked)}
                    label="☑ Email Notifications"
                    sublabel="Send reminders via SMTP Email"
                    color="#10b981"
                  />
                </div>
              </div>

              {/* Telegram Config */}
              <div className="card" style={{ marginBottom: 16, opacity: telegramEnabled ? 1 : 0.6, transition: 'opacity 0.2s' }}>
                <div className="card-header">
                  <h3 className="card-title">
                    <i className="bi bi-telegram" style={{ color: '#2196f3' }}></i>
                    Telegram Bot Configuration
                  </h3>
                </div>
                <div className="card-body">
                  <form onSubmit={handleTg(onSaveTelegram)} noValidate>
                    <div className="row g-3">
                      <div className="col-12">
                        <label className="form-label-fleet">
                          Bot Token
                          {settings?.telegramBotTokenSet && (
                            <span style={{ fontSize: 11, color: 'var(--success)', marginLeft: 8, fontWeight: 600 }}>✓ Token saved</span>
                          )}
                        </label>
                        <input
                          id="telegram-bot-token-input"
                          type="password"
                          className="form-control-fleet"
                          placeholder={settings?.telegramBotTokenSet ? 'Leave blank to keep existing token' : 'Enter Telegram Bot Token (from @BotFather)'}
                          {...regTg('telegramBotToken')}
                        />
                        <p style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 5 }}>
                          <i className="bi bi-info-circle me-1"></i>
                          Get your bot token from <strong>@BotFather</strong> on Telegram.
                        </p>
                      </div>

                      <div className="col-12">
                        <label className="form-label-fleet">Chat ID</label>
                        <input
                          id="telegram-chat-id-input"
                          className="form-control-fleet"
                          placeholder="e.g. -1001234567890 or 123456789"
                          {...regTg('telegramChatId')}
                        />
                        <p style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 5 }}>
                          <i className="bi bi-info-circle me-1"></i>
                          Your personal chat ID or a group/channel ID. Use <strong>@userinfobot</strong> to find your chat ID.
                        </p>
                      </div>

                      <div className="col-12" style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
                        <button
                          id="save-telegram-btn"
                          type="submit"
                          disabled={saving}
                          className="btn-fleet btn-primary-fleet"
                        >
                          {saving ? <span className="spinner-border spinner-border-sm me-2"></span> : <i className="bi bi-check-lg"></i>}
                          Save Telegram Settings
                        </button>
                        <button
                          id="test-telegram-btn"
                          type="button"
                          disabled={testTgLoading}
                          className="btn-fleet btn-ghost"
                          style={{ borderColor: 'rgba(33,150,243,0.4)', color: '#2196f3' }}
                          onClick={onTestTelegram}
                        >
                          {testTgLoading ? <span className="spinner-border spinner-border-sm me-2"></span> : <i className="bi bi-send me-1"></i>}
                          Send Telegram Test
                        </button>
                      </div>
                    </div>
                  </form>
                </div>
              </div>

              {/* Email Config */}
              <div className="card" style={{ opacity: emailEnabled ? 1 : 0.6, transition: 'opacity 0.2s' }}>
                <div className="card-header">
                  <h3 className="card-title">
                    <i className="bi bi-envelope-fill" style={{ color: '#10b981' }}></i>
                    Email (SMTP) Configuration
                  </h3>
                </div>
                <div className="card-body">
                  <form onSubmit={handleEmailForm(onSaveEmail)} noValidate>
                    <div className="row g-3">
                      <div className="col-md-8">
                        <label className="form-label-fleet">SMTP Host</label>
                        <input
                          id="smtp-host-input"
                          className="form-control-fleet"
                          placeholder="e.g. smtp.gmail.com"
                          {...regEmail('smtpHost')}
                        />
                      </div>
                      <div className="col-md-4">
                        <label className="form-label-fleet">SMTP Port</label>
                        <input
                          id="smtp-port-input"
                          type="number"
                          className="form-control-fleet"
                          placeholder="587"
                          {...regEmail('smtpPort')}
                        />
                      </div>

                      <div className="col-md-6">
                        <label className="form-label-fleet">SMTP Username</label>
                        <input
                          id="smtp-user-input"
                          className="form-control-fleet"
                          placeholder="your@email.com"
                          {...regEmail('smtpUser')}
                        />
                      </div>
                      <div className="col-md-6">
                        <label className="form-label-fleet">
                          SMTP Password
                          {settings?.smtpPassSet && (
                            <span style={{ fontSize: 11, color: 'var(--success)', marginLeft: 8, fontWeight: 600 }}>✓ Password saved</span>
                          )}
                        </label>
                        <input
                          id="smtp-pass-input"
                          type="password"
                          className="form-control-fleet"
                          placeholder={settings?.smtpPassSet ? 'Leave blank to keep existing password' : 'App password or SMTP password'}
                          {...regEmail('smtpPass')}
                        />
                      </div>

                      <div className="col-md-6">
                        <label className="form-label-fleet">From Email</label>
                        <input
                          id="smtp-from-email-input"
                          className="form-control-fleet"
                          placeholder="noreply@yourcompany.com"
                          {...regEmail('smtpFromEmail')}
                        />
                      </div>
                      <div className="col-md-6">
                        <label className="form-label-fleet">From Name</label>
                        <input
                          id="smtp-from-name-input"
                          className="form-control-fleet"
                          placeholder="Fleet Reminder Pro"
                          {...regEmail('smtpFromName')}
                        />
                      </div>

                      <div className="col-12">
                        <label className="form-label-fleet">
                          <i className="bi bi-person-circle me-1" style={{ color: '#10b981' }}></i>
                          Manager Email (Recipient)
                        </label>
                        <input
                          className="form-control-fleet"
                          value={watchedManagerEmail || managerEmailPreview || ''}
                          placeholder="Set in Manager tab"
                          readOnly
                          style={{ background: 'rgba(16,185,129,0.05)', cursor: 'default', color: 'var(--text-muted)' }}
                        />
                        <p style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 5 }}>
                          <i className="bi bi-info-circle me-1"></i>
                          All email reminders are sent to this address. Set it in the <strong>Manager</strong> tab.
                        </p>
                      </div>

                      <div className="col-12" style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
                        <button
                          id="save-email-btn"
                          type="submit"
                          disabled={saving}
                          className="btn-fleet btn-primary-fleet"
                        >
                          {saving ? <span className="spinner-border spinner-border-sm me-2"></span> : <i className="bi bi-check-lg"></i>}
                          Save Email Settings
                        </button>
                        <button
                          id="test-email-btn"
                          type="button"
                          disabled={testEmailLoading}
                          className="btn-fleet btn-ghost"
                          style={{ borderColor: 'rgba(16,185,129,0.4)', color: '#10b981' }}
                          onClick={onTestEmail}
                        >
                          {testEmailLoading ? <span className="spinner-border spinner-border-sm me-2"></span> : <i className="bi bi-envelope me-1"></i>}
                          Send Test Email
                        </button>
                      </div>
                    </div>
                  </form>
                </div>
              </div>
            </div>

            {/* Right column: Live Previews + Message Template */}
            <div className="col-lg-5">
              {/* Message Template */}
              <div className="card" style={{ marginBottom: 16 }}>
                <div className="card-header">
                  <h3 className="card-title"><i className="bi bi-chat-text" style={{ color: 'var(--primary)' }}></i>Message Template</h3>
                </div>
                <div className="card-body">
                  <p style={{ fontSize: 11, color: 'var(--text-muted)', marginBottom: 8 }}>
                    Available variables:{' '}
                    {['{companyName}', '{vehicleNumber}', '{ownerName}', '{documentType}', '{days}', '{expiryDate}'].map((v) => (
                      <code key={v} style={{ color: 'var(--primary)', marginRight: 4 }}>{v}</code>
                    ))}
                  </p>
                  <form onSubmit={handleSubmit(onSaveGeneral)}>
                    <textarea
                      className="form-control-fleet"
                      rows={7}
                      placeholder="Enter message template..."
                      style={{ resize: 'vertical', fontFamily: 'monospace', fontSize: 12 }}
                      {...register('messageTemplate', { onChange: (e) => setTemplate(e.target.value) })}
                    />
                    <button type="submit" disabled={saving} className="btn-fleet btn-primary-fleet" style={{ marginTop: 12 }}>
                      <i className="bi bi-check-lg"></i>Save Template
                    </button>
                  </form>
                </div>
              </div>

              {/* Live Preview — Telegram */}
              <div className="card" style={{ marginBottom: 16 }}>
                <div className="card-header">
                  <h3 className="card-title">
                    <i className="bi bi-telegram" style={{ color: '#2196f3' }}></i>
                    Telegram Preview
                  </h3>
                </div>
                <div className="card-body" style={{ display: 'flex', justifyContent: 'center' }}>
                  <TelegramPreview
                    template={watchedTemplate || template}
                    companyName={watchedCompany || companyNamePreview}
                  />
                </div>
              </div>

              {/* Live Preview — Email */}
              <div className="card">
                <div className="card-header">
                  <h3 className="card-title">
                    <i className="bi bi-envelope-fill" style={{ color: '#10b981' }}></i>
                    Email Preview
                  </h3>
                </div>
                <div className="card-body" style={{ display: 'flex', justifyContent: 'center' }}>
                  <EmailPreview
                    template={watchedTemplate || template}
                    companyName={watchedCompany || companyNamePreview}
                    managerEmail={watchedManagerEmail || managerEmailPreview}
                  />
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ─── Security Tab ─────────────────────────────────────────────── */}
        {activeTab === 'security' && (
          <div className="card" style={{ maxWidth: 500 }}>
            <div className="card-header">
              <h3 className="card-title"><i className="bi bi-shield-lock" style={{ color: 'var(--primary)' }}></i>Change Password</h3>
            </div>
            <div className="card-body">
              <form onSubmit={handlePw(onChangePassword)} noValidate>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                  <div>
                    <label className="form-label-fleet">Current Password</label>
                    <input
                      type="password"
                      className="form-control-fleet"
                      placeholder="Enter current password"
                      {...regPw('currentPassword', { required: 'Required' })}
                    />
                    {pwErrors.currentPassword && <p className="form-error">{pwErrors.currentPassword.message}</p>}
                  </div>
                  <div>
                    <label className="form-label-fleet">New Password</label>
                    <input
                      type="password"
                      className="form-control-fleet"
                      placeholder="Min 8 chars, upper+lower+number"
                      {...regPw('newPassword', {
                        required: 'Required',
                        minLength: { value: 8, message: 'Minimum 8 characters' },
                        pattern: {
                          value: /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/,
                          message: 'Must contain uppercase, lowercase, and number',
                        },
                      })}
                    />
                    {pwErrors.newPassword && <p className="form-error">{pwErrors.newPassword.message}</p>}
                  </div>
                  <button type="submit" className="btn-fleet btn-primary-fleet">
                    <i className="bi bi-lock"></i>Change Password
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* ─── Backup Tab ───────────────────────────────────────────────── */}
        {activeTab === 'backup' && (
          <div className="row g-3">
            <div className="col-md-6">
              <div className="card">
                <div className="card-header">
                  <h3 className="card-title"><i className="bi bi-cloud-download" style={{ color: 'var(--primary)' }}></i>Database Backup</h3>
                </div>
                <div className="card-body">
                  <p style={{ fontSize: 13, color: 'var(--text-secondary)', marginBottom: 16 }}>
                    Download a complete JSON backup of your database including all vehicles, reminder logs, activity logs, and settings.
                    The backup is secure and excludes sensitive credentials.
                  </p>
                  <div style={{
                    background: 'rgba(59,130,246,0.08)', border: '1px solid rgba(59,130,246,0.2)',
                    borderRadius: 10, padding: '12px 16px', marginBottom: 16, fontSize: 12, color: 'var(--text-muted)',
                  }}>
                    <i className="bi bi-info-circle me-2" style={{ color: 'var(--primary)' }}></i>
                    Telegram Bot Token and SMTP Password are <strong>redacted</strong> in the backup for security.
                  </div>
                  <button
                    className="btn-fleet btn-primary-fleet"
                    onClick={handleBackup}
                    disabled={backupLoading}
                    id="backup-download-btn"
                  >
                    {backupLoading ? (
                      <><span className="spinner-border spinner-border-sm me-2"></span>Generating...</>
                    ) : (
                      <><i className="bi bi-download"></i>Download Backup</>
                    )}
                  </button>
                </div>
              </div>
            </div>

            <div className="col-md-6">
              <div className="card">
                <div className="card-header">
                  <h3 className="card-title"><i className="bi bi-tools" style={{ color: 'var(--warning)' }}></i>Quick Tools</h3>
                </div>
                <div className="card-body">
                  <p style={{ fontSize: 13, color: 'var(--text-secondary)', marginBottom: 12 }}>
                    Useful admin tools for managing the system.
                  </p>
                  <button
                    className="btn-fleet btn-ghost"
                    style={{ width: '100%', justifyContent: 'flex-start', marginBottom: 8 }}
                    onClick={handleTriggerReminders}
                    disabled={triggerLoading}
                  >
                    <i className="bi bi-play-circle" style={{ color: 'var(--primary)' }}></i>
                    Trigger Reminders Manually
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </>
  )
}
