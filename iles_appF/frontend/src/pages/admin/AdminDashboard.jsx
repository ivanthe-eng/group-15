import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import axios from 'axios'
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell,
} from 'recharts'

const GRADE_COLORS = {
  A: '#2E8B57', B: '#378ADD', C: '#BA7517', D: '#D85A30', F: '#E8352A',
}
const STATUS_COLORS = {
  draft: '#888780', submitted: '#378ADD', reviewed: '#BA7517', approved: '#2E8B57',
}

export default function AdminDashboard() {
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    axios.get('/api/dashboard/admin/')
      .then(res => setData(res.data))
      .finally(() => setLoading(false))
  }, [])

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
        <p style={{ color: '#888', fontSize: '14px' }}>Loading dashboard...</p>
        <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
      </div>
    )
  }

  if (!data) return null

  const { totals, log_status_breakdown, grade_distribution, avg_score_by_company, supervisor_queue } = data

  return (
    <div style={{ maxWidth: '960px', margin: '0 auto' }}>

      {/* Header */}
      <div style={{ background: '#2E8B57', padding: '1.5rem 2.5rem', position: 'relative' }}>
        <div style={{ height: '4px', background: '#1a6e3c', position: 'absolute', top: 0, left: 0, right: 0 }} />
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <p style={{ color: 'rgba(255,255,255,0.65)', fontSize: '11px', margin: '0 0 4px', letterSpacing: '0.08em', textTransform: 'uppercase' }}>
              Makerere University · ILES
            </p>
            <h2 style={{ color: '#fff', margin: '0 0 2px', fontSize: '20px', fontWeight: 600 }}>
              Institution overview
            </h2>
            <p style={{ color: 'rgba(255,255,255,0.65)', fontSize: '13px', margin: 0 }}>
              College of Computing &amp; Information Sciences
            </p>
          </div>
          <Link to="/admin/placements/new" style={{
            padding: '9px 20px',
            background: '#fff',
            color: '#2E8B57',
            borderRadius: '6px',
            textDecoration: 'none',
            fontSize: '14px',
            fontWeight: 700,
          }}>
            + New placement
          </Link>
        </div>
        <div style={{ height: '3px', background: '#1a6e3c', position: 'absolute', bottom: 0, left: 0, right: 0 }} />
      </div>

      <div style={{ padding: '1.5rem 2rem' }}>

        {/* Stat cards */}
        <div style={{
          display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)',
          gap: '1rem', marginBottom: '1.5rem',
        }}>
          {[
            { label: 'Students',   value: totals.students,   bg: '#E8F5E9', color: '#2E8B57' },
            { label: 'Placements', value: totals.placements, bg: '#E6F1FB', color: '#185FA5' },
            { label: 'Total logs', value: totals.logs,       bg: '#FAEEDA', color: '#854F0B' },
          ].map(s => (
            <div key={s.label} style={{
              background: s.bg, borderRadius: '10px',
              padding: '1.5rem', textAlign: 'center',
              border: '1px solid #e0e0e0',
            }}>
              <div style={{ fontSize: '40px', fontWeight: 700, color: s.color }}>{s.value}</div>
              <div style={{ color: '#555', fontSize: '14px', marginTop: '4px' }}>{s.label}</div>
            </div>
          ))}
        </div>

        {/* Charts */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem', marginBottom: '1.5rem' }}>

          <div style={{ background: '#fff', border: '1px solid #e0e0e0', borderRadius: '10px', padding: '1.25rem' }}>
            <h4 style={{ margin: '0 0 1rem', fontSize: '14px', fontWeight: 500, color: '#333' }}>
              Logs by status
            </h4>
            {log_status_breakdown.length === 0 ? (
              <div style={{ height: '180px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <p style={{ color: '#bbb', fontSize: '13px' }}>No logs yet</p>
              </div>
            ) : (
              <ResponsiveContainer width="100%" height={200}>
                <PieChart>
                  <Pie
                    data={log_status_breakdown}
                    dataKey="count" nameKey="status"
                    cx="50%" cy="50%" outerRadius={75}
                    label={({ status, count }) => `${status} (${count})`}
                    labelLine={false}
                  >
                    {log_status_breakdown.map(e => (
                      <Cell key={e.status} fill={STATUS_COLORS[e.status] || '#ccc'} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            )}
          </div>

          <div style={{ background: '#fff', border: '1px solid #e0e0e0', borderRadius: '10px', padding: '1.25rem' }}>
            <h4 style={{ margin: '0 0 1rem', fontSize: '14px', fontWeight: 500, color: '#333' }}>
              Grade distribution
            </h4>
            {grade_distribution.length === 0 ? (
              <div style={{ height: '180px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <p style={{ color: '#bbb', fontSize: '13px' }}>No grades computed yet</p>
              </div>
            ) : (
              <ResponsiveContainer width="100%" height={200}>
                <BarChart data={grade_distribution} barSize={44}>
                  <XAxis dataKey="letter_grade" tick={{ fontSize: 13 }} />
                  <YAxis allowDecimals={false} tick={{ fontSize: 12 }} />
                  <Tooltip />
                  <Bar dataKey="count" radius={[4, 4, 0, 0]}>
                    {grade_distribution.map(e => (
                      <Cell key={e.letter_grade} fill={GRADE_COLORS[e.letter_grade] || '#ccc'} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>

        {/* Avg score by company */}
        <div style={{ background: '#fff', border: '1px solid #e0e0e0', borderRadius: '10px', padding: '1.25rem', marginBottom: '1.5rem' }}>
          <h4 style={{ margin: '0 0 1rem', fontSize: '14px', fontWeight: 500, color: '#333' }}>
            Average score by company (top 10)
          </h4>
          {avg_score_by_company.length === 0 ? (
            <div style={{ height: '60px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <p style={{ color: '#bbb', fontSize: '13px' }}>No scores computed yet</p>
            </div>
          ) : (
            <ResponsiveContainer width="100%" height={Math.max(160, avg_score_by_company.length * 36)}>
              <BarChart data={avg_score_by_company} layout="vertical" barSize={18}>
                <XAxis type="number" domain={[0, 100]} tick={{ fontSize: 12 }} />
                <YAxis type="category" dataKey="company_name" width={160} tick={{ fontSize: 12 }} />
                <Tooltip formatter={v => parseFloat(v).toFixed(1)} />
                <Bar dataKey="avg_score" fill="#2E8B57" radius={[0, 4, 4, 0]} />
              </BarChart>
            </ResponsiveContainer>
          )}
        </div>

        {/* Supervisor queue */}
        {supervisor_queue.length > 0 && (
          <div style={{ background: '#fff', border: '1px solid #e0e0e0', borderRadius: '10px', padding: '1.25rem', marginBottom: '1.5rem' }}>
            <h4 style={{ margin: '0 0 1rem', fontSize: '14px', fontWeight: 500, color: '#333' }}>
              Supervisors with pending reviews
            </h4>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '14px' }}>
              <thead>
                <tr style={{ borderBottom: '1px solid #eee' }}>
                  <th style={{ textAlign: 'left', padding: '8px 0', fontWeight: 500 }}>Supervisor</th>
                  <th style={{ textAlign: 'right', padding: '8px 0', fontWeight: 500 }}>Pending</th>
                </tr>
              </thead>
              <tbody>
                {supervisor_queue.map(s => (
                  <tr key={s.supervisor} style={{ borderBottom: '1px solid #f5f5f5' }}>
                    <td style={{ padding: '10px 0' }}>{s.supervisor}</td>
                    <td style={{ padding: '10px 0', textAlign: 'right' }}>
                      <span style={{
                        background: '#FFEBEE', color: '#E8352A',
                        borderRadius: '99px', padding: '2px 10px',
                        fontSize: '12px', fontWeight: 600,
                      }}>
                        {s.pending}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Empty state */}
        {totals.students === 0 && totals.placements === 0 && (
          <div style={{
            background: '#fff', border: '2px dashed #c8e6c9',
            borderRadius: '10px', padding: '2.5rem', textAlign: 'center',
          }}>
            <p style={{ color: '#2E8B57', fontWeight: 500, marginBottom: '8px' }}>
              No data yet
            </p>
            <p style={{ color: '#888', fontSize: '14px', marginBottom: '1.25rem' }}>
              Start by creating a placement for a student.
            </p>
            <Link to="/admin/placements/new" style={{
              padding: '9px 22px', background: '#2E8B57', color: '#fff',
              borderRadius: '6px', textDecoration: 'none',
              fontSize: '14px', fontWeight: 600,
            }}>
              + New placement
            </Link>
          </div>
        )}

      </div>

      {/* Footer */}
      <div style={{
        background: '#2C2C2C', padding: '1rem 2rem',
        display: 'flex', justifyContent: 'space-between',
        alignItems: 'center', flexWrap: 'wrap', gap: '8px',
      }}>
        <span style={{ fontSize: '12px', color: 'rgba(255,255,255,0.5)' }}>
          Copyright © 2026 · Makerere University | ILES
        </span>
        <span style={{ fontSize: '12px', color: 'rgba(255,255,255,0.35)' }}>
          E-mail: iles@cit.ac.ug
        </span>
      </div>
    </div>
  )
}