import { useState, useEffect } from 'react'
import { useAuth } from '../../hooks/useAuth'
import { useDashboardContext } from './DashboardLayout'
import { api } from '../../services/api'
import { AlertTriangle, Upload, Palette } from 'lucide-react'

const COLOR_PALETTES: { value: string; label: string; colors: string[] }[] = [
  { value: 'ocean', label: 'Ocean', colors: ['#0077b6', '#00b4d8', '#90e0ef', '#caf0f8'] },
  { value: 'sunset', label: 'Sunset', colors: ['#ff6b35', '#f7c59f', '#efefd0', '#004e64'] },
  { value: 'forest', label: 'Forest', colors: ['#2d6a4f', '#40916c', '#74c69d', '#d8f3dc'] },
  { value: 'berry', label: 'Berry', colors: ['#9d0208', '#d00000', '#dc2f02', '#e85d04'] },
  { value: 'midnight', label: 'Midnight', colors: ['#03045e', '#0077b6', '#00b4d8', '#90e0ef'] },
  { value: 'candy', label: 'Candy', colors: ['#ff006e', '#fb5607', '#ffbe0b', '#8338ec'] },
  { value: 'golden', label: 'Golden', colors: ['#d4af37', '#f4e5c2', '#fefae0', '#dda15e'] },
  { value: 'monochrome', label: 'Monochrome', colors: ['#000000', '#333333', '#666666', '#cccccc'] },
]

export default function ProfilePage() {
  const { user } = useAuth()
  const { profile, reload } = useDashboardContext()
  const [form, setForm] = useState({ displayName: '', bio: '', team: '', company: '', theme: 'default', published: false, colorPalette: '' as string | null, logoUrl: '' as string | null })
  const [username, setUsername] = useState('')
  const [usernameMsg, setUsernameMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null)
  const [savingUsername, setSavingUsername] = useState(false)
  const [logoInput, setLogoInput] = useState('')

  useEffect(() => {
    if (profile) {
      const p = profile as unknown as { user?: { displayName: string }; colorPalette?: string | null; logoUrl?: string | null }
      setForm({
        displayName: p.user?.displayName || user?.displayName || '',
        bio: profile.bio || '',
        team: profile.team || '',
        company: profile.company || '',
        theme: profile.theme || 'default',
        published: !!profile.published,
        colorPalette: p.colorPalette || null,
        logoUrl: p.logoUrl || null,
      })
    } else if (user) {
      setForm((f) => ({ ...f, displayName: user.displayName || '' }))
    }
    if (user) setUsername(user.username)
  }, [profile, user])

  const saveProfile = async () => {
    await api.profilePut({ bio: form.bio || null, team: form.team || null, company: form.company || null, theme: form.theme, displayName: form.displayName, colorPalette: form.colorPalette, logoUrl: form.logoUrl || null })
    await api.profilePublish(form.published)
    await reload()
    alert('Profile saved')
  }

  const handleLogoSave = () => {
    if (logoInput.trim()) {
      setForm({ ...form, logoUrl: logoInput.trim() })
      setLogoInput('')
    }
  }

  const selectedPalette = COLOR_PALETTES.find((p) => p.value === form.colorPalette)

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
        <div className="space-y-2">
          <label className="text-sm font-medium flex items-center gap-2"><Palette className="h-4 w-4" /> Color Palette (optional)</label>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {COLOR_PALETTES.map((palette) => (
              <button
                key={palette.value}
                type="button"
                onClick={() => setForm({ ...form, colorPalette: form.colorPalette === palette.value ? null : palette.value })}
                className={`rounded-lg border p-2 transition ${form.colorPalette === palette.value ? 'border-primary ring-2 ring-primary/30' : 'hover:border-muted-foreground/50'}`}
              >
                <div className="flex gap-1 mb-1.5">
                  {palette.colors.map((color, i) => (
                    <div key={i} className="h-4 flex-1 rounded" style={{ backgroundColor: color }} />
                  ))}
                </div>
                <span className="text-xs font-medium">{palette.label}</span>
              </button>
            ))}
          </div>
          {selectedPalette && (
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <span>Selected:</span>
              <div className="flex gap-1">
                {selectedPalette.colors.map((color, i) => (
                  <div key={i} className="h-3 w-6 rounded" style={{ backgroundColor: color }} />
                ))}
              </div>
              <span className="font-medium">{selectedPalette.label}</span>
            </div>
          )}
        </div>
        <div className="space-y-2">
          <label className="text-sm font-medium flex items-center gap-2"><Upload className="h-4 w-4" /> Logo URL (optional)</label>
          <div className="flex gap-2">
            <input value={logoInput} onChange={(e) => setLogoInput(e.target.value)} placeholder="https://example.com/logo.png" className="input flex-1" />
            <button type="button" onClick={handleLogoSave} disabled={!logoInput.trim()} className="rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 disabled:opacity-50">Set</button>
          </div>
          {form.logoUrl && (
            <div className="flex items-center gap-3 mt-2 p-2 rounded border bg-muted/30">
              <img src={form.logoUrl} alt="Logo preview" className="h-12 w-12 object-contain rounded bg-white p-1" onError={(e) => (e.currentTarget.style.display = 'none')} />
              <span className="text-xs text-muted-foreground truncate flex-1">{form.logoUrl}</span>
              <button type="button" onClick={() => setForm({ ...form, logoUrl: null })} className="text-xs text-red-600 hover:underline">Remove</button>
            </div>
          )}
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
