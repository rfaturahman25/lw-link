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

  return (
    <div className="max-w-md mx-auto space-y-6">
      <div className="text-center space-y-2">
        <div className="inline-flex h-12 w-12 items-center justify-center rounded-lg bg-primary/10 text-primary">
          <LogIn className="h-6 w-6" />
        </div>
        <h1 className="text-3xl font-bold">Sign In</h1>
        <p className="text-muted-foreground">LW-link — internal</p>
      </div>

      <div className="card p-6 space-y-4">

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
                placeholder="username atau email"
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
