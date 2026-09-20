import { Link } from 'react-router-dom'
import { Link2 } from 'lucide-react'
import { useAuth } from '../../hooks/useAuth'

const Header = () => {
  const { user } = useAuth()
  const homeTarget = user ? '/dashboard' : '/'

  return (
    <header className="sticky top-0 z-50 w-full border-b border-border/60 bg-background/80 backdrop-blur-md">
      <div className="container mx-auto flex h-14 items-center justify-between px-4">
        <Link to={homeTarget} className="flex items-center gap-2.5">
          <span className="inline-flex h-8 w-8 items-center justify-center rounded-xl bg-primary text-primary-foreground shadow-sm">
            <Link2 className="h-4 w-4" />
          </span>
          <span className="text-[15px] font-semibold tracking-tight">Lensa Links</span>
        </Link>
        <nav className="flex items-center gap-5">
          <Link
            to={homeTarget}
            className="text-sm font-medium text-muted-foreground transition-colors hover:text-foreground"
          >
            {user ? 'Dashboard' : 'Login'}
          </Link>
        </nav>
      </div>
    </header>
  )
}

export default Header
