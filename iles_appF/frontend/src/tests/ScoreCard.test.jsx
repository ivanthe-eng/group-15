import { render, screen, waitFor } from '@testing-library/react'
import { vi } from 'vitest'
import axios from 'axios'
import ScoreCard from './components/ScoreCard'

vi.mock('axios')

describe('ScoreCard', () => {

  test('shows loading state initially', () => {
    axios.get.mockReturnValue(new Promise(() => {})) // never resolves
    render(<ScoreCard placementId={1} />)
    expect(screen.getByText('Loading score...')).toBeInTheDocument()
  })

  test('renders grade and score when data loads', async () => {
    axios.get.mockResolvedValue({
      data: {
        placement_id: 1,
        student: 'alice',
        company: 'Test Company',
        computed_score: '79.50',
        letter_grade: 'B',
        score_computed_at: '2026-01-15T10:00:00Z',
        evaluations: [
          {
            id: 1,
            criteria_name: 'Workplace performance',
            criteria_weight: '40.00',
            score: '80.00',
          },
          {
            id: 2,
            criteria_name: 'Academic assessment',
            criteria_weight: '30.00',
            score: '75.00',
          },
          {
            id: 3,
            criteria_name: 'Logbook quality',
            criteria_weight: '30.00',
            score: '82.00',
          },
        ],
      },
    })

    render(<ScoreCard placementId={1} />)

    expect(await screen.findByText('B')).toBeInTheDocument()
    expect(await screen.findByText('79.50')).toBeInTheDocument()
    expect(await screen.findByText('Workplace performance')).toBeInTheDocument()
    expect(await screen.findByText('Academic assessment')).toBeInTheDocument()
    expect(await screen.findByText('Logbook quality')).toBeInTheDocument()
  })

  test('shows message when no score computed yet', async () => {
    axios.get.mockResolvedValue({
      data: {
        placement_id: 1,
        student: 'bob',
        company: 'Test Co',
        computed_score: null,
        letter_grade: '',
        score_computed_at: null,
        evaluations: [],
      },
    })

    render(<ScoreCard placementId={1} />)

    expect(
      await screen.findByText(/score not yet available/i)
    ).toBeInTheDocument()
  })

  test('renders correct grade color for A', async () => {
    axios.get.mockResolvedValue({
      data: {
        placement_id: 1,
        student: 'charlie',
        company: 'Top Co',
        computed_score: '92.00',
        letter_grade: 'A',
        score_computed_at: '2026-01-20T08:00:00Z',
        evaluations: [],
      },
    })

    render(<ScoreCard placementId={1} />)

    const grade = await screen.findByText('A')
    expect(grade).toBeInTheDocument()
    expect(grade).toHaveStyle({ color: '#1D9E75' })
  })

  test('renders all evaluation rows in the table', async () => {
    axios.get.mockResolvedValue({
      data: {
        placement_id: 1,
        student: 'diana',
        company: 'Dev Corp',
        computed_score: '85.00',
        letter_grade: 'A',
        score_computed_at: '2026-02-01T12:00:00Z',
        evaluations: [
          { id: 1, criteria_name: 'Workplace performance', criteria_weight: '40.00', score: '88.00' },
          { id: 2, criteria_name: 'Academic assessment',   criteria_weight: '30.00', score: '80.00' },
          { id: 3, criteria_name: 'Logbook quality',       criteria_weight: '30.00', score: '87.00' },
        ],
      },
    })

    render(<ScoreCard placementId={1} />)

    await waitFor(() => {
      expect(screen.getByText('Workplace performance')).toBeInTheDocument()
      expect(screen.getByText('Academic assessment')).toBeInTheDocument()
      expect(screen.getByText('Logbook quality')).toBeInTheDocument()
      expect(screen.getByText('40.00%')).toBeInTheDocument()
      expect(screen.getByText('30.00%')).toBeInTheDocument()
    })
  })

  test('calls the correct API endpoint with placement id', async () => {
    axios.get.mockResolvedValue({
      data: {
        placement_id: 42,
        student: 'eve',
        company: 'Tech Ltd',
        computed_score: '70.00',
        letter_grade: 'B',
        score_computed_at: '2026-03-01T09:00:00Z',
        evaluations: [],
      },
    })

    render(<ScoreCard placementId={42} />)

    await waitFor(() => {
      expect(axios.get).toHaveBeenCalledWith('/api/placements/42/score/')
    })
  })
})