import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import makLogo from '../assets/mak_logo.png'

const ROLE_HOME = {
  student: '/student',
  workplace_supervisor: '/supervisor',
  academic_supervisor: '/supervisor',
  admin: '/admin',
}

const ROLE_LABEL = {
  student: 'Student',
  workplace_supervisor: 'Workplace Supervisor',
  academic_supervisor: 'Academic Supervisor',
  admin: 'Admin',
}

export default function Navbar() {
  const { user, logout } = useAuth()
  const navigate = useNavigate()
  if (!user) return null

  return (
    <>
      {/* Top contact bar — matches MAK elearning site */}
      <div style={{
        background: '#1a6e3c',
        padding: '5px 1.5rem',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        fontSize: '12px',
        color: 'rgba(255,255,255,0.8)',
      }}>
        <span>Makerere University · College of Computing &amp; Information Sciences</span>
        <span>ILES — Internship Logging &amp; Evaluation System</span>
      </div>

      {/* Main navbar */}
      <nav style={{
        background: '#2E8B57',
        padding: '0 1.5rem',
        height: '58px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        position: 'sticky',
        top: 0,
        zIndex: 100,
        boxShadow: '0 2px 8px rgba(0,0,0,0.15)',
      }}>
        {/* Logo + name */}
        <Link to={ROLE_HOME[user.role] || '/'} style={{
          textDecoration: 'none',
          display: 'flex',
          alignItems: 'center',
          gap: '12px',
        }}>
          <img
            src={makLogo}
            alt="Makerere University"
            style={{
              width: '38px',
              height: '38px',
              objectFit: 'contain',
              filter: 'drop-shadow(0 1px 3px rgba(0,0,0,0.3))',
            }}
          />
          <div>
            <div style={{ color: '#fff', fontWeight: 700, fontSize: '15px', lineHeight: 1.2 }}>
              ILES
            </div>
            <div style={{ color: 'rgba(255,255,255,0.7)', fontSize: '10px', lineHeight: 1 }}>
              Makerere University
            </div>
          </div>
        </Link>

        {/* User info + logout */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <span style={{ color: 'rgba(255,255,255,0.9)', fontSize: '13px' }}>
            {user.username}
          </span>
          <span style={{
            padding: '3px 10px',
            borderRadius: '99px',
            fontSize: '11px',
            background: 'rgba(255,255,255,0.2)',
            color: '#fff',
            fontWeight: 500,
          }}>
            {ROLE_LABEL[user.role]}
          </span>
          <button
            onClick={() => { logout(); navigate('/login') }}
            style={{
              padding: '6px 14px',
              borderRadius: '6px',
              border: '1px solid rgba(255,255,255,0.4)',
              background: 'transparent',
              color: '#fff',
              fontSize: '13px',
              cursor: 'pointer',
            }}
          >
            Log out
          </button>
        </div>
      </nav>
    </>
  )
}