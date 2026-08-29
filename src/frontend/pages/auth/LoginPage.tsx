import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { User, Lock, LogIn, AlertCircle } from 'lucide-react'
import { useAuth } from '../../hooks/useAuth'

const LoginPage = () => {
  const navigate = useNavigate()
  const { login } = useAuth()
  const [identifier, setIdentifier] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      await login(identifier.trim(), password)
      navigate('/dashboard')
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Login failed'
      setError(msg)
    } finally {
      setLoading(false)
    }
  }

  const quickLogin = async (id: string, pw: string) => {
    setIdentifier(id)
    setPassword(pw)
    setError('')
    setLoading(true)
    try {
      await login(id, pw)
      navigate('/dashboard')
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Login failed')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="max-w-md mx-auto space-y-6">
      <div className="text-center space-y-2">
        <div className="inline-flex h-12 w-12 items-center justify-center rounded-lg bg-primary/10 text-primary">
          <LogIn className="h-6 w-6" />
        </div>
        <h1 className="text-3xl font-bold">Welcome Back</h1>
        <p className="text-muted-foreground">Internal — login pakai username & password</p>
      </div>

      <div className="card p-6 space-y-4">
        <div className="space-y-2">
          <p className="text-sm text-center text-muted-foreground">Quick login (dev)</p>
          <div className="grid grid-cols-2 gap-2">
            <button onClick={() => quickLogin('rizki', 'rizki123')} className="rounded-md bg-primary/10 px-3 py-2 text-sm text-primary hover:bg-primary/20">
              rizki / rizki123
            </button>
            <button onClick={() => quickLogin('admin', 'admin123')} className="rounded-md bg-secondary/10 px-3 py-2 text-sm hover:bg-secondary/20">
              admin / admin123
            </button>
          </div>
          <p className="text-xs text-center text-muted-foreground">atau pakai email: rizki@example.local / admin@example.local</p>
        </div>

        <div className="relative py-2">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t" />
          </div>
          <div className="relative flex justify-center text-xs uppercase">
            <span className="bg-white px-2 text-muted-foreground">Username + Password</span>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {error && (
            <div className="rounded-lg bg-red-50 border border-red-200 p-3 flex gap-2 text-sm text-red-700">
              <AlertCircle className="h-5 w-5 flex-shrink-0" /> {error}
            </div>
          )}
          <div className="space-y-1">
            <label htmlFor="identifier" className="text-sm font-medium">
              Username or Email
            </label>
            <div className="relative">
              <User className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <input
                id="identifier"
                type="text"
                value={identifier}
                onChange={(e) => setIdentifier(e.target.value)}
                placeholder="rizki atau rizki@example.local"
                className="input pl-10"
                required
              />
            </div>
          </div>
          <div className="space-y-1">
            <label htmlFor="password" className="text-sm font-medium">
              Password
            </label>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="input pl-10"
                required
              />
            </div>
          </div>
          <button type="submit" disabled={loading} className="w-full inline-flex items-center justify-center rounded-md bg-primary px-4 py-3 text-sm font-medium text-primary-foreground hover:bg-primary/90 disabled:opacity-50 shadow">
            {loading ? 'Signing in...' : 'Sign In'}
          </button>
        </form>
        <p className="text-center text-sm text-muted-foreground">
          Don&apos;t have account? <Link to="/" className="text-primary hover:underline">Contact admin</Link>
        </p>
      </div>
    </div>
  )
}

export default LoginPage
