import { Routes, Route } from 'react-router-dom'
import Layout from '../components/layout/Layout'
import ProtectedRoute from '../components/ProtectedRoute'
import HomePage from './HomePage'
import LoginPage from './auth/LoginPage'
import DashboardPage from './dashboard/DashboardPage'
import PublicProfilePage from './public/PublicProfilePage'
import NotFoundPage from './NotFoundPage'

function App() {
  return (
    <Routes>
      <Route path="/" element={<Layout />}>
        <Route index element={<HomePage />} />
        <Route path="login" element={<LoginPage />} />
        <Route path="@:username" element={<PublicProfilePage />} />
        <Route
          path="dashboard/*"
          element={
            <ProtectedRoute>
              <DashboardPage />
            </ProtectedRoute>
          }
        />
        <Route path="*" element={<NotFoundPage />} />
      </Route>
    </Routes>
  )
}

export default App
