import { Link } from 'react-router-dom'
import { Home } from 'lucide-react'
import { useAuth } from '../../hooks/useAuth'

const Header = () => {
  const { user } = useAuth()

  const homeTarget = user ? '/dashboard' : '/'
  const homeLink = user ? '/dashboard' : '/'

  return (
    <header className="sticky top-0 z-50 w-full border-b bg-white/95 backdrop-blur">
      <div className="container mx-auto flex h-16 items-center justify-between px-4">
        <div className="flex items-center gap-6">
          <Link to={homeLink} className="flex items-center gap-2 font-bold text-xl">
            <Home className="h-6 w-6" />
            <span className="hidden sm:inline">LW-link</span>
          </Link>
          <nav className="hidden md:flex items-center gap-6">
            <Link to={homeTarget} className="text-sm font-medium hover:text-primary">
              Home
            </Link>
          </nav>
        </div>
        <div className="flex items-center gap-3">
          <span className="hidden sm:inline text-xs text-muted-foreground">Internal</span>
        </div>
      </div>
    </header>
  )
}

export default Header
