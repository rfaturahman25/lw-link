import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '../../hooks/useAuth'
import { api } from '../../services/api'
import { QRCodeSVG } from 'qrcode.react'

type Profile = { bio: string | null; team: string | null; company: string | null; theme: string; backgroundColor: string; textColor: string; buttonStyle: string; published: boolean; avatarUrl?: string | null; displayName?: string }
type LinkItem = { id: string; title: string; url: string; icon: string | null; position: number; enabled: boolean }

export default function DashboardPage() {
  const { user } = useAuth()
  const [tab, setTab] = useState<'overview' | 'links' | 'profile' | 'analytics' | 'admin'>('overview')
  const [profile, setProfile] = useState<Profile | null>(null)
  const [links, setLinks] = useState<LinkItem[]>([])
  const [analytics, setAnalytics] = useState<{ totalViews: number; totalClicks: number; topLinks: unknown[]; daily: unknown[] } | null>(null)
  const [adminUsers, setAdminUsers] = useState<Array<{ id: string; username: string; email: string; role: string; status: string }>>([])
  const [loading, setLoading] = useState(true)

  // profile form
  const [form, setForm] = useState({ displayName: '', bio: '', team: '', company: '', theme: 'default', published: false })
  // link form
  const [linkForm, setLinkForm] = useState({ title: '', url: '', icon: '' })
  const [editingId, setEditingId] = useState<string | null>(null)

  const load = async () => {
    setLoading(true)
    try {
      const [pRes, lRes, aRes] = await Promise.all([
        api.profileGet() as Promise<{ success: boolean; data: Profile & { user: { displayName: string; avatarUrl: string | null } } }>,
        api.links() as Promise<{ success: boolean; data: LinkItem[] }>,
        api.analytics() as Promise<{ success: boolean; data: { totalViews: number; totalClicks: number } }>,
      ])
      const p = pRes.data
      setProfile(p)
      setForm({
        displayName: (p as unknown as { user?: { displayName: string } }).user?.displayName || user?.displayName || '',
        bio: p.bio || '',
        team: p.team || '',
        company: p.company || '',
        theme: p.theme || 'default',
        published: !!p.published,
      })
      setLinks(lRes.data || [])
      setAnalytics(aRes.data as never)
    } catch (_e) {
      // ignore
    }
    setLoading(false)
  }

  useEffect(() => {
    load()
  }, [])

  useEffect(() => {
    if (tab === 'admin' && user?.role === 'admin') {
      void (api.adminUsers() as Promise<{ success: boolean; data: typeof adminUsers }>).then((r) => setAdminUsers(r.data)).catch(() => {})
    }
  }, [tab, user])

  const saveProfile = async () => {
    await api.profilePut({ bio: form.bio || null, team: form.team || null, company: form.company || null, theme: form.theme, displayName: form.displayName })
    await api.profilePublish(form.published)
    await load()
    alert('Profile saved')
  }

  const addLink = async (e: React.FormEvent) => {
    e.preventDefault()
    if (editingId) {
      await api.linkUpdate(editingId, { title: linkForm.title, url: linkForm.url, icon: linkForm.icon || null })
      setEditingId(null)
    } else {
      await api.linkCreate({ title: linkForm.title, url: linkForm.url, icon: linkForm.icon || null })
    }
    setLinkForm({ title: '', url: '', icon: '' })
    await load()
  }

  const toggleLink = async (id: string) => {
    await api.linkToggle(id)
    await load()
  }
  const deleteLink = async (id: string) => {
    if (!confirm('Delete link?')) return
    await api.linkDelete(id)
    await load()
  }
  const move = async (id: string, dir: -1 | 1) => {
    const idx = links.findIndex((l) => l.id === id)
    if (idx < 0) return
    const newIdx = idx + dir
    if (newIdx < 0 || newIdx >= links.length) return
    const ordered = [...links]
    const [moved] = ordered.splice(idx, 1)
    ordered.splice(newIdx, 0, moved)
    await api.linkReorder(ordered.map((l) => l.id))
    await load()
  }

  if (loading) return <div className="p-8 text-center">Loading dashboard...</div>

  const publicUrl = user ? `${window.location.origin}/@${user.username}` : ''

  return (
    <div className="flex flex-col lg:flex-row gap-6">
      <aside className="lg:w-56 flex-shrink-0 space-y-4">
        <div className="card p-3 space-y-1">
          {(['overview', 'links', 'profile', 'analytics'] as const).map((t) => (
            <button key={t} onClick={() => setTab(t)} className={`w-full text-left rounded-md px-3 py-2 text-sm capitalize ${tab === t ? 'bg-primary text-white' : 'hover:bg-accent'}`}>
              {t}
            </button>
          ))}
          {user?.role === 'admin' && (
            <button onClick={() => setTab('admin')} className={`w-full text-left rounded-md px-3 py-2 text-sm ${tab === 'admin' ? 'bg-primary text-white' : 'hover:bg-accent'}`}>
              Admin
            </button>
          )}
        </div>
        <div className="card p-4 text-center space-y-2">
          <p className="font-semibold">Your profile</p>
          <p className="text-xs break-all text-muted-foreground">{publicUrl}</p>
          {profile?.published ? <span className="inline-block rounded bg-green-100 px-2 py-1 text-xs text-green-700">Published</span> : <span className="inline-block rounded bg-yellow-100 px-2 py-1 text-xs">Draft</span>}
          <div className="flex justify-center bg-white p-2">
            <QRCodeSVG value={publicUrl} size={100} />
          </div>
          <Link to={`/@${user?.username}`} target="_blank" className="text-xs text-primary hover:underline block">
            View public profile
          </Link>
        </div>
      </aside>

      <main className="flex-1 space-y-6">
        {tab === 'overview' && (
          <div className="space-y-4">
            <h1 className="text-2xl font-bold">Overview</h1>
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="card p-4">
                <p className="text-sm text-muted-foreground">Links</p>
                <p className="text-2xl font-bold">{links.length}</p>
              </div>
              <div className="card p-4">
                <p className="text-sm text-muted-foreground">Views</p>
                <p className="text-2xl font-bold">{analytics?.totalViews ?? 0}</p>
              </div>
              <div className="card p-4">
                <p className="text-sm text-muted-foreground">Clicks</p>
                <p className="text-2xl font-bold">{analytics?.totalClicks ?? 0}</p>
              </div>
              <div className="card p-4">
                <p className="text-sm text-muted-foreground">Status</p>
                <p className="text-xl font-bold">{profile?.published ? 'Published' : 'Draft'}</p>
              </div>
            </div>
            <div className="card p-4">
              <h3 className="font-semibold mb-2">Quick actions</h3>
              <div className="flex gap-2 flex-wrap">
                <button onClick={() => setTab('links')} className="rounded-md bg-primary px-4 py-2 text-sm text-white">
                  Manage links
                </button>
                <button onClick={() => setTab('profile')} className="rounded-md border px-4 py-2 text-sm">
                  Edit profile
                </button>
                <button onClick={() => setTab('analytics')} className="rounded-md border px-4 py-2 text-sm">
                  View analytics
                </button>
              </div>
            </div>
          </div>
        )}

        {tab === 'links' && (
          <div className="space-y-4">
            <h2 className="text-2xl font-bold">Links</h2>
            <form onSubmit={addLink} className="card p-4 space-y-3">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                <input value={linkForm.title} onChange={(e) => setLinkForm({ ...linkForm, title: e.target.value })} placeholder="Title (e.g. GitHub)" className="input" required />
                <input value={linkForm.url} onChange={(e) => setLinkForm({ ...linkForm, url: e.target.value })} placeholder="https://..." className="input" required />
                <input value={linkForm.icon} onChange={(e) => setLinkForm({ ...linkForm, icon: e.target.value })} placeholder="icon: github/linkedin/globe" className="input" />
              </div>
              <div className="flex gap-2">
                <button type="submit" className="rounded-md bg-primary px-4 py-2 text-sm text-white">
                  {editingId ? 'Update link' : '+ Add link'}
                </button>
                {editingId && (
                  <button type="button" onClick={() => { setEditingId(null); setLinkForm({ title: '', url: '', icon: '' }) }} className="rounded-md border px-4 py-2 text-sm">
                    Cancel
                  </button>
                )}
              </div>
              <p className="text-xs text-muted-foreground">Only http/https URLs allowed. Links are shown in order; use ↑↓ to reorder. Toggle to enable/disable.</p>
            </form>

            <div className="space-y-2">
              {links.map((l) => (
                <div key={l.id} className="card p-3 flex items-center justify-between gap-2">
                  <div className="flex-1 min-w-0">
                    <p className="font-medium truncate">
                      {l.title} {l.enabled ? '' : '(disabled)'}
                    </p>
                    <p className="text-xs text-muted-foreground truncate">{l.url}</p>
                  </div>
                  <div className="flex items-center gap-1 flex-wrap">
                    <button onClick={() => move(l.id, -1)} className="rounded border px-2 py-1 text-xs">
                      ↑
                    </button>
                    <button onClick={() => move(l.id, 1)} className="rounded border px-2 py-1 text-xs">
                      ↓
                    </button>
                    <button onClick={() => { setEditingId(l.id); setLinkForm({ title: l.title, url: l.url, icon: l.icon || '' }) }} className="rounded border px-2 py-1 text-xs">
                      Edit
                    </button>
                    <button onClick={() => toggleLink(l.id)} className={`rounded px-2 py-1 text-xs ${l.enabled ? 'bg-green-100' : 'bg-yellow-100'}`}>
                      {l.enabled ? 'ON' : 'OFF'}
                    </button>
                    <button onClick={() => deleteLink(l.id)} className="rounded bg-red-50 px-2 py-1 text-xs text-red-700">
                      Delete
                    </button>
                  </div>
                </div>
              ))}
              {links.length === 0 && <p className="text-sm text-muted-foreground">No links yet. Add your first link above.</p>}
            </div>
          </div>
        )}

        {tab === 'profile' && (
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
              <button onClick={saveProfile} className="rounded-md bg-primary px-4 py-2 text-sm text-white">
                Save profile
              </button>
              <p className="text-xs text-muted-foreground">Username: @{user?.username} — change via API /api/me if needed. Only published profiles are public.</p>
            </div>
          </div>
        )}

        {tab === 'analytics' && (
          <div className="space-y-4">
            <h2 className="text-2xl font-bold">Analytics</h2>
            <div className="grid grid-cols-2 gap-4">
              <div className="card p-4">
                <p className="text-sm text-muted-foreground">Profile views (total)</p>
                <p className="text-2xl font-bold">{analytics?.totalViews ?? 0}</p>
              </div>
              <div className="card p-4">
                <p className="text-sm text-muted-foreground">Link clicks (total)</p>
                <p className="text-2xl font-bold">{analytics?.totalClicks ?? 0}</p>
              </div>
            </div>
            <div className="card p-4">
              <h3 className="font-semibold mb-2">Top links</h3>
              {(analytics as { topLinks?: Array<{ title?: string; url?: string; clicks: number }> })?.topLinks?.length ? (
                <ul className="space-y-1 text-sm">
                  {(analytics as { topLinks: Array<{ title?: string; url?: string; clicks: number }> }).topLinks.map((t, i) => (
                    <li key={i} className="flex justify-between">
                      <span className="truncate">{t.title || t.url || '—'}</span> <span className="font-medium">{t.clicks}</span>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="text-sm text-muted-foreground">No clicks yet</p>
              )}
            </div>
            <div className="card p-4">
              <h3 className="font-semibold mb-2">Daily (last 7 days)</h3>
              <pre className="text-xs overflow-auto">{JSON.stringify((analytics as { daily?: unknown })?.daily || [], null, 2)}</pre>
            </div>
          </div>
        )}

        {tab === 'admin' && user?.role === 'admin' && (
          <div className="space-y-4">
            <h2 className="text-2xl font-bold">Admin — Users</h2>
            <div className="card p-4 space-y-2">
              {adminUsers.map((u) => (
                <div key={u.id} className="flex items-center justify-between rounded border p-2 text-sm">
                  <div>
                    <p className="font-medium">
                      @{u.username} — {u.email}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {u.role} • {u.status}
                    </p>
                  </div>
                  <div className="flex gap-1">
                    <button
                      onClick={async () => {
                        await fetch(`/api/admin/users/${u.id}/status`, { method: 'PUT', headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${localStorage.getItem('session_token') || ''}` }, body: JSON.stringify({ status: u.status === 'active' ? 'disabled' : 'active' }) })
                        setAdminUsers((prev) => prev.map((x) => (x.id === u.id ? { ...x, status: x.status === 'active' ? 'disabled' : 'active' } : x)))
                      }}
                      className="rounded border px-2 py-1 text-xs"
                    >
                      Toggle status
                    </button>
                    <button
                      onClick={async () => {
                        await fetch(`/api/admin/users/${u.id}/role`, { method: 'PUT', headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${localStorage.getItem('session_token') || ''}` }, body: JSON.stringify({ role: u.role === 'admin' ? 'user' : 'admin' }) })
                        setAdminUsers((prev) => prev.map((x) => (x.id === u.id ? { ...x, role: x.role === 'admin' ? 'user' : 'admin' } : x)))
                      }}
                      className="rounded border px-2 py-1 text-xs"
                    >
                      Toggle role
                    </button>
                  </div>
                </div>
              ))}
              {adminUsers.length === 0 && <p className="text-sm text-muted-foreground">No users</p>}
            </div>
          </div>
        )}
      </main>
    </div>
  )
}
