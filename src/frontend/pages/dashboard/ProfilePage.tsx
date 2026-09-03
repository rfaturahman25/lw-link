import { useState, useEffect } from 'react'
import { useAuth } from '../../hooks/useAuth'
import { useDashboardContext } from './DashboardLayout'
import { api } from '../../services/api'
import { AlertTriangle } from 'lucide-react'

export default function ProfilePage() {
  const { user } = useAuth()
  const { profile, reload } = useDashboardContext()
  const [form, setForm] = useState({ displayName: '', bio: '', team: '', company: '', theme: 'default', published: false })
  const [username, setUsername] = useState('')
  const [usernameMsg, setUsernameMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null)
  const [savingUsername, setSavingUsername] = useState(false)

  useEffect(() => {
    if (profile) {
      setForm({
        displayName: (profile as unknown as { user?: { displayName: string } }).user?.displayName || user?.displayName || '',
        bio: profile.bio || '',
        team: profile.team || '',
        company: profile.company || '',
        theme: profile.theme || 'default',
        published: !!profile.published,
      })
    } else if (user) {
      setForm((f) => ({ ...f, displayName: user.displayName || '' }))
    }
    if (user) setUsername(user.username)
  }, [profile, user])

  const saveProfile = async () => {
    await api.profilePut({ bio: form.bio || null, team: form.team || null, company: form.company || null, theme: form.theme, displayName: form.displayName })
    await api.profilePublish(form.published)
    await reload()
    alert('Profile saved')
  }

  const saveUsername = async () => {
    const clean = username.trim().toLowerCase()
    if (!/^[a-z0-9_]{3,30}$/.test(clean)) {
      setUsernameMsg({ type: 'error', text: 'Username must be 3-30 lowercase letters, numbers, underscore' })
      return
    }
    if (clean === user?.username) {
      setUsernameMsg({ type: 'error', text: 'Username unchanged' })
      return
    }
    if (!confirm(`Change username from @${user?.username} to @${clean}?\n\nPublic URL will change to https://links.lensawaktu.id/@${clean}`)) return
    setSavingUsername(true)
    setUsernameMsg(null)
    try {
      const res = (await api.meUpdate({ username: clean })) as { success: boolean; data: { username: string } }
      setUsernameMsg({ type: 'success', text: `Username changed to @${res.data.username}. New URL: /@${res.data.username}` })
      // reload to reflect new username in auth and dashboard
      setTimeout(() => window.location.reload(), 1200)
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to change username'
      setUsernameMsg({ type: 'error', text: msg })
    } finally {
      setSavingUsername(false)
    }
  }

  return (
    <div className="space-y-4">
      <h2 className="text-2xl font-bold">Profile</h2>
      <div className="card p-4 space-y-4">
        <div className="rounded-lg border bg-muted/20 p-4 space-y-2">
          <label className="text-sm font-medium">Username (public URL)</label>
          <div className="flex gap-2">
            <span className="inline-flex items-center rounded-l-md border border-r-0 bg-muted px-3 text-sm text-muted-foreground">/@</span>
            <input value={username} onChange={(e) => setUsername(e.target.value.toLowerCase().replace(/[^a-z0-9_]/g, ''))} placeholder="lensawaktu" className="input rounded-l-none flex-1" maxLength={30} />
            <button onClick={saveUsername} disabled={savingUsername || username.trim().toLowerCase() === user?.username} className="rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 disabled:opacity-50 whitespace-nowrap">
              {savingUsername ? 'Saving...' : 'Change'}
            </button>
          </div>
          <p className="text-xs text-muted-foreground">Public URL: <span className="font-mono">https://links.lensawaktu.id/@{username || user?.username}</span></p>
          {username.trim().toLowerCase() !== user?.username && <p className="text-xs text-amber-600 flex items-center gap-1"><AlertTriangle className="h-3 w-3" /> Will change from /@{user?.username} to /@{username.trim().toLowerCase()}</p>}
          {usernameMsg && <p className={`text-xs ${usernameMsg.type === 'error' ? 'text-red-600' : 'text-green-600'}`}>{usernameMsg.text}</p>}
          <p className="text-xs text-muted-foreground">3-30 lowercase, numbers, underscore. Must be unique.</p>
        </div>
        <div>
          <label className="text-sm font-medium">Display name</label>
          <input value={form.displayName} onChange={(e) => setForm({ ...form, displayName: e.target.value })} className="input mt-1" />
        </div>
        <div>
          <label className="text-sm font-medium">Bio</label>
          <textarea value={form.bio} onChange={(e) => setForm({ ...form, bio: e.target.value })} className="input mt-1 min-h-[80px]" maxLength={500} />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <div>
            <label className="text-sm font-medium">Team</label>
            <input value={form.team} onChange={(e) => setForm({ ...form, team: e.target.value })} className="input mt-1" />
          </div>
          <div>
            <label className="text-sm font-medium">Company</label>
            <input value={form.company} onChange={(e) => setForm({ ...form, company: e.target.value })} className="input mt-1" />
          </div>
        </div>
        <div>
          <label className="text-sm font-medium">Theme</label>
          <select value={form.theme} onChange={(e) => setForm({ ...form, theme: e.target.value })} className="input mt-1">
            <option value="default">Default</option>
            <option value="light">Light</option>
            <option value="dark">Dark</option>
            <option value="minimal">Minimal</option>
            <option value="gradient">Gradient</option>
          </select>
        </div>
        <label className="flex items-center gap-2 text-sm">
          <input type="checkbox" checked={form.published} onChange={(e) => setForm({ ...form, published: e.target.checked })} /> Published (visible at /@{user?.username})
        </label>
        <button onClick={saveProfile} className="inline-flex items-center justify-center rounded-md bg-primary px-5 py-2.5 text-sm font-medium text-primary-foreground hover:bg-primary/90 shadow">
          Save profile
        </button>
        <p className="text-xs text-muted-foreground">Username: @{user?.username} — change via API /api/me if needed. Only published profiles are public.</p>
      </div>
    </div>
  )
}
