import { useState, useEffect } from 'react'
import axios from 'axios'

const GRADE_COLORS = {
  A: '#1D9E75',
  B: '#378ADD',
  C: '#BA7517',
  D: '#D85A30',
  F: '#E24B4A',
}

export default function ScoreCard({ placementId }) {
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    axios.get(`/api/placements/${placementId}/score/`)
      .then(res => setData(res.data))
      .finally(() => setLoading(false))
  }, [placementId])

  if (loading) {
    return <p style={{ color: '#888', fontSize: '14px' }}>Loading score...</p>
  }

  if (!data || !data.computed_score) {
    return (
      <p style={{ color: '#aaa', fontSize: '13px' }}>
        Score not yet available. Evaluations may still be pending.
      </p>
    )
  }

  return (
    <div style={{
      background: '#fafafa',
      border: '1px solid #eee',
      borderRadius: '10px',
      padding: '1.25rem',
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '1rem' }}>
        <span style={{
          fontSize: '48px',
          fontWeight: 500,
          color: GRADE_COLORS[data.letter_grade] || '#888',
          lineHeight: 1,
        }}>
          {data.letter_grade}
        </span>
        <div>
          <div style={{ fontSize: '28px', fontWeight: 500 }}>
            {data.computed_score}
          </div>
          <div style={{ fontSize: '12px', color: '#888' }}>out of 100</div>
        </div>
      </div>

      {data.evaluations.length > 0 && (
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px' }}>
          <thead>
            <tr style={{ borderBottom: '1px solid #eee' }}>
              <th style={{ textAlign: 'left', padding: '4px 0', fontWeight: 500 }}>Criteria</th>
              <th style={{ textAlign: 'right', padding: '4px 0', fontWeight: 500 }}>Score</th>
              <th style={{ textAlign: 'right', padding: '4px 0', fontWeight: 500 }}>Weight</th>
            </tr>
          </thead>
          <tbody>
            {data.evaluations.map(e => (
              <tr key={e.id} style={{ borderBottom: '1px solid #f5f5f5' }}>
                <td style={{ padding: '6px 0' }}>{e.criteria_name}</td>
                <td style={{ textAlign: 'right', padding: '6px 0' }}>{e.score}</td>
                <td style={{ textAlign: 'right', padding: '6px 0', color: '#888' }}>
                  {e.criteria_weight}%
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}

      {data.score_computed_at && (
        <p style={{ fontSize: '11px', color: '#bbb', marginTop: '0.75rem' }}>
          Last computed {new Date(data.score_computed_at).toLocaleString()}
        </p>
      )}
    </div>
  )
}