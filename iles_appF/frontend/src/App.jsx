import { Routes, Route, Navigate } from 'react-router-dom'
import { useAuth } from './context/AuthContext'
import Navbar from './components/Navbar'
import ProtectedRoute from './components/ProtectedRoute'
import LoginPage from './pages/LoginPage'
import StudentDashboard from './pages/student/StudentDashboard'
import Logbook from './pages/student/Logbook'
import ReviewDashboard from './pages/supervisor/ReviewDashboard'
import AdminDashboard from './pages/admin/AdminDashboard'
import PlacementForm from './pages/admin/PlacementForm'
import './App.css'

function RoleRedirect() {
  const { user } = useAuth()
  if (!user) return <Navigate to="/login" replace />
  const map = {
    student: '/student',
    workplace_supervisor: '/supervisor',
    academic_supervisor: '/supervisor',
    admin: '/admin',
  }
  return <Navigate to={map[user.role] || '/login'} replace />
}

export default function App() {
  return (
    <>
      <Navbar />
      <Routes>

        {/* Public */}
        <Route path="/login" element={<LoginPage />} />

        {/* Catch unauthorized */}
        <Route path="/unauthorized" element={
          <div style={{ padding: '3rem', textAlign: 'center' }}>
            <h2>Access denied</h2>
            <p style={{ color: '#888', marginTop: '8px', fontSize: '14px' }}>
              You do not have permission to view this page.
            </p>
          </div>
        } />

        {/* Root redirect based on role */}
        <Route path="/" element={<RoleRedirect />} />

        {/* Student routes */}
        <Route path="/student" element={
          <ProtectedRoute allowedRoles={['student']}>
            <StudentDashboard />
          </ProtectedRoute>
        } />
        <Route path="/student/logbook" element={
          <ProtectedRoute allowedRoles={['student']}>
            <Logbook />
          </ProtectedRoute>
        } />

        {/* Supervisor routes */}
        <Route path="/supervisor" element={
          <ProtectedRoute allowedRoles={['workplace_supervisor', 'academic_supervisor']}>
            <ReviewDashboard />
          </ProtectedRoute>
        } />

        {/* Admin routes */}
        <Route path="/admin" element={
          <ProtectedRoute allowedRoles={['admin']}>
            <AdminDashboard />
          </ProtectedRoute>
        } />
        <Route path="/admin/placements/new" element={
          <ProtectedRoute allowedRoles={['admin']}>
            <PlacementForm />
          </ProtectedRoute>
        } />

        {/* Catch all — redirect unknown URLs to home */}
        <Route path="*" element={<Navigate to="/" replace />} />

      </Routes>
    </>
  )
}