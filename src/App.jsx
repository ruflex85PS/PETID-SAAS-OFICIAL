import { Routes, Route, Navigate } from 'react-router-dom'
import TemplatesPage from './pages/TemplatesPage'
import AdminPage from './pages/AdminPage'
import { useAuth } from './context/AuthContext'
import AppLayout from './components/layout/AppLayout'
import AuthLayout from './components/layout/AuthLayout'

// Auth pages
import LoginPage from './pages/LoginPage'
import RegisterPage from './pages/RegisterPage'
import ForgotPasswordPage from './pages/ForgotPasswordPage'
import ResetPasswordPage from './pages/ResetPasswordPage'
import SetupOrganizationPage from './pages/SetupOrganizationPage'

// App pages
import DashboardPage from './pages/DashboardPage'
import CustomersPage from './pages/CustomersPage'
import CustomerDetailPage from './pages/CustomerDetailPage'
import PetsPage from './pages/PetsPage'
import PetDetailPage from './pages/PetDetailPage'
import AppointmentsPage from './pages/AppointmentsPage'
import AutomationsPage from './pages/AutomationsPage'
import AvailableSlotsPage from './pages/AvailableSlotsPage'

function ProtectedRoute({ children }) {
  const { user, loading } = useAuth()
  if (loading) return <LoadingScreen />
  if (!user) return <Navigate to="/login" replace />
  return children
}

function OrgRequiredRoute({ children }) {
  const { user, organization, profile, loading } = useAuth()
  if (loading) return <LoadingScreen />
  if (!user) return <Navigate to="/login" replace />
  if (profile && !organization) return <Navigate to="/setup" replace />
  return children
}

function PublicRoute({ children }) {
  const { user, organization, profile, loading } = useAuth()
  if (loading) return <LoadingScreen />
  if (user && organization) return <Navigate to="/dashboard" replace />
  if (user && profile && !organization) return <Navigate to="/setup" replace />
  return children
}

function LoadingScreen() {
  return (
    <div style={{
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      minHeight: '100vh',
      background: '#F9FAFB'
    }}>
      <div style={{ textAlign: 'center' }}>
        <div className="spinner" style={{ margin: '0 auto 12px', width: 32, height: 32 }} />
        <p style={{ color: '#6B7280', fontSize: '0.9rem' }}>Cargando PETID…</p>
      </div>
    </div>
  )
}

export default function App() {
  return (
    <Routes>
      {/* Public routes */}
      <Route path="/login" element={<PublicRoute><AuthLayout><LoginPage /></AuthLayout></PublicRoute>} />
      <Route path="/register" element={<PublicRoute><AuthLayout><RegisterPage /></AuthLayout></PublicRoute>} />
      <Route path="/forgot-password" element={<PublicRoute><AuthLayout><ForgotPasswordPage /></AuthLayout></PublicRoute>} />
      <Route path="/reset-password" element={<AuthLayout><ResetPasswordPage /></AuthLayout>} />

      {/* Setup (logged in but no org) */}
      <Route path="/setup" element={<ProtectedRoute><SetupOrganizationPage /></ProtectedRoute>} />

      {/* Protected app routes */}
      <Route path="/" element={<OrgRequiredRoute><AppLayout /></OrgRequiredRoute>}>
        <Route index element={<Navigate to="/dashboard" replace />} />
        <Route path="dashboard" element={<DashboardPage />} />
        <Route path="customers" element={<CustomersPage />} />
        <Route path="customers/:id" element={<CustomerDetailPage />} />
        <Route path="pets" element={<PetsPage />} />
        <Route path="pets/:id" element={<PetDetailPage />} />
        <Route path="appointments" element={<AppointmentsPage />} />
        <Route path="automations" element={<AutomationsPage />} />
        <Route path="templates" element={<TemplatesPage />} />
        <Route path="admin" element={<AdminPage />} />
        <Route path="available-slots" element={<AvailableSlotsPage />} />
      </Route>

      <Route path="*" element={<Navigate to="/dashboard" replace />} />
    </Routes>
  )
}
