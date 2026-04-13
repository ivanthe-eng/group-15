import { useState, useEffect } from 'react'
import axios from 'axios'
import { useAuth } from '../../context/AuthContext'

const STATUS_COLOR = {
  draft:     '#888',
  submitted: '#185FA5',
  reviewed:  '#854F0B',
  approved:  '#3B6D11',
}

const STATUS_BG = {
  draft:     '#f5f5f5',
  submitted: '#E6F1FB',
  reviewed:  '#FAEEDA',
  approved:  '#EAF3DE',
}

const STATUS_TEXT = {
  draft:     '#555',
  submitted: '#0C447C',
  reviewed:  '#633806',
  approved:  '#27500A',
}

// ─── small reusables ──────────────────────────────────────────────────────────

function StatusBadge({ status }) {
  return (
    <span style={{
      fontSize: '11px', fontWeight: 500,
      padding: '3px 9px', borderRadius: '99px',
      background: STATUS_BG[status] || '#f5f5f5',
      color: STATUS_TEXT[status] || '#555',
      textTransform: 'capitalize',
      display: 'inline-block',
    }}>
      {status}
    </span>
  )
}

function SectionLabel({ text, color, count }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '10px' }}>
      <span style={{
        fontSize: '11px', fontWeight: 500, color,
        textTransform: 'uppercase', letterSpacing: '0.07em',
      }}>
        {text}
      </span>
      <span style={{
        background: `${color}22`, color,
        fontSize: '11px', fontWeight: 500,
        padding: '1px 7px', borderRadius: '99px',
      }}>
        {count}
      </span>
    </div>
  )
}

function StatCard({ label, value, color, bg }) {
  return (
    <div style={{
      background: bg, borderRadius: '8px', padding: '12px 14px', flex: 1,
    }}>
      <div style={{ fontSize: '22px', fontWeight: 500, color }}>{value}</div>
      <div style={{ fontSize: '12px', color, opacity: 0.8, marginTop: '2px' }}>{label}</div>
    </div>
  )
}

function ProgressBar({ pct }) {
  return (
    <div style={{ background: '#e8e8e8', borderRadius: '99px', height: '4px', overflow: 'hidden' }}>
      <div style={{
        background: '#3B6D11', height: '4px',
        width: `${pct}%`, borderRadius: '99px',
        transition: 'width 0.4s',
      }} />
    </div>
  )
}

function ActionButton({ label, onClick, variant = 'solid', color }) {
  const base = {
    padding: '8px 18px', borderRadius: '8px',
    fontSize: '13px', fontWeight: 500, cursor: 'pointer',
  }
  if (variant === 'solid') {
    return (
      <button onClick={onClick} style={{ ...base, background: color, color: '#fff', border: 'none' }}>
        {label}
      </button>
    )
  }
  return (
    <button onClick={onClick} style={{
      ...base, background: 'transparent',
      color: color, border: `1px solid ${color}`,
    }}>
      {label}
    </button>
  )
}

// ─── main component ───────────────────────────────────────────────────────────

export default function ReviewDashboard() {
  const { user } = useAuth()
  const [queue, setQueue] = useState({ pending_review: [], pending_approval: [] })
  const [stats, setStats] = useState(null)
  const [selected, setSelected] = useState(null)
  const [history, setHistory] = useState([])
  const [comment, setComment] = useState('')
  const [error, setError] = useState('')
  const [actionMsg, setActionMsg] = useState('')
  const [loading, setLoading] = useState(true)

  useEffect(() => { fetchAll() }, [])

  const fetchAll = () => {
    setLoading(true)
    Promise.all([
      axios.get('/api/supervisor/queue/'),
      axios.get('/api/dashboard/supervisor/'),
    ])
      .then(([queueRes, statsRes]) => {
        setQueue(queueRes.data)
        setStats(statsRes.data)
      })
      .finally(() => setLoading(false))
  }

  const selectLog = (log) => {
    setSelected(log)
    setComment('')
    setError('')
    setActionMsg('')
    axios.get(`/api/logs/${log.id}/history/`).then(res => setHistory(res.data))
  }

  const act = async (endpoint, body = {}, successMsg = '') => {
    if ((endpoint === 'reject' || body.status === 'draft') && !comment.trim()) {
      setError('A comment is required when sending a log back.')
      return
    }
    setError('')
    try {
      await axios.post(`/api/logs/${selected.id}/${endpoint}/`, { comment, ...body })
      setActionMsg(successMsg)
      fetchAll()
      if (endpoint !== 'review' || body.status === 'draft') {
        setSelected(null)
      } else {
        // refresh selected
        axios.get(`/api/logs/${selected.id}/history/`).then(res => setHistory(res.data))
      }
    } catch (err) {
      setError(err.response?.data?.error || 'Action failed.')
    }
  }

  if (loading) {
    return (
      <div style={{
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        height: '60vh', flexDirection: 'column', gap: '12px',
      }}>
        <div style={{
          width: '32px', height: '32px',
          border: '2px solid #e0e0e0',
          borderTop: '2px solid #3B6D11',
          borderRadius: '50%',
          animation: 'spin 0.8s linear infinite',
        }} />
        <p style={{ color: '#999', fontSize: '13px' }}>Loading dashboard…</p>
        <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
      </div>
    )
  }

  const totalPending = (stats?.pending_total ?? 0)
  const allLogs = [...queue.pending_review, ...queue.pending_approval]

  return (
    <div style={{ maxWidth: '1080px', margin: '0 auto', fontFamily: 'inherit' }}>

      {/* ── Header ── */}
      <div style={{ background: '#1a6e3c', padding: '16px 20px 14px' }}>
        <p style={{ color: 'rgba(255,255,255,0.55)', fontSize: '11px', margin: '0 0 3px', letterSpacing: '0.08em', textTransform: 'uppercase' }}>
          Makerere University · ILES
        </p>
        <h2 style={{ color: '#fff', margin: '0 0 2px', fontSize: '18px', fontWeight: 500 }}>
          Review dashboard
        </h2>
        <p style={{ color: 'rgba(255,255,255,0.6)', fontSize: '13px', margin: 0 }}>
          {user?.username} · {totalPending} log{totalPending !== 1 ? 's' : ''} awaiting action
        </p>
      </div>

      <div style={{ padding: '16px 18px 32px' }}>

        {/* ── Stat cards ── */}
        <div style={{ display: 'flex', gap: '10px', marginBottom: '18px' }}>
          <StatCard label="Awaiting review"    value={queue.pending_review.length}   color="#185FA5" bg="#E6F1FB" />
          <StatCard label="Pending approval"   value={queue.pending_approval.length} color="#854F0B" bg="#FAEEDA" />
          <StatCard label="Approved this month" value={stats?.approved_this_month ?? 0} color="#3B6D11" bg="#EAF3DE" />
          <StatCard label="Total interns"      value={stats?.interns?.length ?? 0}   color="#555"    bg="#f5f5f5" />
        </div>

        {/* ── Main grid ── */}
        <div style={{ display: 'grid', gridTemplateColumns: '260px 1fr', gap: '16px', alignItems: 'start' }}>

          {/* ── Left column ── */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>

            {/* Pending review queue */}
            <div style={{
              background: '#fff', border: '1px solid #e8e8e8',
              borderRadius: '12px', padding: '14px',
            }}>
              <SectionLabel text="Pending review" color="#185FA5" count={queue.pending_review.length} />
              {queue.pending_review.length === 0
                ? <p style={{ fontSize: '13px', color: '#bbb', padding: '4px 0' }}>All caught up.</p>
                : queue.pending_review.map(log => (
                  <QueueCard
                    key={log.id}
                    log={log}
                    accentColor="#185FA5"
                    isActive={selected?.id === log.id}
                    onClick={() => selectLog(log)}
                  />
                ))
              }
            </div>

            {/* Pending approval queue */}
            <div style={{
              background: '#fff', border: '1px solid #e8e8e8',
              borderRadius: '12px', padding: '14px',
            }}>
              <SectionLabel text="Pending approval" color="#854F0B" count={queue.pending_approval.length} />
              {queue.pending_approval.length === 0
                ? <p style={{ fontSize: '13px', color: '#bbb', padding: '4px 0' }}>Nothing to approve.</p>
                : queue.pending_approval.map(log => (
                  <QueueCard
                    key={log.id}
                    log={log}
                    accentColor="#854F0B"
                    isActive={selected?.id === log.id}
                    onClick={() => selectLog(log)}
                  />
                ))
              }
            </div>

            {/* Interns progress */}
            {stats?.interns?.length > 0 && (
              <div style={{
                background: '#fff', border: '1px solid #e8e8e8',
                borderRadius: '12px', padding: '14px',
              }}>
                <div style={{
                  fontSize: '11px', fontWeight: 500, color: '#888',
                  textTransform: 'uppercase', letterSpacing: '0.07em', marginBottom: '12px',
                }}>
                  My interns
                </div>
                {stats.interns.map(intern => (
                  <div key={intern.placement_id} style={{ marginBottom: '12px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: '4px' }}>
                      <span style={{ fontSize: '13px', fontWeight: 500 }}>{intern.student}</span>
                      <span style={{ fontSize: '12px', color: '#999' }}>{intern.completion_pct}%</span>
                    </div>
                    <ProgressBar pct={intern.completion_pct} />
                    {(intern.submitted != null) && (
                      <div style={{ fontSize: '11px', color: '#aaa', marginTop: '3px' }}>
                        {intern.approved ?? '–'} approved · {intern.submitted} submitted
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* ── Detail panel ── */}
          {!selected ? (
            <div style={{
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              flexDirection: 'column', gap: '10px',
              border: '1px dashed #ddd', borderRadius: '12px',
              background: '#fafafa', minHeight: '320px',
            }}>
              <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#ccc" strokeWidth="1.5">
                <rect x="3" y="3" width="18" height="18" rx="3" />
                <path d="M8 12h8M8 8h8M8 16h5" />
              </svg>
              <p style={{ fontSize: '13px', color: '#bbb' }}>Select a log to review</p>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>

              {/* Log detail card */}
              <div style={{
                background: '#fff', border: '1px solid #e8e8e8',
                borderRadius: '12px', padding: '16px 18px',
              }}>
                {/* Detail header */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '12px' }}>
                  <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '3px' }}>
                      <span style={{ fontSize: '16px', fontWeight: 500 }}>{selected.student_username}</span>
                      <StatusBadge status={selected.status} />
                    </div>
                    <p style={{ fontSize: '13px', color: '#999', margin: 0 }}>
                      {selected.placement_company} · Week {selected.week_number}
                    </p>
                  </div>
                  <button
                    onClick={() => { setSelected(null); setError(''); setActionMsg('') }}
                    style={{
                      background: 'none', border: 'none', cursor: 'pointer',
                      color: '#aaa', fontSize: '20px', lineHeight: 1, padding: '0 4px',
                    }}
                  >
                    ×
                  </button>
                </div>

                {/* Activities */}
                <div style={{ marginBottom: '12px' }}>
                  <div style={{
                    fontSize: '11px', fontWeight: 500, color: '#888',
                    textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: '6px',
                  }}>
                    Activities
                  </div>
                  <div style={{
                    background: '#f9f9f9', border: '1px solid #f0f0f0',
                    borderRadius: '8px', padding: '12px',
                    fontSize: '13px', lineHeight: 1.7, color: '#333',
                  }}>
                    {selected.activities}
                  </div>
                </div>

                {/* Challenges */}
                {selected.challenges && (
                  <div style={{ marginBottom: '12px' }}>
                    <div style={{
                      fontSize: '11px', fontWeight: 500, color: '#888',
                      textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: '6px',
                    }}>
                      Challenges
                    </div>
                    <div style={{
                      background: '#f9f9f9', border: '1px solid #f0f0f0',
                      borderRadius: '8px', padding: '12px',
                      fontSize: '13px', lineHeight: 1.7, color: '#333',
                    }}>
                      {selected.challenges}
                    </div>
                  </div>
                )}

                {/* Alerts */}
                {error && (
                  <div style={{
                    background: '#FCEBEB', color: '#791F1F',
                    padding: '10px 12px', borderRadius: '0',
                    borderLeft: '3px solid #E24B4A',
                    fontSize: '13px', marginBottom: '12px',
                  }}>
                    {error}
                  </div>
                )}
                {actionMsg && (
                  <div style={{
                    background: '#EAF3DE', color: '#27500A',
                    padding: '10px 12px', borderRadius: '0',
                    borderLeft: '3px solid #639922',
                    fontSize: '13px', marginBottom: '12px',
                  }}>
                    {actionMsg}
                  </div>
                )}

                {/* Comment */}
                <div style={{ marginBottom: '12px' }}>
                  <label style={{
                    display: 'block', fontSize: '11px', fontWeight: 500, color: '#888',
                    textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: '5px',
                  }}>
                    Comment
                  </label>
                  <textarea
                    rows={3}
                    value={comment}
                    onChange={e => setComment(e.target.value)}
                    placeholder="Add a comment (required when sending back)…"
                    style={{
                      width: '100%', padding: '10px 12px', boxSizing: 'border-box',
                      border: '1px solid #ddd', borderRadius: '8px',
                      fontSize: '13px', resize: 'vertical', lineHeight: 1.6,
                    }}
                  />
                </div>

                {/* Actions */}
                <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                  {selected.status === 'submitted' && (
                    <>
                      <ActionButton
                        label="Mark reviewed"
                        color="#3B6D11"
                        onClick={() => act('review', { status: 'reviewed' }, 'Marked as reviewed.')}
                      />
                      <ActionButton
                        label="Send back"
                        color="#A32D2D"
                        variant="outline"
                        onClick={() => act('review', { status: 'draft' }, '')}
                      />
                    </>
                  )}
                  {selected.status === 'reviewed' && (
                    <>
                      <ActionButton
                        label="Approve"
                        color="#3B6D11"
                        onClick={() => act('approve', {}, 'Log approved successfully.')}
                      />
                      <ActionButton
                        label="Send back"
                        color="#A32D2D"
                        variant="outline"
                        onClick={() => act('review', { status: 'draft' }, '')}
                      />
                    </>
                  )}
                  {selected.status === 'approved' && (
                    <span style={{ fontSize: '13px', color: '#3B6D11', fontWeight: 500, padding: '8px 0' }}>
                      Approved — no further actions.
                    </span>
                  )}
                </div>
              </div>

              {/* Status history */}
              {history.length > 0 && (
                <div style={{
                  background: '#fff', border: '1px solid #e8e8e8',
                  borderRadius: '12px', padding: '14px 18px',
                }}>
                  <div style={{
                    fontSize: '11px', fontWeight: 500, color: '#888',
                    textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: '12px',
                  }}>
                    Status history
                  </div>
                  {[...history].reverse().map(h => (
                    <div key={h.id} style={{ display: 'flex', gap: '12px', marginBottom: '14px', alignItems: 'flex-start' }}>
                      <div style={{
                        width: '8px', height: '8px', borderRadius: '50%',
                        background: STATUS_COLOR[h.to_status] || '#ccc',
                        marginTop: '4px', flexShrink: 0,
                      }} />
                      <div style={{ flex: 1 }}>
                        <div style={{ fontSize: '13px', fontWeight: 500 }}>
                          {h.changed_by_username || 'System'}
                          <span style={{ fontWeight: 400, color: '#999' }}> moved </span>
                          <span style={{ color: STATUS_COLOR[h.from_status] }}>{h.from_status}</span>
                          <span style={{ color: '#bbb' }}> → </span>
                          <span style={{ color: STATUS_COLOR[h.to_status] }}>{h.to_status}</span>
                        </div>
                        <div style={{ fontSize: '12px', color: '#aaa', marginTop: '1px' }}>
                          {new Date(h.changed_at).toLocaleString()}
                        </div>
                        {h.comment && h.comment !== 'Auto-recorded by signal.' && (
                          <div style={{ fontSize: '13px', color: '#888', marginTop: '3px', fontStyle: 'italic' }}>
                            "{h.comment}"
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}

            </div>
          )}
        </div>
      </div>
    </div>
  )
}

// ─── Queue card (extracted for clarity) ──────────────────────────────────────

function QueueCard({ log, accentColor, isActive, onClick }) {
  return (
    <div
      onClick={onClick}
      style={{
        padding: '11px 12px', marginBottom: '6px',
        borderRadius: '8px', cursor: 'pointer',
        background: '#fff',
        border: isActive ? `1.5px solid ${accentColor}` : '1px solid #e8e8e8',
        borderLeft: `3px solid ${accentColor}`,
        transition: 'border 0.1s',
      }}
    >
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '3px' }}>
        <span style={{ fontSize: '12px', fontWeight: 500, color: '#888' }}>Week {log.week_number}</span>
        <StatusBadge status={log.status} />
      </div>
      <div style={{ fontSize: '13px', fontWeight: 500 }}>{log.student_username}</div>
      <div style={{ fontSize: '12px', color: '#aaa', marginTop: '1px' }}>{log.placement_company}</div>
    </div>
  )
}