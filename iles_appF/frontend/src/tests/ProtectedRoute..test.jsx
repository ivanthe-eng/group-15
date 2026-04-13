import { render, screen } from '@testing-library/react'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import { vi } from 'vitest'
import { AuthContext } from '../context/AuthContext'
import ProtectedRoute from '../components/ProtectedRoute'

// Helper — wraps ProtectedRoute with a fake AuthContext and router
const renderWithAuth = (user, loading = false, initialPath = '/protected') => {
  render(
    <AuthContext.Provider value={{ user, loading, login: vi.fn(), logout: vi.fn() }}>
      <MemoryRouter initialEntries={[initialPath]}>
        <Routes>
          <Route path="/login"        element={<div>Login page</div>} />
          <Route path="/unauthorized" element={<div>Unauthorized page</div>} />
          <Route path="/protected"    element={
            <ProtectedRoute allowedRoles={['admin']}>
              <div>Protected content</div>
            </ProtectedRoute>
          } />
          <Route path="/multi"        element={
            <ProtectedRoute allowedRoles={['student', 'workplace_supervisor']}>
              <div>Multi-role content</div>
            </ProtectedRoute>
          } />
          <Route path="/open"         element={
            <ProtectedRoute>
              <div>Open protected content</div>
            </ProtectedRoute>
          } />
        </Routes>
      </MemoryRouter>
    </AuthContext.Provider>
  )
}

describe('ProtectedRoute', () => {

  test('shows loading indicator while auth state is resolving', () => {
    renderWithAuth(null, true)
    expect(screen.getByText('Loading...')).toBeInTheDocument()
  })

  test('redirects to /login when user is not authenticated', () => {
    renderWithAuth(null, false)
    expect(screen.getByText('Login page')).toBeInTheDocument()
  })

  test('redirects to /unauthorized when user has wrong role', () => {
    renderWithAuth({ role: 'student' }, false)
    expect(screen.getByText('Unauthorized page')).toBeInTheDocument()
  })

  test('renders children when user has the correct role', () => {
    renderWithAuth({ role: 'admin' }, false)
    expect(screen.getByText('Protected content')).toBeInTheDocument()
  })

  test('renders children when user role is in a list of allowed roles', () => {
    render(
      <AuthContext.Provider value={{
        user: { role: 'workplace_supervisor' },
        loading: false,
        login: vi.fn(),
        logout: vi.fn(),
      }}>
        <MemoryRouter initialEntries={['/multi']}>
          <Routes>
            <Route path="/unauthorized" element={<div>Unauthorized page</div>} />
            <Route path="/multi" element={
              <ProtectedRoute allowedRoles={['student', 'workplace_supervisor']}>
                <div>Multi-role content</div>
              </ProtectedRoute>
            } />
          </Routes>
        </MemoryRouter>
      </AuthContext.Provider>
    )
    expect(screen.getByText('Multi-role content')).toBeInTheDocument()
  })

  test('renders children when no allowedRoles specified — any authenticated user passes', () => {
    render(
      <AuthContext.Provider value={{
        user: { role: 'student' },
        loading: false,
        login: vi.fn(),
        logout: vi.fn(),
      }}>
        <MemoryRouter initialEntries={['/open']}>
          <Routes>
            <Route path="/login" element={<div>Login page</div>} />
            <Route path="/open"  element={
              <ProtectedRoute>
                <div>Open protected content</div>
              </ProtectedRoute>
            } />
          </Routes>
        </MemoryRouter>
      </AuthContext.Provider>
    )
    expect(screen.getByText('Open protected content')).toBeInTheDocument()
  })

  test('academic_supervisor is redirected from admin-only route', () => {
    renderWithAuth({ role: 'academic_supervisor' }, false)
    expect(screen.getByText('Unauthorized page')).toBeInTheDocument()
  })
})