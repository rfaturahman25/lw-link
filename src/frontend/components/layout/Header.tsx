import { Link, useNavigate } from 'react-router-dom'
import { Home, User, LogIn, LogOut, Shield, Crown } from 'lucide-react'
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
              <span className="hidden sm:inline-flex items-center gap-1.5 text-sm text-muted-foreground">
                @{user.username}
                <span className={`inline-flex items-center gap-1 rounded-full border px-1.5 py-0.5 text-[10px] font-bold ${user.role === 'super_admin' ? 'bg-purple-100 text-purple-700 border-purple-200' : user.role === 'admin' ? 'bg-blue-100 text-blue-700 border-blue-200' : 'bg-gray-100 text-gray-700'}`}>
                  {user.role === 'super_admin' ? <Crown className="h-3 w-3" /> : user.role === 'admin' ? <Shield className="h-3 w-3" /> : null}
                  {user.role === 'super_admin' ? 'SUPER' : user.role.toUpperCase()}
                </span>
              </span>
              <Link to="/dashboard" className="inline-flex items-center gap-2 rounded-md px-4 py-2 text-sm font-medium bg-primary text-white hover:bg-primary/90">
                <User className="h-4 w-4" /> Dashboard
              </Link>
              {(user.role === 'admin' || user.role === 'super_admin') && (
                <Link to="/dashboard" className="hidden sm:inline-flex items-center gap-1 rounded-md border px-3 py-2 text-sm hover:bg-accent">
                  <Shield className="h-4 w-4" /> Users
                </Link>
              )}
              {user.role === 'super_admin' && (
                <Link to="/dashboard" className="hidden sm:inline-flex items-center gap-1 rounded-md border px-3 py-2 text-sm hover:bg-accent">
                  <Crown className="h-4 w-4" /> Audit
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
