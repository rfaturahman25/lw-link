import { Routes, Route, Navigate } from 'react-router-dom'
import Layout from '../components/layout/Layout'
import PublicLayout from '../components/layout/PublicLayout'
import ProtectedRoute from '../components/ProtectedRoute'
import LoginPage from './auth/LoginPage'
import PublicProfilePage from './public/PublicProfilePage'
import NotFoundPage from './NotFoundPage'
import DashboardLayout from './dashboard/DashboardLayout'
import OverviewPage from './dashboard/OverviewPage'
import ProfilePage from './dashboard/ProfilePage'
import LinksPage from './dashboard/LinksPage'
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
      <Route path="/" element={<Layout />}>
        <Route index element={<RootRedirect />} />
        <Route path="login" element={<LoginRoute />} />
        {/* Public profile - separate layout without header/footer */}
        <Route path="" element={<PublicLayout />}>
          <Route path=":username" element={<PublicProfilePage />} />
        </Route>
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
          <Route path="profile" element={<ProfilePage />} />
          <Route path="links" element={<LinksPage />} />
          <Route path="links/:id" element={<LinksPage />} />
          <Route path="links/:id/edit" element={<LinksPage />} />
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
