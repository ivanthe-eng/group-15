import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import axios from 'axios'
import { useAuth } from '../../context/AuthContext'

const STATUS_COLOR = {
  draft:     '#888',
  submitted: '#378ADD',
  reviewed:  '#BA7517',
  approved:  '#2E8B57',
}

const STATUS_BG = {
  draft:     '#f5f5f5',
  submitted: '#E6F1FB',
  reviewed:  '#FAEEDA',
  approved:  '#E8F5E9',
}

export default function StudentDashboard() {
  const { user } = useAuth()
  const [data, setData] = useState(null)
  const [logs, setLogs] = useState([])
  const [loading, setLoading] = useState(true)
  const [submittingId, setSubmittingId] = useState(null)

  useEffect(() => {
    Promise.all([
      axios.get('/api/dashboard/student/'),
      axios.get('/api/logs/'),
    ])
      .then(([dashRes, logsRes]) => {
        setData(dashRes.data)
        setLogs(logsRes.data)
      })
      .finally(() => setLoading(false))
  }, [])

  const handleSubmitLog = async (logId) => {
    setSubmittingId(logId)
    try {
      const res = await axios.post(`/api/logs/${logId}/submit/`)
      setLogs(prev =>
        prev.map(l => l.id === logId ? { ...l, status: res.data.status } : l)
      )
    } catch (err) {
      alert(err.response?.data?.error || 'Cannot submit this log.')
    } finally {
      setSubmittingId(null)
    }
  }

  if (loading) {
    return (
      <div style={{
        display: 'flex', alignItems: 'center',
        justifyContent: 'center', height: '60vh',
        flexDirection: 'column', gap: '12px',
      }}>
        <div style={{
          width: '36px', height: '36px',
          border: '3px solid #f0f0f0',
          borderTop: '3px solid #2E8B57',
          borderRadius: '50%',
          animation: 'spin 0.8s linear infinite',
        }} />
        <p style={{ color: '#888', fontSize: '14px' }}>Loading your dashboard...</p>
        <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
      </div>
    )
  }

  const placement = data?.placements?.[0] || null

  return (
    <div style={{ maxWidth: '860px', margin: '0 auto' }}>

      {/* ── Green hero banner ── */}
      <div style={{
        background: '#2E8B57',
        padding: '2rem 2.5rem',
        position: 'relative',
      }}>
        <div style={{ height: '4px', background: '#1a6e3c', position: 'absolute', top: 0, left: 0, right: 0 }} />

        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
          <div>
            <p style={{
              color: 'rgba(255,255,255,0.65)',
              fontSize: '11px',
              margin: '0 0 4px',
              letterSpacing: '0.08em',
              textTransform: 'uppercase',
            }}>
              Makerere University · ILES
            </p>
            <h2 style={{ color: '#fff', margin: '0 0 4px', fontSize: '22px', fontWeight: 600 }}>
              Welcome, {user?.username}
            </h2>
            <p style={{ color: 'rgba(255,255,255,0.65)', fontSize: '13px', margin: 0 }}>
              {placement ? placement.company : 'No placement assigned yet'}
            </p>
          </div>

          <Link to="/student/logbook" style={{
            padding: '9px 20px',
            background: '#fff',
            color: '#2E8B57',
            borderRadius: '6px',
            textDecoration: 'none',
            fontSize: '14px',
            fontWeight: 700,
            flexShrink: 0,
          }}>
            + New log entry
          </Link>
        </div>

        {/* Stats */}
        {placement && (
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(4, 1fr)',
            gap: '1rem',
            marginTop: '1.5rem',
          }}>
            {[
              { label: 'Total logs',  value: placement.total_logs },
              { label: 'Submitted',   value: placement.submitted_logs },
              { label: 'Approved',    value: placement.approved_logs },
              { label: 'Drafts',      value: logs.filter(l => l.status === 'draft').length },
            ].map(s => (
              <div key={s.label} style={{
                background: 'rgba(255,255,255,0.15)',
                borderRadius: '8px',
                padding: '12px 16px',
                textAlign: 'center',
              }}>
                <div style={{ color: '#fff', fontSize: '26px', fontWeight: 700 }}>
                  {s.value}
                </div>
                <div style={{ color: 'rgba(255,255,255,0.7)', fontSize: '11px', marginTop: '2px' }}>
                  {s.label}
                </div>
              </div>
            ))}
          </div>
        )}

        <div style={{ height: '3px', background: '#1a6e3c', position: 'absolute', bottom: 0, left: 0, right: 0 }} />
      </div>

      <div style={{ padding: '1.5rem 2rem' }}>

        {/* No placement */}
        {!placement && (
          <div style={{
            background: '#fff',
            border: '1px solid #e0e0e0',
            borderRadius: '12px',
            padding: '3rem 2rem',
            textAlign: 'center',
            marginBottom: '1.5rem',
          }}>
            <div style={{
              width: '64px', height: '64px',
              background: '#E8F5E9',
              borderRadius: '50%',
              margin: '0 auto 1rem',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}>
              <svg width="28" height="28" viewBox="0 0 24 24" fill="none">
                <circle cx="12" cy="12" r="10" fill="#2E8B57" opacity="0.2" />
                <path d="M12 7v6M12 17h.01" stroke="#2E8B57" strokeWidth="2" strokeLinecap="round" />
              </svg>
            </div>
            <h3 style={{ color: '#333', margin: '0 0 8px' }}>No placement assigned yet</h3>
            <p style={{ color: '#888', fontSize: '14px', maxWidth: '340px', margin: '0 auto 1.5rem', lineHeight: 1.6 }}>
              Contact your administrator to have an internship placement created for your account.
            </p>
            <div style={{
              background: '#f9f9f9',
              border: '1px solid #eee',
              borderRadius: '10px',
              padding: '1.25rem',
              textAlign: 'left',
              maxWidth: '360px',
              margin: '0 auto',
            }}>
              <p style={{ fontSize: '13px', fontWeight: 500, color: '#444', marginBottom: '10px' }}>
                What happens next:
              </p>
              {[
                'Admin creates your internship placement',
                'Supervisors are assigned to your placement',
                'You submit weekly logbook entries',
                'Supervisors review and approve your logs',
                'Your final score is computed at the end',
              ].map((step, i) => (
                <div key={i} style={{ display: 'flex', alignItems: 'flex-start', gap: '10px', marginBottom: '8px' }}>
                  <div style={{
                    width: '20px', height: '20px',
                    borderRadius: '50%',
                    background: '#2E8B57',
                    color: '#fff',
                    fontSize: '11px',
                    fontWeight: 700,
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    flexShrink: 0,
                  }}>
                    {i + 1}
                  </div>
                  <p style={{ fontSize: '13px', color: '#555', margin: 0, lineHeight: 1.5 }}>{step}</p>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Progress bar */}
        {placement && (
          <div style={{
            background: '#fff',
            border: '1px solid #e0e0e0',
            borderRadius: '12px',
            padding: '1.25rem 1.5rem',
            marginBottom: '1.5rem',
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
              <div>
                <p style={{ fontWeight: 500, margin: '0 0 2px', fontSize: '15px' }}>{placement.company}</p>
                <p style={{ color: '#888', fontSize: '13px', margin: 0 }}>
                  {placement.start_date} → {placement.end_date}
                </p>
              </div>
              {placement.is_active && (
                <span style={{
                  background: '#E8F5E9', color: '#2E7D32',
                  padding: '3px 12px', borderRadius: '99px',
                  fontSize: '12px', fontWeight: 500,
                }}>
                  Active
                </span>
              )}
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px', color: '#666', marginBottom: '6px' }}>
              <span>Overall progress</span>
              <span>{placement.approved_logs} of {placement.total_logs} logs approved</span>
            </div>
            <div style={{ background: '#f0f0f0', borderRadius: '99px', height: '9px' }}>
              <div style={{
                background: '#2E8B57',
                borderRadius: '99px',
                height: '9px',
                width: `${placement.total_logs ? (placement.approved_logs / placement.total_logs) * 100 : 0}%`,
                transition: 'width 0.5s ease',
                minWidth: placement.total_logs > 0 ? '6px' : '0',
              }} />
            </div>

            {placement.computed_score && (
              <div style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '10px',
                marginTop: '1rem',
                background: '#E8F5E9',
                border: '1px solid #c8e6c9',
                borderRadius: '10px',
                padding: '8px 16px',
              }}>
                <span style={{ fontSize: '32px', fontWeight: 700, color: '#2E8B57' }}>
                  {placement.letter_grade}
                </span>
                <div>
                  <div style={{ fontSize: '18px', fontWeight: 600, color: '#333' }}>
                    {placement.computed_score} / 100
                  </div>
                  <div style={{ fontSize: '11px', color: '#888' }}>Final score</div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Logbook entries */}
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: '1rem',
        }}>
          <h3 style={{ margin: 0, fontSize: '16px', fontWeight: 600 }}>Weekly logbook</h3>
          <Link to="/student/logbook" style={{
            fontSize: '13px', color: '#2E8B57',
            textDecoration: 'none', fontWeight: 500,
          }}>
            View all →
          </Link>
        </div>

        {logs.length === 0 ? (
          <div style={{
            background: '#fff',
            border: '2px dashed #c8e6c9',
            borderRadius: '12px',
            padding: '2.5rem',
            textAlign: 'center',
          }}>
            <p style={{ color: '#2E8B57', fontWeight: 500, marginBottom: '6px' }}>
              No log entries yet
            </p>
            <p style={{ color: '#888', fontSize: '13px', marginBottom: '1.25rem' }}>
              Start documenting your internship activities every week.
            </p>
            <Link to="/student/logbook" style={{
              padding: '9px 22px',
              background: '#2E8B57',
              color: '#fff',
              borderRadius: '6px',
              textDecoration: 'none',
              fontSize: '14px',
              fontWeight: 600,
            }}>
              Create first entry
            </Link>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            {logs.map(log => (
              <div key={log.id} style={{
                background: '#fff',
                border: '1px solid #e0e0e0',
                borderRadius: '10px',
                padding: '1rem 1.25rem',
                display: 'flex',
                alignItems: 'flex-start',
                gap: '1rem',
                borderLeft: `4px solid ${STATUS_COLOR[log.status]}`,
              }}>
                {/* Week badge */}
                <div style={{
                  width: '52px', height: '52px',
                  background: STATUS_BG[log.status],
                  borderRadius: '8px',
                  display: 'flex', flexDirection: 'column',
                  alignItems: 'center', justifyContent: 'center',
                  flexShrink: 0,
                }}>
                  <span style={{ fontSize: '18px', fontWeight: 700, color: STATUS_COLOR[log.status], lineHeight: 1 }}>
                    {log.week_number}
                  </span>
                  <span style={{ fontSize: '9px', color: STATUS_COLOR[log.status], opacity: 0.75, letterSpacing: '0.05em' }}>
                    WEEK
                  </span>
                </div>

                {/* Content */}
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px', flexWrap: 'wrap' }}>
                    <span style={{
                      fontSize: '12px', fontWeight: 600,
                      color: STATUS_COLOR[log.status],
                      background: STATUS_BG[log.status],
                      padding: '2px 10px', borderRadius: '99px',
                      textTransform: 'capitalize',
                    }}>
                      {log.status}
                    </span>
                    {log.placement_company && (
                      <span style={{ fontSize: '12px', color: '#aaa' }}>{log.placement_company}</span>
                    )}
                  </div>
                  <p style={{
                    margin: '0 0 4px', fontSize: '13px', color: '#333',
                    lineHeight: 1.5, overflow: 'hidden',
                    textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                  }}>
                    {log.activities || 'No activities recorded.'}
                  </p>
                  <p style={{ margin: 0, fontSize: '12px', color: '#bbb' }}>
                    {log.submitted_at
                      ? `Submitted ${new Date(log.submitted_at).toLocaleDateString('en-UG', { day: 'numeric', month: 'short', year: 'numeric' })}`
                      : `Created ${new Date(log.created_at).toLocaleDateString('en-UG', { day: 'numeric', month: 'short', year: 'numeric' })}`
                    }
                  </p>
                </div>

                {/* Action */}
                <div style={{ flexShrink: 0 }}>
                  {log.status === 'draft' && (
                    <button
                      onClick={() => handleSubmitLog(log.id)}
                      disabled={submittingId === log.id}
                      style={{
                        padding: '7px 16px',
                        background: submittingId === log.id ? '#aaa' : '#2E8B57',
                        color: '#fff', border: 'none', borderRadius: '6px',
                        fontSize: '13px', fontWeight: 600,
                        cursor: submittingId === log.id ? 'default' : 'pointer',
                      }}
                    >
                      {submittingId === log.id ? 'Submitting...' : 'Submit'}
                    </button>
                  )}
                  {log.status === 'approved' && (
                    <div style={{
                      width: '32px', height: '32px', background: '#E8F5E9',
                      borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center',
                    }}>
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                        <path d="M20 6L9 17l-5-5" stroke="#2E8B57" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
                      </svg>
                    </div>
                  )}
                  {log.status === 'submitted' && (
                    <div style={{
                      width: '32px', height: '32px', background: '#E6F1FB',
                      borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center',
                    }}>
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
                        <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5" stroke="#378ADD" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                      </svg>
                    </div>
                  )}
                  {log.status === 'reviewed' && (
                    <div style={{
                      width: '32px', height: '32px', background: '#FAEEDA',
                      borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center',
                    }}>
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
                        <circle cx="11" cy="11" r="8" stroke="#BA7517" strokeWidth="2" />
                        <path d="m21 21-4.35-4.35" stroke="#BA7517" strokeWidth="2" strokeLinecap="round" />
                      </svg>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Week pills */}
        {placement && placement.log_statuses.length > 0 && (
          <div style={{
            background: '#fff', border: '1px solid #e0e0e0',
            borderRadius: '12px', padding: '1.25rem 1.5rem',
            marginTop: '1.5rem',
          }}>
            <p style={{ fontSize: '13px', fontWeight: 500, color: '#444', margin: '0 0 10px' }}>
              Weeks at a glance
            </p>
            <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
              {placement.log_statuses.map(l => (
                <span key={l.week_number} style={{
                  padding: '4px 12px', borderRadius: '99px',
                  fontSize: '12px', fontWeight: 500,
                  background: STATUS_BG[l.status],
                  color: STATUS_COLOR[l.status],
                  border: `1px solid ${STATUS_COLOR[l.status]}33`,
                }}>
                  Wk {l.week_number} · {l.status}
                </span>
              ))}
            </div>
          </div>
        )}

      </div>
    </div>
  )
}