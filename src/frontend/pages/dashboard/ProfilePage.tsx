import { useState, useEffect } from 'react'
import { useAuth } from '../../hooks/useAuth'
import { useDashboardContext } from './DashboardLayout'
import { api } from '../../services/api'

export default function ProfilePage() {
  const { user } = useAuth()
  const { profile, reload } = useDashboardContext()
  const [form, setForm] = useState({ displayName: '', bio: '', team: '', company: '', theme: 'default', published: false })

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
  }, [profile, user])

  const saveProfile = async () => {
    await api.profilePut({ bio: form.bio || null, team: form.team || null, company: form.company || null, theme: form.theme, displayName: form.displayName })
    await api.profilePublish(form.published)
    await reload()
    alert('Profile saved')
  }

  return (
    <div className="space-y-4">
      <h2 className="text-2xl font-bold">Profile</h2>
      <div className="card p-4 space-y-4">
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
