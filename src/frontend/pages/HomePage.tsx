import { Link } from 'react-router-dom'
import { ArrowRight, ExternalLink, Copy } from 'lucide-react'
import { useAuth } from '../hooks/useAuth'
import { useState } from 'react'

const HomePage = () => {
  const { user } = useAuth()
  const [copied, setCopied] = useState(false)
  const exampleUrl = `${window.location.origin}/@rizki`

  const copy = async () => {
    await navigator.clipboard.writeText(exampleUrl).catch(() => {})
    setCopied(true)
    setTimeout(() => setCopied(false), 1500)
  }

  return (
    <div className="max-w-3xl mx-auto space-y-8 py-8">
      {/* Header - internal */}
      <section className="space-y-4">
        <p className="text-sm font-medium text-muted-foreground">Internal tool — LW-link</p>
        <h1 className="text-3xl font-bold tracking-tight">Link hub buat bio Instagram</h1>
        <p className="text-muted-foreground">
          Cuma buat internal. Bikin profile, tambah link, share <span className="font-mono text-sm bg-muted px-1.5 py-0.5 rounded">/@username</span> di bio IG.
        </p>
        <div className="flex flex-wrap gap-3 pt-2">
          {user ? (
            <>
              <Link
                to="/dashboard"
                className="inline-flex items-center gap-2 rounded-md bg-primary px-5 py-2.5 text-sm font-medium text-primary-foreground hover:bg-primary/90"
              >
                Buka Dashboard <ArrowRight className="h-4 w-4" />
              </Link>
              <Link
                to={`/@${user.username}`}
                className="inline-flex items-center gap-2 rounded-md border px-5 py-2.5 text-sm font-medium hover:bg-accent"
              >
                Lihat @{user.username} <ExternalLink className="h-4 w-4" />
              </Link>
            </>
          ) : (
            <>
              <Link
                to="/login"
                className="inline-flex items-center gap-2 rounded-md bg-primary px-5 py-2.5 text-sm font-medium text-primary-foreground hover:bg-primary/90"
              >
                Login <ArrowRight className="h-4 w-4" />
              </Link>
              <Link
                to="/@rizki"
                className="inline-flex items-center gap-2 rounded-md border px-5 py-2.5 text-sm font-medium hover:bg-accent"
              >
                Lihat contoh @rizki <ExternalLink className="h-4 w-4" />
              </Link>
            </>
          )}
        </div>
      </section>

      {/* Example link card */}
      <section className="card p-4 flex items-center justify-between gap-3">
        <div className="min-w-0">
          <p className="text-sm font-medium">Contoh profile</p>
          <p className="text-sm text-muted-foreground truncate">{exampleUrl}</p>
        </div>
        <button onClick={copy} className="inline-flex items-center gap-2 rounded-md border px-3 py-2 text-sm hover:bg-accent shrink-0">
          <Copy className="h-4 w-4" /> {copied ? 'Copied' : 'Copy'}
        </button>
      </section>

      {/* How to - minimal */}
      <section className="card p-5 space-y-3">
        <h2 className="font-semibold">Cara pakai</h2>
        <ol className="list-decimal list-inside space-y-1 text-sm text-muted-foreground">
          <li>Login pakai email internal</li>
          <li>Di Dashboard → tambah link (IG, TikTok, WA, dll)</li>
          <li>Publish profile, share URL <span className="font-mono text-xs">/@username</span> di bio Instagram</li>
        </ol>
      </section>
    </div>
  )
}

export default HomePage
