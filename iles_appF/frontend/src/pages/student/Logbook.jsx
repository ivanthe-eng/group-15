import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import axios from 'axios'

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

export default function Logbook() {
  const [logs, setLogs] = useState([])
  const [placements, setPlacements] = useState([])
  const [showForm, setShowForm] = useState(false)
  const [form, setForm] = useState({
    placement: '', week_number: '', activities: '', challenges: '',
  })
  const [error, setError] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [submittingId, setSubmittingId] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    Promise.all([
      axios.get('/api/logs/'),
      axios.get('/api/placements/'),
    ])
      .then(([logsRes, placementsRes]) => {
        setLogs(logsRes.data)
        setPlacements(placementsRes.data)
        if (placementsRes.data.length === 1) {
          setForm(f => ({ ...f, placement: String(placementsRes.data[0].id) }))
        }
      })
      .finally(() => setLoading(false))
  }, [])

  const handleCreate = async (e) => {
    e.preventDefault()
    setError('')
    setSubmitting(true)
    try {
      const res = await axios.post('/api/logs/', form)
      setLogs(prev => [...prev, res.data])
      setShowForm(false)
      setForm(f => ({ placement: f.placement, week_number: '', activities: '', challenges: '' }))
    } catch (err) {
      const d = err.response?.data
      setError(
        d?.non_field_errors?.[0] ||
        d?.week_number?.[0] ||
        d?.activities?.[0] ||
        d?.detail ||
        'Could not create log entry.'
      )
    } finally {
      setSubmitting(false)
    }
  }

  const handleSubmitLog = async (logId) => {
    setSubmittingId(logId)
    try {
      const res = await axios.post(`/api/logs/${logId}/submit/`)
      setLogs(prev => prev.map(l => l.id === logId ? { ...l, status: res.data.status } : l))
    } catch (err) {
      alert(err.response?.data?.error || 'Cannot submit this log.')
    } finally {
      setSubmittingId(null)
    }
  }

  const draftCount     = logs.filter(l => l.status === 'draft').length
  const submittedCount = logs.filter(l => l.status === 'submitted').length
  const approvedCount  = logs.filter(l => l.status === 'approved').length

  const inputStyle = {
    width: '100%', padding: '10px 12px',
    border: '1px solid #ccc', borderRadius: '6px',
    fontSize: '14px', background: '#fff',
    boxSizing: 'border-box', outline: 'none',
    transition: 'border-color 0.15s',
  }

  const labelStyle = {
    display: 'block', fontSize: '13px',
    fontWeight: 500, color: '#444', marginBottom: '5px',
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
        <p style={{ color: '#888', fontSize: '14px' }}>Loading logbook...</p>
        <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
      </div>
    )
  }

  return (
    <div style={{ maxWidth: '860px', margin: '0 auto' }}>

      {/* ── Green header ── */}
      <div style={{ background: '#2E8B57', padding: '1.5rem 2.5rem', position: 'relative' }}>
        <div style={{ height: '4px', background: '#1a6e3c', position: 'absolute', top: 0, left: 0, right: 0 }} />

        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <Link to="/student" style={{
              color: 'rgba(255,255,255,0.65)', fontSize: '12px',
              textDecoration: 'none', letterSpacing: '0.04em',
            }}>
              ← Dashboard
            </Link>
            <h2 style={{ color: '#fff', margin: '4px 0 2px', fontSize: '20px', fontWeight: 600 }}>
              Weekly logbook
            </h2>
            <p style={{ color: 'rgba(255,255,255,0.55)', fontSize: '12px', margin: 0 }}>
              Document your internship activities every week
            </p>
          </div>

          <button
            onClick={() => setShowForm(!showForm)}
            style={{
              padding: '9px 20px',
              background: showForm ? 'rgba(255,255,255,0.15)' : '#fff',
              color: showForm ? '#fff' : '#2E8B57',
              border: showForm ? '1px solid rgba(255,255,255,0.3)' : 'none',
              borderRadius: '6px',
              fontSize: '14px', fontWeight: 700, cursor: 'pointer',
            }}
          >
            {showForm ? 'Cancel' : '+ New entry'}
          </button>
        </div>

        {/* Stats */}
        <div style={{
          display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)',
          gap: '1rem', marginTop: '1.25rem',
        }}>
          {[
            { label: 'Drafts',    value: draftCount },
            { label: 'Submitted', value: submittedCount },
            { label: 'Approved',  value: approvedCount },
          ].map(s => (
            <div key={s.label} style={{
              background: 'rgba(255,255,255,0.15)',
              borderRadius: '8px', padding: '10px 14px', textAlign: 'center',
            }}>
              <div style={{ color: '#fff', fontSize: '22px', fontWeight: 700 }}>{s.value}</div>
              <div style={{ color: 'rgba(255,255,255,0.65)', fontSize: '11px', marginTop: '2px' }}>{s.label}</div>
            </div>
          ))}
        </div>

        <div style={{ height: '3px', background: '#1a6e3c', position: 'absolute', bottom: 0, left: 0, right: 0 }} />
      </div>

      <div style={{ padding: '1.5rem 2rem' }}>

        {/* New entry form */}
        {showForm && (
          <div style={{
            background: '#fff',
            border: '1px solid #c8e6c9',
            borderRadius: '12px',
            padding: '1.5rem',
            marginBottom: '1.5rem',
            borderTop: '3px solid #2E8B57',
          }}>
            <h4 style={{ margin: '0 0 1.25rem', color: '#2E8B57', fontSize: '15px', fontWeight: 600 }}>
              New log entry
            </h4>

            {error && (
              <div style={{
                background: '#FFEBEE', color: '#C62828',
                padding: '10px 14px', borderRadius: '6px',
                fontSize: '13px', marginBottom: '1rem',
                borderLeft: '3px solid #E8352A',
              }}>
                {error}
              </div>
            )}

            <form onSubmit={handleCreate}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 160px', gap: '1rem', marginBottom: '1rem' }}>
                <div>
                  <label style={labelStyle}>Placement <span style={{ color: '#E8352A' }}>*</span></label>
                  <select
                    value={form.placement}
                    onChange={e => setForm({ ...form, placement: e.target.value })}
                    required
                    style={inputStyle}
                  >
                    <option value="">Select placement</option>
                    {placements.map(p => (
                      <option key={p.id} value={p.id}>{p.company_name}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label style={labelStyle}>Week <span style={{ color: '#E8352A' }}>*</span></label>
                  <input
                    type="number" min="1" max="52"
                    value={form.week_number}
                    onChange={e => setForm({ ...form, week_number: e.target.value })}
                    required placeholder="e.g. 1"
                    style={inputStyle}
                  />
                </div>
              </div>

              <div style={{ marginBottom: '1rem' }}>
                <label style={labelStyle}>Activities this week <span style={{ color: '#E8352A' }}>*</span></label>
                <textarea
                  rows={5}
                  value={form.activities}
                  onChange={e => setForm({ ...form, activities: e.target.value })}
                  required
                  placeholder="Describe the tasks and work you did this week in detail..."
                  style={{ ...inputStyle, resize: 'vertical', lineHeight: 1.6 }}
                />
                <p style={{ fontSize: '12px', color: '#aaa', margin: '4px 0 0' }}>
                  Minimum 20 characters required
                </p>
              </div>

              <div style={{ marginBottom: '1.5rem' }}>
                <label style={labelStyle}>
                  Challenges faced{' '}
                  <span style={{ color: '#aaa', fontWeight: 400, fontSize: '12px' }}>(optional)</span>
                </label>
                <textarea
                  rows={3}
                  value={form.challenges}
                  onChange={e => setForm({ ...form, challenges: e.target.value })}
                  placeholder="Any difficulties, blockers, or things you found hard..."
                  style={{ ...inputStyle, resize: 'vertical', lineHeight: 1.6 }}
                />
              </div>

              <div style={{ display: 'flex', gap: '10px' }}>
                <button
                  type="submit"
                  disabled={submitting}
                  style={{
                    padding: '10px 24px',
                    background: submitting ? '#aaa' : '#2E8B57',
                    color: '#fff', border: 'none', borderRadius: '6px',
                    fontSize: '14px', fontWeight: 600,
                    cursor: submitting ? 'default' : 'pointer',
                  }}
                >
                  {submitting ? 'Saving...' : 'Save as draft'}
                </button>
                <button
                  type="button"
                  onClick={() => setShowForm(false)}
                  style={{
                    padding: '10px 20px', background: 'transparent',
                    color: '#555', border: '1px solid #ccc',
                    borderRadius: '6px', fontSize: '14px', cursor: 'pointer',
                  }}
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        )}

        {/* Log entries */}
        {logs.length === 0 ? (
          <div style={{
            background: '#fff', border: '2px dashed #c8e6c9',
            borderRadius: '12px', padding: '3rem 2rem', textAlign: 'center',
          }}>
            <div style={{
              width: '60px', height: '60px', background: '#E8F5E9',
              borderRadius: '50%', margin: '0 auto 1rem',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}>
              <svg width="26" height="26" viewBox="0 0 24 24" fill="none">
                <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8l-6-6z"
                  stroke="#2E8B57" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" fill="none" />
                <path d="M14 2v6h6M16 13H8M16 17H8M10 9H8"
                  stroke="#2E8B57" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </div>
            <h3 style={{ color: '#333', margin: '0 0 8px', fontSize: '17px' }}>No log entries yet</h3>
            <p style={{ color: '#888', fontSize: '14px', maxWidth: '320px', margin: '0 auto 1.5rem', lineHeight: 1.6 }}>
              Start documenting your internship by creating your first weekly log entry.
            </p>
            <button
              onClick={() => setShowForm(true)}
              style={{
                padding: '10px 24px', background: '#2E8B57',
                color: '#fff', border: 'none', borderRadius: '6px',
                fontSize: '14px', fontWeight: 600, cursor: 'pointer',
              }}
            >
              + Create first entry
            </button>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            {logs.map(log => (
              <div key={log.id} style={{
                background: '#fff', border: '1px solid #e0e0e0',
                borderRadius: '10px', padding: '1rem 1.25rem',
                display: 'flex', alignItems: 'flex-start', gap: '1rem',
                borderLeft: `4px solid ${STATUS_COLOR[log.status]}`,
              }}>
                {/* Week badge */}
                <div style={{
                  width: '54px', height: '54px',
                  background: STATUS_BG[log.status],
                  borderRadius: '8px',
                  display: 'flex', flexDirection: 'column',
                  alignItems: 'center', justifyContent: 'center', flexShrink: 0,
                }}>
                  <span style={{ fontSize: '20px', fontWeight: 700, color: STATUS_COLOR[log.status], lineHeight: 1 }}>
                    {log.week_number}
                  </span>
                  <span style={{ fontSize: '9px', color: STATUS_COLOR[log.status], opacity: 0.75, letterSpacing: '0.05em' }}>
                    WEEK
                  </span>
                </div>

                {/* Content */}
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '5px', flexWrap: 'wrap' }}>
                    <span style={{
                      fontSize: '12px', fontWeight: 600,
                      color: STATUS_COLOR[log.status],
                      background: STATUS_BG[log.status],
                      padding: '2px 10px', borderRadius: '99px', textTransform: 'capitalize',
                    }}>
                      {log.status}
                    </span>
                    {log.placement_company && (
                      <span style={{ fontSize: '12px', color: '#aaa' }}>{log.placement_company}</span>
                    )}
                  </div>
                  <p style={{
                    margin: '0 0 4px', fontSize: '13px', color: '#333', lineHeight: 1.5,
                    overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                  }}>
                    {log.activities || 'No activities recorded.'}
                  </p>
                  {log.challenges && (
                    <p style={{
                      margin: '0 0 4px', fontSize: '12px', color: '#888', lineHeight: 1.4,
                      overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                    }}>
                      Challenges: {log.challenges}
                    </p>
                  )}
                  <p style={{ margin: 0, fontSize: '12px', color: '#bbb' }}>
                    {log.submitted_at
                      ? `Submitted ${new Date(log.submitted_at).toLocaleDateString('en-UG', { day: 'numeric', month: 'short', year: 'numeric' })}`
                      : `Created ${new Date(log.created_at).toLocaleDateString('en-UG', { day: 'numeric', month: 'short', year: 'numeric' })}`
                    }
                  </p>
                </div>

                {/* Action */}
                <div style={{ flexShrink: 0, display: 'flex', alignItems: 'center' }}>
                  {log.status === 'draft' && (
                    <button
                      onClick={() => handleSubmitLog(log.id)}
                      disabled={submittingId === log.id}
                      style={{
                        padding: '7px 18px',
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
                    <div style={{ width: '32px', height: '32px', background: '#E8F5E9', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                        <path d="M20 6L9 17l-5-5" stroke="#2E8B57" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
                      </svg>
                    </div>
                  )}
                  {log.status === 'submitted' && (
                    <div style={{ width: '32px', height: '32px', background: '#E6F1FB', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
                        <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5" stroke="#378ADD" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                      </svg>
                    </div>
                  )}
                  {log.status === 'reviewed' && (
                    <div style={{ width: '32px', height: '32px', background: '#FAEEDA', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
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

        {/* Bottom add button */}
        {logs.length > 0 && (
          <div style={{ textAlign: 'center', marginTop: '1.5rem' }}>
            <button
              onClick={() => setShowForm(true)}
              style={{
                padding: '10px 28px', background: 'transparent',
                color: '#2E8B57', border: '2px solid #2E8B57',
                borderRadius: '6px', fontSize: '14px', fontWeight: 600, cursor: 'pointer',
              }}
            >
              + Add another week
            </button>
          </div>
        )}

      </div>
    </div>
  )
}