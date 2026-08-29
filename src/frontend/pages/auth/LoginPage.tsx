import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { Mail, LogIn, AlertCircle } from 'lucide-react'
import { useAuth } from '../../hooks/useAuth'

const LoginPage = () => {
  const navigate = useNavigate()
  const { login } = useAuth()
  const [email, setEmail] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      await login(email)
      navigate('/dashboard')
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Login failed'
      setError(msg)
    } finally {
      setLoading(false)
    }
  }

  const quickLogin = async (addr: string) => {
    setEmail(addr)
    setError('')
    setLoading(true)
    try {
      await login(addr)
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
        <p className="text-muted-foreground">Internal platform — use @example.local in dev</p>
      </div>

      <div className="card p-6 space-y-4">
        <div className="space-y-2">
          <p className="text-sm text-center text-muted-foreground">Development quick login</p>
          <div className="flex gap-2">
            <button onClick={() => quickLogin('rizki@example.local')} className="flex-1 rounded-md bg-primary/10 px-3 py-2 text-sm text-primary hover:bg-primary/20">
              rizki@example.local
            </button>
            <button onClick={() => quickLogin('admin@example.local')} className="flex-1 rounded-md bg-secondary/10 px-3 py-2 text-sm hover:bg-secondary/20">
              admin@example.local
            </button>
          </div>
        </div>

        <div className="relative py-2">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t" />
          </div>
          <div className="relative flex justify-center text-xs uppercase">
            <span className="bg-white px-2 text-muted-foreground">Or credentials</span>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {error && (
            <div className="rounded-lg bg-red-50 border border-red-200 p-3 flex gap-2 text-sm text-red-700">
              <AlertCircle className="h-5 w-5 flex-shrink-0" /> {error}
            </div>
          )}
          <div className="space-y-1">
            <label htmlFor="email" className="text-sm font-medium">
              Email
            </label>
            <div className="relative">
              <Mail className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <input id="email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@company.com" className="input pl-10" required />
            </div>
          </div>
          <button type="submit" disabled={loading} className="w-full rounded-md bg-primary px-4 py-3 text-sm font-medium text-white hover:bg-primary/90 disabled:opacity-50">
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
