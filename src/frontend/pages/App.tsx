import { Routes, Route, Navigate } from 'react-router-dom'
import Layout from '../components/layout/Layout'
import ProtectedRoute from '../components/ProtectedRoute'
import LoginPage from './auth/LoginPage'
import PublicProfilePage from './public/PublicProfilePage'
import NotFoundPage from './NotFoundPage'
import DashboardLayout from './dashboard/DashboardLayout'
import OverviewPage from './dashboard/OverviewPage'
import BuilderPage from './dashboard/BuilderPage'
import AnalyticsPage from './dashboard/AnalyticsPage'
import UsersPage from './dashboard/UsersPage'
import AuditLogsPage from './dashboard/AuditLogsPage'
import { useAuth } from '../hooks/useAuth'

function RootRedirect() {
  const { user, loading } = useAuth()
  if (loading) return <div className="p-8 text-center text-muted-foreground">Loading...</div>
  if (user) return <Navigate to="/dashboard" replace />
  return <Navigate to="/login" replace />
}

function LoginRoute() {
  const { user, loading } = useAuth()
  if (loading) return <div className="p-8 text-center text-muted-foreground">Loading...</div>
  if (user) return <Navigate to="/dashboard" replace />
  return <LoginPage />
}

// RBAC wrappers
function RequireAdmin({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth()
  if (loading) return <div className="p-8 text-center text-muted-foreground">Loading...</div>
  if (!user) return <Navigate to="/login" replace />
  if (user.role !== 'admin' && user.role !== 'super_admin') return <Navigate to="/dashboard" replace />
  return <>{children}</>
}

function RequireSuperAdmin({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth()
  if (loading) return <div className="p-8 text-center text-muted-foreground">Loading...</div>
  if (!user) return <Navigate to="/login" replace />
  if (user.role !== 'super_admin') return <Navigate to="/dashboard" replace />
  return <>{children}</>
}

export default function App() {
  return (
    <Routes>
      {/* Public profile — FULL-BLEED standalone, no app shell (no Header/Footer, no outer frame) */}
      {/* Must be sibling to Layout so it doesn't inherit Layout's container/header/footer */}
      <Route path=":username" element={<PublicProfilePage />} />

      <Route path="/" element={<Layout />}>
        <Route index element={<RootRedirect />} />
        <Route path="login" element={<LoginRoute />} />
        {/* Dashboard routes */}
        <Route
          path="dashboard"
          element={
            <ProtectedRoute>
              <DashboardLayout />
            </ProtectedRoute>
          }
        >
          <Route index element={<OverviewPage />} />
          <Route path="profile" element={<BuilderPage />} />
          <Route path="builder" element={<BuilderPage />} />
          <Route path="links" element={<BuilderPage initialMode="links" />} />
          <Route path="links/:id" element={<BuilderPage initialMode="links" />} />
          <Route path="links/:id/edit" element={<BuilderPage initialMode="links" />} />
          <Route path="analytics" element={<AnalyticsPage />} />
          <Route path="users" element={<RequireAdmin><UsersPage /></RequireAdmin>} />
          <Route path="users/:id" element={<RequireAdmin><UsersPage /></RequireAdmin>} />
          <Route path="audit-logs" element={<RequireSuperAdmin><AuditLogsPage /></RequireSuperAdmin>} />
          <Route path="settings" element={<RequireSuperAdmin><div className="card p-8 text-center"><h2 className="text-xl font-bold">Settings</h2><p className="text-sm text-muted-foreground">System configuration — SUPER_ADMIN only (coming soon)</p></div></RequireSuperAdmin>} />
        </Route>
        <Route path="*" element={<NotFoundPage />} />
      </Route>
    </Routes>
  )
}
