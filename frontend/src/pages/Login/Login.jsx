import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { toast } from 'react-toastify'
import { useAuth } from '../../contexts/AuthContext'

export default function Login() {
  const { login } = useAuth()
  const navigate = useNavigate()
  const [isLoading, setIsLoading] = useState(false)
  const [showPass, setShowPass] = useState(false)

  const { register, handleSubmit, formState: { errors } } = useForm()

  const onSubmit = async (data) => {
    setIsLoading(true)
    try {
      const user = await login(data)
      toast.success(`Welcome back, ${user.displayName}!`)
      navigate('/dashboard')
    } catch (err) {
      toast.error(err.response?.data?.message || 'Login failed. Please try again.')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div style={{
      minHeight: '100vh',
      background: 'radial-gradient(ellipse at 20% 50%, rgba(59,130,246,0.08) 0%, transparent 60%), radial-gradient(ellipse at 80% 20%, rgba(99,102,241,0.06) 0%, transparent 60%), var(--bg-dark)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: 20,
    }}>
      {/* Background Grid */}
      <div style={{
        position: 'fixed', inset: 0, opacity: 0.03,
        backgroundImage: 'linear-gradient(rgba(255,255,255,0.1) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.1) 1px, transparent 1px)',
        backgroundSize: '40px 40px',
        pointerEvents: 'none',
      }} />

      <div style={{ width: '100%', maxWidth: 420, position: 'relative', zIndex: 1 }}>
        {/* Logo */}
        <div style={{ textAlign: 'center', marginBottom: 32 }}>
          <div style={{
            width: 64, height: 64,
            background: 'linear-gradient(135deg, #3b82f6, #2563eb)',
            borderRadius: 16,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: 28, margin: '0 auto 16px',
            boxShadow: '0 0 30px rgba(59,130,246,0.4)',
          }}>🚛</div>
          <h1 style={{ fontSize: 24, fontWeight: 800, color: 'var(--text-primary)', margin: 0 }}>
            Fleet Reminder Pro
          </h1>
          <p style={{ fontSize: 13, color: 'var(--text-muted)', marginTop: 6 }}>
            Vehicle Document Management System
          </p>
        </div>

        {/* Card */}
        <div style={{
          background: 'rgba(30,41,59,0.8)',
          backdropFilter: 'blur(20px)',
          border: '1px solid var(--border)',
          borderRadius: 20,
          padding: 32,
          boxShadow: 'var(--shadow-lg)',
        }}>
          <h2 style={{ fontSize: 18, fontWeight: 700, marginBottom: 24, color: 'var(--text-primary)' }}>
            Sign In to Your Account
          </h2>

          <form onSubmit={handleSubmit(onSubmit)} noValidate>
            {/* Username */}
            <div style={{ marginBottom: 16 }}>
              <label className="form-label-fleet" htmlFor="login-username">Username</label>
              <div style={{ position: 'relative' }}>
                <i className="bi bi-person" style={{
                  position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)',
                  color: 'var(--text-muted)', fontSize: 15,
                }}></i>
                <input
                  id="login-username"
                  type="text"
                  className="form-control-fleet"
                  style={{ paddingLeft: 38 }}
                  placeholder="Enter username"
                  autoComplete="username"
                  {...register('username', { required: 'Username is required' })}
                />
              </div>
              {errors.username && <p className="form-error">{errors.username.message}</p>}
            </div>

            {/* Password */}
            <div style={{ marginBottom: 24 }}>
              <label className="form-label-fleet" htmlFor="login-password">Password</label>
              <div style={{ position: 'relative' }}>
                <i className="bi bi-lock" style={{
                  position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)',
                  color: 'var(--text-muted)', fontSize: 15,
                }}></i>
                <input
                  id="login-password"
                  type={showPass ? 'text' : 'password'}
                  className="form-control-fleet"
                  style={{ paddingLeft: 38, paddingRight: 38 }}
                  placeholder="Enter password"
                  autoComplete="current-password"
                  {...register('password', { required: 'Password is required' })}
                />
                <button
                  type="button"
                  onClick={() => setShowPass((v) => !v)}
                  style={{
                    position: 'absolute', right: 10, top: '50%', transform: 'translateY(-50%)',
                    background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer',
                    padding: 4, fontSize: 15,
                  }}
                >
                  <i className={`bi ${showPass ? 'bi-eye-slash' : 'bi-eye'}`}></i>
                </button>
              </div>
              {errors.password && <p className="form-error">{errors.password.message}</p>}
            </div>

            <button
              id="login-submit"
              type="submit"
              disabled={isLoading}
              className="btn-fleet btn-primary-fleet"
              style={{ width: '100%', justifyContent: 'center', padding: '12px 20px', fontSize: 14 }}
            >
              {isLoading ? (
                <>
                  <span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>
                  Signing In...
                </>
              ) : (
                <>
                  <i className="bi bi-shield-check"></i>
                  Sign In
                </>
              )}
            </button>
          </form>

          {/* Default credentials hint */}
          <div style={{
            marginTop: 20,
            padding: '10px 14px',
            background: 'rgba(59,130,246,0.08)',
            border: '1px solid rgba(59,130,246,0.2)',
            borderRadius: 8,
            fontSize: 12,
            color: 'var(--text-muted)',
            textAlign: 'center',
          }}>
            <i className="bi bi-info-circle me-1"></i>
            Default: <strong style={{ color: 'var(--text-secondary)' }}>admin</strong> / <strong style={{ color: 'var(--text-secondary)' }}>Admin@1234</strong>
          </div>
        </div>

        <p style={{ textAlign: 'center', marginTop: 16, fontSize: 12, color: 'var(--text-muted)' }}>
          © {new Date().getFullYear()} Fleet Reminder Pro. All rights reserved.
        </p>
      </div>
    </div>
  )
}
