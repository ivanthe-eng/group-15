import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import axios from 'axios'
import makLogo from '../assets/mak_logo.png'

const ROLE_HOME = {
  student: '/student',
  workplace_supervisor: '/supervisor',
  academic_supervisor: '/supervisor',
  admin: '/admin',
}

const ROLES = [
  { value: 'student', label: 'Student Intern' },
  { value: 'workplace_supervisor', label: 'Workplace Supervisor' },
  { value: 'academic_supervisor', label: 'Academic Supervisor' },
  { value: 'admin', label: 'Admin' },
]

export default function LoginPage() {
  const { login } = useAuth()
  const navigate = useNavigate()

  const [tab, setTab] = useState('login')
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [loading, setLoading] = useState(false)

  const [loginForm, setLoginForm] = useState({ username: '', password: '' })
  const [registerForm, setRegisterForm] = useState({
    username: '',
    email: '',
    password: '',
    confirmPassword: '',
    role: '',
    phone: '',
  })

  const handleLogin = async (e) => {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      const user = await login(loginForm.username, loginForm.password)
      navigate(ROLE_HOME[user.role] || '/')
    } catch (err) {
      const d = err.response?.data
      setError(d?.error || d?.detail || 'Invalid username or password.')
    } finally {
      setLoading(false)
    }
  }

  const handleRegister = async (e) => {
    e.preventDefault()
    setError('')
    setSuccess('')

    if (!registerForm.username.trim()) { setError('Username is required.'); return }
    if (!registerForm.email.trim()) { setError('Email address is required.'); return }
    if (!registerForm.role) { setError('Please select a role.'); return }
    if (registerForm.password.length < 8) { setError('Password must be at least 8 characters.'); return }
    if (registerForm.password !== registerForm.confirmPassword) { setError('Passwords do not match.'); return }

    setLoading(true)
    try {
      await axios.post('/api/auth/register/', {
        username: registerForm.username.trim(),
        email: registerForm.email.trim().toLowerCase(),
        password: registerForm.password,
        confirm_password: registerForm.confirmPassword,
        role: registerForm.role,
        phone: registerForm.phone,
      })
      const user = await login(registerForm.username, registerForm.password)
      navigate(ROLE_HOME[user.role] || '/')
    } catch (err) {
      const d = err.response?.data
      setError(
        d?.username?.[0] ||
        d?.email?.[0] ||
        d?.password?.[0] ||
        d?.confirm_password?.[0] ||
        d?.role?.[0] ||
        d?.non_field_errors?.[0] ||
        d?.detail ||
        'Registration failed. Please try again.'
      )
    } finally {
      setLoading(false)
    }
  }

  const inputStyle = {
    width: '100%',
    padding: '10px 12px',
    border: '1px solid #ccc',
    borderRadius: '6px',
    fontSize: '14px',
    background: '#fff',
    boxSizing: 'border-box',
    outline: 'none',
    transition: 'border-color 0.15s',
  }

  const labelStyle = {
    display: 'block',
    fontSize: '13px',
    fontWeight: 500,
    color: '#444',
    marginBottom: '5px',
  }

  const groupStyle = { marginBottom: '1rem' }

  return (
    <div style={{
      minHeight: '100vh',
      display: 'flex',
      flexDirection: 'column',
      background: '#f4f4f4',
    }}>

      {/* Top bar */}
      <div style={{
        background: '#1a6e3c',
        padding: '6px 2rem',
        fontSize: '12px',
        color: 'rgba(255,255,255,0.8)',
        textAlign: 'center',
      }}>
        Makerere University · College of Computing &amp; Information Sciences
      </div>

      {/* Main content */}
      <div style={{
        flex: 1,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '2rem',
      }}>
        <div style={{
          width: '100%',
          maxWidth: '440px',
          background: '#fff',
          borderRadius: '12px',
          boxShadow: '0 4px 20px rgba(0,0,0,0.1)',
          overflow: 'hidden',
        }}>

          {/* Header */}
          <div style={{
            background: '#2E8B57',
            padding: '0',
            textAlign: 'center',
          }}>
            <div style={{ height: '5px', background: '#1a6e3c' }} />

            <div style={{ padding: '1.75rem 2rem 1.5rem' }}>
              <img
                src={makLogo}
                alt="Makerere University"
                style={{
                  width: '80px',
                  height: '80px',
                  objectFit: 'contain',
                  filter: 'drop-shadow(0 2px 6px rgba(0,0,0,0.3))',
                  marginBottom: '12px',
                  display: 'block',
                  margin: '0 auto 12px',
                }}
              />
              <h1 style={{
                color: '#fff',
                fontSize: '20px',
                fontWeight: 700,
                margin: '0 0 3px',
                letterSpacing: '0.04em',
              }}>
                MAKERERE UNIVERSITY
              </h1>
              <p style={{
                color: 'rgba(255,255,255,0.75)',
                fontSize: '11px',
                margin: '0 0 12px',
                letterSpacing: '0.06em',
                textTransform: 'uppercase',
              }}>
                College of Computing &amp; Information Sciences
              </p>
              <div style={{
                display: 'inline-block',
                background: 'rgba(255,255,255,0.15)',
                border: '1px solid rgba(255,255,255,0.3)',
                borderRadius: '99px',
                padding: '5px 18px',
              }}>
                <span style={{ color: '#fff', fontSize: '13px', fontWeight: 700 }}>
                  ILES
                </span>
                <span style={{ color: 'rgba(255,255,255,0.7)', fontSize: '12px' }}>
                  {' '}· Internship Logging &amp; Evaluation System
                </span>
              </div>
            </div>

            <div style={{ height: '4px', background: '#1a6e3c' }} />
          </div>

          {/* Tabs */}
          <div style={{ display: 'flex', borderBottom: '2px solid #f0f0f0' }}>
            {['login', 'register'].map(t => (
              <button
                key={t}
                onClick={() => { setTab(t); setError(''); setSuccess('') }}
                style={{
                  flex: 1,
                  padding: '14px',
                  border: 'none',
                  background: 'transparent',
                  fontSize: '14px',
                  fontWeight: tab === t ? 600 : 400,
                  color: tab === t ? '#2E8B57' : '#888',
                  borderBottom: tab === t ? '2px solid #2E8B57' : '2px solid transparent',
                  marginBottom: '-2px',
                  cursor: 'pointer',
                  transition: 'all 0.15s',
                }}
              >
                {t === 'login' ? 'Sign in' : 'Register'}
              </button>
            ))}
          </div>

          {/* Forms */}
          <div style={{ padding: '1.75rem 2rem' }}>

            {error && (
              <div style={{
                background: '#FFEBEE',
                color: '#C62828',
                padding: '10px 14px',
                borderRadius: '6px',
                fontSize: '13px',
                marginBottom: '1.25rem',
                borderLeft: '3px solid #E8352A',
              }}>
                {error}
              </div>
            )}

            {success && (
              <div style={{
                background: '#E8F5E9',
                color: '#2E7D32',
                padding: '10px 14px',
                borderRadius: '6px',
                fontSize: '13px',
                marginBottom: '1.25rem',
                borderLeft: '3px solid #2E8B57',
              }}>
                {success}
              </div>
            )}

            {/* ── LOGIN ── */}
            {tab === 'login' && (
              <form onSubmit={handleLogin}>
                <div style={groupStyle}>
                  <label style={labelStyle}>Username</label>
                  <input
                    type="text"
                    value={loginForm.username}
                    onChange={e => setLoginForm({ ...loginForm, username: e.target.value })}
                    required
                    autoFocus
                    placeholder="Enter your username"
                    style={inputStyle}
                  />
                </div>

                <div style={{ ...groupStyle, marginBottom: '1.5rem' }}>
                  <label style={labelStyle}>Password</label>
                  <input
                    type="password"
                    value={loginForm.password}
                    onChange={e => setLoginForm({ ...loginForm, password: e.target.value })}
                    required
                    placeholder="Enter your password"
                    style={inputStyle}
                  />
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  style={{
                    width: '100%',
                    padding: '11px',
                    background: loading ? '#aaa' : '#2E8B57',
                    color: '#fff',
                    border: 'none',
                    borderRadius: '6px',
                    fontSize: '15px',
                    fontWeight: 600,
                    cursor: loading ? 'default' : 'pointer',
                    transition: 'background 0.15s',
                  }}
                >
                  {loading ? 'Signing in...' : 'Sign in'}
                </button>

                <p style={{ textAlign: 'center', fontSize: '13px', color: '#888', marginTop: '1rem' }}>
                  Don&apos;t have an account?{' '}
                  <button
                    type="button"
                    onClick={() => { setTab('register'); setError('') }}
                    style={{ background: 'none', border: 'none', color: '#2E8B57', cursor: 'pointer', fontSize: '13px', fontWeight: 600, padding: 0 }}
                  >
                    Register here
                  </button>
                </p>
              </form>
            )}

            {/* ── REGISTER ── */}
            {tab === 'register' && (
              <form onSubmit={handleRegister}>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                  <div style={groupStyle}>
                    <label style={labelStyle}>Username</label>
                    <input
                      type="text"
                      value={registerForm.username}
                      onChange={e => setRegisterForm({ ...registerForm, username: e.target.value })}
                      required
                      autoFocus
                      placeholder="Username"
                      style={inputStyle}
                    />
                  </div>
                  <div style={groupStyle}>
                    <label style={labelStyle}>
                      Phone{' '}
                      <span style={{ color: '#bbb', fontWeight: 400, fontSize: '12px' }}>(optional)</span>
                    </label>
                    <input
                      type="tel"
                      value={registerForm.phone}
                      onChange={e => setRegisterForm({ ...registerForm, phone: e.target.value })}
                      placeholder="+256 7XX XXX XXX"
                      style={inputStyle}
                    />
                  </div>
                </div>

                <div style={groupStyle}>
                  <label style={labelStyle}>Email address</label>
                  <input
                    type="email"
                    value={registerForm.email}
                    onChange={e => setRegisterForm({ ...registerForm, email: e.target.value })}
                    required
                    placeholder="your@email.com"
                    style={inputStyle}
                  />
                </div>

                <div style={groupStyle}>
                  <label style={labelStyle}>Role</label>
                  <select
                    value={registerForm.role}
                    onChange={e => setRegisterForm({ ...registerForm, role: e.target.value })}
                    required
                    style={{ ...inputStyle, color: registerForm.role ? '#111' : '#aaa' }}
                  >
                    <option value="">Select your role</option>
                    {ROLES.map(r => (
                      <option key={r.value} value={r.value}>{r.label}</option>
                    ))}
                  </select>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                  <div style={groupStyle}>
                    <label style={labelStyle}>Password</label>
                    <input
                      type="password"
                      value={registerForm.password}
                      onChange={e => setRegisterForm({ ...registerForm, password: e.target.value })}
                      required
                      placeholder="Min. 8 characters"
                      style={{
                        ...inputStyle,
                        borderColor: registerForm.password && registerForm.confirmPassword && registerForm.password !== registerForm.confirmPassword ? '#E8352A' : '#ccc',
                      }}
                    />
                  </div>
                  <div style={groupStyle}>
                    <label style={labelStyle}>Confirm password</label>
                    <input
                      type="password"
                      value={registerForm.confirmPassword}
                      onChange={e => setRegisterForm({ ...registerForm, confirmPassword: e.target.value })}
                      required
                      placeholder="Repeat password"
                      style={{
                        ...inputStyle,
                        borderColor: registerForm.password && registerForm.confirmPassword && registerForm.password !== registerForm.confirmPassword ? '#E8352A' : '#ccc',
                      }}
                    />
                  </div>
                </div>

                {registerForm.password && registerForm.confirmPassword && registerForm.password !== registerForm.confirmPassword && (
                  <p style={{ fontSize: '12px', color: '#E8352A', marginTop: '-0.5rem', marginBottom: '0.75rem' }}>
                    Passwords do not match
                  </p>
                )}

                <button
                  type="submit"
                  disabled={loading}
                  style={{
                    width: '100%',
                    padding: '11px',
                    background: loading ? '#aaa' : '#2E8B57',
                    color: '#fff',
                    border: 'none',
                    borderRadius: '6px',
                    fontSize: '15px',
                    fontWeight: 600,
                    cursor: loading ? 'default' : 'pointer',
                    marginTop: '0.5rem',
                  }}
                >
                  {loading ? 'Creating account...' : 'Create account'}
                </button>

                <p style={{ textAlign: 'center', fontSize: '13px', color: '#888', marginTop: '1rem' }}>
                  Already have an account?{' '}
                  <button
                    type="button"
                    onClick={() => { setTab('login'); setError('') }}
                    style={{ background: 'none', border: 'none', color: '#2E8B57', cursor: 'pointer', fontSize: '13px', fontWeight: 600, padding: 0 }}
                  >
                    Sign in
                  </button>
                </p>
              </form>
            )}
          </div>

          {/* Footer */}
          <div style={{
            background: '#f9f9f9',
            borderTop: '1px solid #eee',
            padding: '12px 2rem',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
          }}>
            <span style={{ fontSize: '11px', color: '#2E8B57', fontWeight: 600 }}>
              Makerere University
            </span>
            <span style={{ fontSize: '11px', color: '#aaa' }}>
              ILES v1.0 · CoCIS © 2026
            </span>
          </div>
        </div>
      </div>

      {/* Bottom footer */}
      <div style={{
        background: '#2C2C2C',
        padding: '1rem 2rem',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        flexWrap: 'wrap',
        gap: '8px',
      }}>
        <span style={{ fontSize: '12px', color: 'rgba(255,255,255,0.6)' }}>
          Copyright © 2026 · Makerere University | ILES
        </span>
        <span style={{ fontSize: '12px', color: 'rgba(255,255,255,0.4)' }}>
          E-mail: iles@cit.ac.ug
        </span>
      </div>
    </div>
  )
}