import { Link, useNavigate } from 'react-router-dom'
import { Home, User, LogIn, LogOut, Shield } from 'lucide-react'
import { useAuth } from '../../hooks/useAuth'

const Header = () => {
  const navigate = useNavigate()
  const { user, logout } = useAuth()

  const handleLogout = async () => {
    await logout()
    navigate('/')
  }

  return (
    <header className="sticky top-0 z-50 w-full border-b bg-white/95 backdrop-blur">
      <div className="container mx-auto flex h-16 items-center justify-between px-4">
        <div className="flex items-center gap-6">
          <Link to="/" className="flex items-center gap-2 font-bold text-xl">
            <Home className="h-6 w-6" />
            <span className="hidden sm:inline">LW-link</span>
          </Link>
          <nav className="hidden md:flex items-center gap-6">
            <Link to="/" className="text-sm font-medium hover:text-primary">
              Home
            </Link>
          </nav>
        </div>
        <div className="flex items-center gap-3">
          {user ? (
            <>
              <span className="hidden sm:inline text-sm text-muted-foreground">@{user.username}</span>
              <Link to="/dashboard" className="inline-flex items-center gap-2 rounded-md px-4 py-2 text-sm font-medium bg-primary text-white hover:bg-primary/90">
                <User className="h-4 w-4" /> Dashboard
              </Link>
              {user.role === 'admin' && (
                <Link to="/dashboard?admin=1" className="hidden sm:inline-flex items-center gap-1 rounded-md border px-3 py-2 text-sm">
                  <Shield className="h-4 w-4" /> Admin
                </Link>
              )}
              <button onClick={handleLogout} className="inline-flex items-center gap-2 rounded-md px-3 py-2 text-sm border hover:bg-accent">
                <LogOut className="h-4 w-4" /> Logout
              </button>
            </>
          ) : (
            <Link to="/login" className="inline-flex items-center gap-2 rounded-md px-4 py-2 text-sm font-medium bg-primary text-white hover:bg-primary/90">
              <LogIn className="h-4 w-4" /> Login
            </Link>
          )}
        </div>
      </div>
    </header>
  )
}

export default Header
