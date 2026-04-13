import { useState, useEffect } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import axios from 'axios'

export default function PlacementForm() {
  const navigate = useNavigate()

  const [students, setStudents] = useState([])
  const [workplaceSups, setWorkplaceSups] = useState([])
  const [academicSups, setAcademicSups] = useState([])
  const [loadingUsers, setLoadingUsers] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')

  const [form, setForm] = useState({
    student: '',
    workplace_supervisor: '',
    academic_supervisor: '',
    company_name: '',
    start_date: '',
    end_date: '',
  })

  useEffect(() => {
    Promise.all([
      axios.get('/api/users/?role=student'),
      axios.get('/api/users/?role=workplace_supervisor'),
      axios.get('/api/users/?role=academic_supervisor'),
    ])
      .then(([studentsRes, wpRes, acRes]) => {
        setStudents(studentsRes.data)
        setWorkplaceSups(wpRes.data)
        setAcademicSups(acRes.data)
      })
      .catch(() => setError('Could not load users. Make sure you are logged in as admin.'))
      .finally(() => setLoadingUsers(false))
  }, [])

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')

    if (!form.student) { setError('Please select a student.'); return }
    if (!form.company_name.trim()) { setError('Company name is required.'); return }
    if (!form.start_date || !form.end_date) { setError('Both start and end dates are required.'); return }
    if (form.end_date <= form.start_date) { setError('End date must be after start date.'); return }

    setSubmitting(true)
    try {
      await axios.post('/api/placements/', {
        student: parseInt(form.student),
        workplace_supervisor: form.workplace_supervisor ? parseInt(form.workplace_supervisor) : null,
        academic_supervisor: form.academic_supervisor ? parseInt(form.academic_supervisor) : null,
        company_name: form.company_name.trim(),
        start_date: form.start_date,
        end_date: form.end_date,
      })
      navigate('/admin')
    } catch (err) {
      const d = err.response?.data
      setError(
        d?.non_field_errors?.[0] ||
        d?.end_date?.[0] ||
        d?.student?.[0] ||
        d?.detail ||
        'Could not create placement. Please check all fields.'
      )
    } finally {
      setSubmitting(false)
    }
  }

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

  const groupStyle = { marginBottom: '1.25rem' }

  return (
    <div style={{ maxWidth: '960px', margin: '0 auto' }}>

      {/* Header */}
      <div style={{ background: '#2E8B57', padding: '1.5rem 2.5rem', position: 'relative' }}>
        <div style={{ height: '4px', background: '#1a6e3c', position: 'absolute', top: 0, left: 0, right: 0 }} />
        <Link to="/admin" style={{
          color: 'rgba(255,255,255,0.65)', fontSize: '12px',
          textDecoration: 'none', letterSpacing: '0.04em',
        }}>
          ← Back to dashboard
        </Link>
        <h2 style={{ color: '#fff', margin: '4px 0 2px', fontSize: '20px', fontWeight: 600 }}>
          Create placement
        </h2>
        <p style={{ color: 'rgba(255,255,255,0.65)', fontSize: '13px', margin: 0 }}>
          Assign a student to an internship and link their supervisors
        </p>
        <div style={{ height: '3px', background: '#1a6e3c', position: 'absolute', bottom: 0, left: 0, right: 0 }} />
      </div>

      <div style={{ padding: '1.5rem 2rem' }}>
        <div style={{
          background: '#fff', border: '1px solid #e0e0e0',
          borderRadius: '12px', padding: '2rem', maxWidth: '620px',
        }}>

          {/* Loading */}
          {loadingUsers && (
            <div style={{
              display: 'flex', alignItems: 'center',
              justifyContent: 'center', padding: '2rem', gap: '12px',
              color: '#888', fontSize: '14px',
            }}>
              <div style={{
                width: '20px', height: '20px',
                border: '2px solid #f0f0f0',
                borderTop: '2px solid #2E8B57',
                borderRadius: '50%',
                animation: 'spin 0.8s linear infinite',
              }} />
              Loading users...
              <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
            </div>
          )}

          {/* Error */}
          {error && (
            <div style={{
              background: '#FFEBEE', color: '#C62828',
              padding: '10px 14px', borderRadius: '6px',
              fontSize: '13px', marginBottom: '1.25rem',
              borderLeft: '3px solid #E8352A',
            }}>
              {error}
            </div>
          )}

          {/* Debug info */}
          {!loadingUsers && (
            <div style={{
              background: '#E8F5E9', border: '1px solid #c8e6c9',
              borderRadius: '6px', padding: '8px 12px',
              fontSize: '12px', color: '#2E7D32', marginBottom: '1.25rem',
            }}>
              Found: {students.length} student(s) · {workplaceSups.length} workplace supervisor(s) · {academicSups.length} academic supervisor(s)
            </div>
          )}

          {!loadingUsers && (
            <form onSubmit={handleSubmit}>

              {/* Student */}
              <div style={groupStyle}>
                <label style={labelStyle}>
                  Student <span style={{ color: '#E8352A' }}>*</span>
                </label>
                <select
                  value={form.student}
                  onChange={e => setForm({ ...form, student: e.target.value })}
                  required style={inputStyle}
                >
                  <option value="">
                    {students.length === 0 ? 'No students registered yet' : 'Select student'}
                  </option>
                  {students.map(s => (
                    <option key={s.id} value={s.id}>{s.username} — {s.email}</option>
                  ))}
                </select>
                {students.length === 0 && (
                  <p style={{ fontSize: '12px', color: '#E8352A', marginTop: '4px' }}>
                    No students found. Ask students to register with the Student role first.
                  </p>
                )}
              </div>

              {/* Company */}
              <div style={groupStyle}>
                <label style={labelStyle}>
                  Company / Organisation name <span style={{ color: '#E8352A' }}>*</span>
                </label>
                <input
                  type="text"
                  value={form.company_name}
                  onChange={e => setForm({ ...form, company_name: e.target.value })}
                  required
                  placeholder="e.g. Stanbic Bank Uganda"
                  style={inputStyle}
                />
              </div>

              {/* Dates */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1.25rem' }}>
                <div>
                  <label style={labelStyle}>
                    Start date <span style={{ color: '#E8352A' }}>*</span>
                  </label>
                  <input
                    type="date"
                    value={form.start_date}
                    onChange={e => setForm({ ...form, start_date: e.target.value })}
                    required style={inputStyle}
                  />
                </div>
                <div>
                  <label style={labelStyle}>
                    End date <span style={{ color: '#E8352A' }}>*</span>
                  </label>
                  <input
                    type="date"
                    value={form.end_date}
                    onChange={e => setForm({ ...form, end_date: e.target.value })}
                    required
                    min={form.start_date}
                    style={{
                      ...inputStyle,
                      borderColor: form.start_date && form.end_date && form.end_date <= form.start_date ? '#E8352A' : '#ccc',
                    }}
                  />
                  {form.start_date && form.end_date && form.end_date <= form.start_date && (
                    <p style={{ fontSize: '12px', color: '#E8352A', marginTop: '4px' }}>
                      End date must be after start date
                    </p>
                  )}
                </div>
              </div>

              {/* Workplace supervisor */}
              <div style={groupStyle}>
                <label style={labelStyle}>
                  Workplace supervisor{' '}
                  <span style={{ color: '#aaa', fontWeight: 400, fontSize: '12px' }}>(optional)</span>
                </label>
                <select
                  value={form.workplace_supervisor}
                  onChange={e => setForm({ ...form, workplace_supervisor: e.target.value })}
                  style={inputStyle}
                >
                  <option value="">
                    {workplaceSups.length === 0 ? 'No workplace supervisors registered yet' : 'Select workplace supervisor'}
                  </option>
                  {workplaceSups.map(s => (
                    <option key={s.id} value={s.id}>{s.username} — {s.email}</option>
                  ))}
                </select>
              </div>

              {/* Academic supervisor */}
              <div style={groupStyle}>
                <label style={labelStyle}>
                  Academic supervisor{' '}
                  <span style={{ color: '#aaa', fontWeight: 400, fontSize: '12px' }}>(optional)</span>
                </label>
                <select
                  value={form.academic_supervisor}
                  onChange={e => setForm({ ...form, academic_supervisor: e.target.value })}
                  style={inputStyle}
                >
                  <option value="">
                    {academicSups.length === 0 ? 'No academic supervisors registered yet' : 'Select academic supervisor'}
                  </option>
                  {academicSups.map(s => (
                    <option key={s.id} value={s.id}>{s.username} — {s.email}</option>
                  ))}
                </select>
              </div>

              {/* Actions */}
              <div style={{
                display: 'flex', gap: '10px',
                marginTop: '1.5rem', paddingTop: '1.5rem',
                borderTop: '1px solid #f0f0f0',
              }}>
                <button
                  type="submit"
                  disabled={submitting || students.length === 0}
                  style={{
                    padding: '10px 24px',
                    background: submitting || students.length === 0 ? '#aaa' : '#2E8B57',
                    color: '#fff', border: 'none', borderRadius: '6px',
                    fontSize: '14px', fontWeight: 600,
                    cursor: submitting || students.length === 0 ? 'default' : 'pointer',
                  }}
                >
                  {submitting ? 'Creating...' : 'Create placement'}
                </button>
                <Link to="/admin" style={{
                  padding: '10px 24px', background: 'transparent',
                  color: '#555', border: '1px solid #ccc', borderRadius: '6px',
                  fontSize: '14px', textDecoration: 'none',
                  display: 'inline-flex', alignItems: 'center',
                }}>
                  Cancel
                </Link>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  )
}