import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '../../hooks/useAuth'
import { api } from '../../services/api'
import { QRCodeSVG } from 'qrcode.react'
import { DndContext, closestCenter, PointerSensor, useSensor, useSensors, KeyboardSensor, DragEndEvent } from '@dnd-kit/core'
import { SortableContext, verticalListSortingStrategy, arrayMove, useSortable, sortableKeyboardCoordinates } from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import {
  GripVertical,
  Github,
  Linkedin,
  Twitter,
  Globe,
  Mail,
  Instagram,
  Youtube,
  Facebook,
  Link as LinkIcon,
  MessageCircle,
  FileSpreadsheet,
  FileText,
  ShoppingBag,
  Phone,
  Image as ImageIcon,
  Music,
  Video,
  Eye,
  MousePointerClick,
  Users,
  TrendingUp,
  Trophy,
  BarChart3,
  PieChart as PieChartIcon,
  Calendar,
} from 'lucide-react'

type Profile = { bio: string | null; team: string | null; company: string | null; theme: string; backgroundColor: string; textColor: string; buttonStyle: string; published: boolean; avatarUrl?: string | null; displayName?: string }
type LinkItem = { id: string; title: string; url: string; icon: string | null; position: number; enabled: boolean }

// ---- icon picker ----
const ICON_OPTIONS = [
  { value: 'link', label: 'Link', icon: LinkIcon },
  { value: 'instagram', label: 'Instagram', icon: Instagram },
  { value: 'whatsapp', label: 'WhatsApp', icon: MessageCircle },
  { value: 'sheet', label: 'Google Sheet', icon: FileSpreadsheet },
  { value: 'globe', label: 'Website', icon: Globe },
  { value: 'youtube', label: 'YouTube', icon: Youtube },
  { value: 'tiktok', label: 'TikTok', icon: Music },
  { value: 'github', label: 'GitHub', icon: Github },
  { value: 'linkedin', label: 'LinkedIn', icon: Linkedin },
  { value: 'twitter', label: 'Twitter', icon: Twitter },
  { value: 'facebook', label: 'Facebook', icon: Facebook },
  { value: 'mail', label: 'Email', icon: Mail },
  { value: 'phone', label: 'Phone', icon: Phone },
  { value: 'file', label: 'File', icon: FileText },
  { value: 'shop', label: 'Shop', icon: ShoppingBag },
  { value: 'image', label: 'Image', icon: ImageIcon },
  { value: 'video', label: 'Video', icon: Video },
] as const

const iconMap: Record<string, React.ReactNode> = {
  github: <Github className="h-5 w-5" />,
  linkedin: <Linkedin className="h-5 w-5" />,
  twitter: <Twitter className="h-5 w-5" />,
  globe: <Globe className="h-5 w-5" />,
  mail: <Mail className="h-5 w-5" />,
  instagram: <Instagram className="h-5 w-5" />,
  youtube: <Youtube className="h-5 w-5" />,
  facebook: <Facebook className="h-5 w-5" />,
  whatsapp: <MessageCircle className="h-5 w-5" />,
  sheet: <FileSpreadsheet className="h-5 w-5" />,
  link: <LinkIcon className="h-5 w-5" />,
  file: <FileText className="h-5 w-5" />,
  shop: <ShoppingBag className="h-5 w-5" />,
  phone: <Phone className="h-5 w-5" />,
  image: <ImageIcon className="h-5 w-5" />,
  video: <Video className="h-5 w-5" />,
  music: <Music className="h-5 w-5" />,
  tiktok: <Music className="h-5 w-5" />,
  default: <LinkIcon className="h-5 w-5" />,
}

function SortableLinkItem({
  link,
  onEdit,
  onToggle,
  onDelete,
}: {
  link: LinkItem
  onEdit: () => void
  onToggle: () => void
  onDelete: () => void
}) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: link.id })
  const style: React.CSSProperties = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.6 : 1,
  }
  return (
    <div ref={setNodeRef} style={style} className={`card p-3 flex items-center gap-2 ${isDragging ? 'shadow-lg ring-2 ring-primary/20' : ''}`}>
      <button
        {...attributes}
        {...listeners}
        className="shrink-0 rounded p-1.5 hover:bg-accent text-muted-foreground cursor-grab active:cursor-grabbing touch-none"
        aria-label="Drag to reorder"
      >
        <GripVertical className="h-4 w-4" />
      </button>
      <div className="h-9 w-9 rounded-lg bg-primary/10 flex items-center justify-center text-primary shrink-0">
        {iconMap[link.icon || 'link'] || iconMap.default}
      </div>
      <div className="flex-1 min-w-0">
        <p className="font-medium truncate text-sm">
          {link.title} {link.enabled ? '' : '(disabled)'}
        </p>
        <p className="text-xs text-muted-foreground truncate">{link.url}</p>
      </div>
      <div className="flex items-center gap-1 shrink-0">
        <button onClick={onEdit} className="rounded border px-2 py-1 text-xs hover:bg-accent">
          Edit
        </button>
        <button onClick={onToggle} className={`rounded px-2 py-1 text-xs font-medium ${link.enabled ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700'}`}>
          {link.enabled ? 'ON' : 'OFF'}
        </button>
        <button onClick={onDelete} className="rounded bg-red-50 px-2 py-1 text-xs text-red-700 hover:bg-red-100">
          Delete
        </button>
      </div>
    </div>
  )
}

export default function DashboardPage() {
  const { user } = useAuth()
  const [tab, setTab] = useState<'overview' | 'links' | 'profile' | 'analytics' | 'admin'>('overview')
  const [profile, setProfile] = useState<Profile | null>(null)
  const [links, setLinks] = useState<LinkItem[]>([])
  const [analytics, setAnalytics] = useState<{
    totalViews: number
    totalClicks: number
    uniqueVisitors: number
    topLinks: Array<{ linkId: string | null; clicks: number; title: string | null; url: string | null; icon: string | null }>
    daily: Array<{ date: string; views: number; clicks: number }>
  } | null>(null)
  const [adminUsers, setAdminUsers] = useState<Array<{ id: string; username: string; email: string; role: string; status: string }>>([])
  const [loading, setLoading] = useState(true)

  const [form, setForm] = useState({ displayName: '', bio: '', team: '', company: '', theme: 'default', published: false })
  const [linkForm, setLinkForm] = useState({ title: '', url: '', icon: 'link' })
  const [editingId, setEditingId] = useState<string | null>(null)

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 6 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  )

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
    setLinkForm({ title: '', url: '', icon: 'link' })
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

  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event
    if (!over || active.id === over.id) return
    const oldIndex = links.findIndex((l) => l.id === active.id)
    const newIndex = links.findIndex((l) => l.id === over.id)
    if (oldIndex === -1 || newIndex === -1) return
    const newOrder = arrayMove(links, oldIndex, newIndex)
    setLinks(newOrder)
    try {
      await api.linkReorder(newOrder.map((l) => l.id))
    } catch {
      await load()
    }
  }

  if (loading) return <div className="p-8 text-center">Loading dashboard...</div>

  const publicUrl = user ? `${window.location.origin}/@${user.username}` : ''

  return (
    <div className="flex flex-col lg:flex-row gap-6">
      <aside className="lg:w-56 flex-shrink-0 space-y-4">
        <div className="card p-3 space-y-1">
          {(['overview', 'links', 'profile', 'analytics'] as const).map((t) => (
            <button key={t} onClick={() => setTab(t)} className={`w-full text-left rounded-md px-3 py-2 text-sm capitalize ${tab === t ? 'bg-primary text-primary-foreground' : 'hover:bg-accent'}`}>
              {t}
            </button>
          ))}
          {user?.role === 'admin' && (
            <button onClick={() => setTab('admin')} className={`w-full text-left rounded-md px-3 py-2 text-sm ${tab === 'admin' ? 'bg-primary text-primary-foreground' : 'hover:bg-accent'}`}>
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
                <button onClick={() => setTab('links')} className="inline-flex items-center justify-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 shadow">
                  Manage links
                </button>
                <button onClick={() => setTab('profile')} className="rounded-md border px-4 py-2 text-sm hover:bg-accent">
                  Edit profile
                </button>
                <button onClick={() => setTab('analytics')} className="rounded-md border px-4 py-2 text-sm hover:bg-accent">
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
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <input value={linkForm.title} onChange={(e) => setLinkForm({ ...linkForm, title: e.target.value })} placeholder="Title (e.g. WhatsApp)" className="input" required />
                <input value={linkForm.url} onChange={(e) => setLinkForm({ ...linkForm, url: e.target.value })} placeholder="https://..." className="input" required />
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium">Icon</label>
                <div className="grid grid-cols-4 sm:grid-cols-6 md:grid-cols-9 gap-2">
                  {ICON_OPTIONS.map((opt) => {
                    const Icon = opt.icon
                    const selected = linkForm.icon === opt.value
                    return (
                      <button
                        key={opt.value}
                        type="button"
                        onClick={() => setLinkForm({ ...linkForm, icon: opt.value })}
                        className={`flex flex-col items-center gap-1 rounded-lg border p-2 text-xs hover:bg-accent ${selected ? 'bg-primary text-primary-foreground border-primary shadow' : 'bg-background'}`}
                        title={opt.label}
                      >
                        <Icon className="h-5 w-5" />
                        <span className="truncate w-full text-center text-[10px] leading-none">{opt.label}</span>
                      </button>
                    )
                  })}
                </div>
                <p className="text-xs text-muted-foreground">Pilih icon yang muncul di sebelah link (WA, IG, Sheet, dll). Kesimpen sebagai <code className="bg-muted px-1 rounded">{linkForm.icon}</code></p>
              </div>

              <div className="flex gap-2">
                <button type="submit" className="inline-flex items-center justify-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 shadow">
                  {editingId ? 'Update link' : '+ Add link'}
                </button>
                {editingId && (
                  <button type="button" onClick={() => { setEditingId(null); setLinkForm({ title: '', url: '', icon: 'link' }) }} className="rounded-md border px-4 py-2 text-sm hover:bg-accent">
                    Cancel
                  </button>
                )}
              </div>
              <p className="text-xs text-muted-foreground">Drag handle <span className="inline-flex align-middle"><GripVertical className="h-3 w-3" /></span> di kiri tiap link buat reorder. Toggle ON/OFF buat sembunyiin tanpa hapus.</p>
            </form>

            <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
              <SortableContext items={links.map((l) => l.id)} strategy={verticalListSortingStrategy}>
                <div className="space-y-2">
                  {links.map((l) => (
                    <SortableLinkItem
                      key={l.id}
                      link={l}
                      onEdit={() => { setEditingId(l.id); setLinkForm({ title: l.title, url: l.url, icon: l.icon || 'link' }) }}
                      onToggle={() => toggleLink(l.id)}
                      onDelete={() => deleteLink(l.id)}
                    />
                  ))}
                  {links.length === 0 && <p className="text-sm text-muted-foreground">No links yet. Add your first link above.</p>}
                </div>
              </SortableContext>
            </DndContext>
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
              <button onClick={saveProfile} className="inline-flex items-center justify-center rounded-md bg-primary px-5 py-2.5 text-sm font-medium text-primary-foreground hover:bg-primary/90 shadow">
                Save profile
              </button>
              <p className="text-xs text-muted-foreground">Username: @{user?.username} — change via API /api/me if needed. Only published profiles are public.</p>
            </div>
          </div>
        )}

        {tab === 'analytics' && (() => {
          const totalClicks = analytics?.totalClicks ?? 0
          const totalViews = analytics?.totalViews ?? 0
          const uniqueVisitors = analytics?.uniqueVisitors ?? 0
          const topLinks = (analytics?.topLinks ?? []) as Array<{ linkId: string | null; clicks: number; title: string | null; url: string | null; icon: string | null }>
          const daily = (analytics?.daily ?? []) as Array<{ date: string; views: number; clicks: number }>
          const ctr = totalViews > 0 ? ((totalClicks / totalViews) * 100).toFixed(1) : '0.0'
          const mostClicked = topLinks[0] ?? null
          const topLinksWithPct = topLinks.map((l) => ({ ...l, pct: totalClicks > 0 ? (l.clicks / totalClicks) * 100 : 0 }))
          const maxDaily = Math.max(1, ...daily.map((d) => Math.max(d.views, d.clicks)))
          const maxClicks = Math.max(1, ...topLinks.map((l) => l.clicks), 1)
          // donuts colors - use primary palette + distinct hues
          const donutColors = ['hsl(var(--primary))', '#22c55e', '#f59e0b', '#ef4444', '#8b5cf6', '#06b6d4', '#ec4899', '#84cc16', '#f97316', '#6366f1']
          const hasData = totalClicks > 0 || totalViews > 0

          // helpers for daily chart
          const chartW = 600
          const chartH = 140
          const padL = 28, padR = 12, padT = 12, padB = 22
          const innerW = chartW - padL - padR
          const innerH = chartH - padT - padB
          const stepX = daily.length > 1 ? innerW / (daily.length - 1) : innerW
          const yScale = (v: number) => padT + innerH - (v / maxDaily) * innerH
          const xScale = (i: number) => padL + i * stepX
          const viewsPath = daily.map((d, i) => `${i === 0 ? 'M' : 'L'} ${xScale(i)} ${yScale(d.views)}`).join(' ')
          const clicksPath = daily.map((d, i) => `${i === 0 ? 'M' : 'L'} ${xScale(i)} ${yScale(d.clicks)}`).join(' ')
          const viewsArea = `${viewsPath} L ${xScale(daily.length - 1)} ${padT + innerH} L ${xScale(0)} ${padT + innerH} Z`
          const clicksArea = `${clicksPath} L ${xScale(daily.length - 1)} ${padT + innerH} L ${xScale(0)} ${padT + innerH} Z`

          // donut calc
          let acc = 0
          const donutSegments = topLinksWithPct.map((l, i) => {
            const start = acc
            const len = l.pct
            acc += len
            return { ...l, start, len, color: donutColors[i % donutColors.length] }
          })

          return (
            <div className="space-y-6">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <h2 className="text-2xl font-bold">Analytics</h2>
                  <p className="text-sm text-muted-foreground">Clicks, views & link performance — last 7 days</p>
                </div>
                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                  <Calendar className="h-4 w-4" /> {daily[0]?.date ?? '—'} — {daily[daily.length - 1]?.date ?? '—'}
                </div>
              </div>

              {!hasData && (
                <div className="card p-8 text-center space-y-2">
                  <BarChart3 className="h-8 w-8 mx-auto text-muted-foreground" />
                  <p className="font-medium">No analytics yet</p>
                  <p className="text-sm text-muted-foreground">Share your profile <span className="font-mono">/@{user?.username}</span> and clicks/views will appear here.</p>
                </div>
              )}

              {/* Summary metrics */}
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="card p-4 space-y-2">
                  <div className="flex items-center justify-between">
                    <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Total Clicks</p>
                    <span className="h-8 w-8 rounded-lg bg-primary/10 flex items-center justify-center text-primary"><MousePointerClick className="h-4 w-4" /></span>
                  </div>
                  <p className="text-2xl font-bold">{totalClicks.toLocaleString()}</p>
                  <p className="text-xs text-muted-foreground">{topLinks.length} link{topLinks.length !== 1 ? 's' : ''} clicked</p>
                </div>
                <div className="card p-4 space-y-2">
                  <div className="flex items-center justify-between">
                    <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Profile Views</p>
                    <span className="h-8 w-8 rounded-lg bg-blue-50 flex items-center justify-center text-blue-600"><Eye className="h-4 w-4" /></span>
                  </div>
                  <p className="text-2xl font-bold">{totalViews.toLocaleString()}</p>
                  <p className="text-xs text-muted-foreground">CTR {ctr}%</p>
                </div>
                <div className="card p-4 space-y-2">
                  <div className="flex items-center justify-between">
                    <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Unique Visitors</p>
                    <span className="h-8 w-8 rounded-lg bg-green-50 flex items-center justify-center text-green-600"><Users className="h-4 w-4" /></span>
                  </div>
                  <p className="text-2xl font-bold">{uniqueVisitors.toLocaleString()}</p>
                  <p className="text-xs text-muted-foreground">distinct IP (hashed)</p>
                </div>
                <div className="card p-4 space-y-2">
                  <div className="flex items-center justify-between">
                    <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Top Link</p>
                    <span className="h-8 w-8 rounded-lg bg-amber-50 flex items-center justify-center text-amber-600"><Trophy className="h-4 w-4" /></span>
                  </div>
                  {mostClicked ? (
                    <>
                      <p className="text-sm font-bold truncate" title={mostClicked.title || mostClicked.url || ''}>{mostClicked.title || mostClicked.url || '—'}</p>
                      <p className="text-xs text-muted-foreground">{mostClicked.clicks} clicks • {((mostClicked.clicks / Math.max(1, totalClicks)) * 100).toFixed(1)}% of all</p>
                    </>
                  ) : (
                    <p className="text-sm text-muted-foreground">No clicks yet</p>
                  )}
                </div>
              </div>

              {/* Secondary metrics */}
              <div className="grid grid-cols-3 gap-4">
                <div className="card p-3 flex items-center justify-between">
                  <div>
                    <p className="text-xs text-muted-foreground">CTR</p>
                    <p className="text-lg font-bold flex items-center gap-1"><TrendingUp className="h-4 w-4 text-green-600" /> {ctr}%</p>
                  </div>
                  <span className="text-xs text-muted-foreground hidden sm:inline">clicks / views</span>
                </div>
                <div className="card p-3">
                  <p className="text-xs text-muted-foreground">Avg clicks / day</p>
                  <p className="text-lg font-bold">{(totalClicks / 7).toFixed(1)}</p>
                </div>
                <div className="card p-3">
                  <p className="text-xs text-muted-foreground">Avg views / day</p>
                  <p className="text-lg font-bold">{(totalViews / 7).toFixed(1)}</p>
                </div>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
                {/* Ranking */}
                <div className="card p-4 lg:col-span-3 space-y-3">
                  <div className="flex items-center justify-between">
                    <h3 className="font-semibold flex items-center gap-2"><Trophy className="h-4 w-4 text-amber-600" /> Ranking — Most Clicked</h3>
                    <span className="text-xs text-muted-foreground">{topLinks.length} links</span>
                  </div>
                  {topLinksWithPct.length ? (
                    <div className="space-y-3">
                      {topLinksWithPct.map((l, i) => (
                        <div key={l.linkId || i} className="space-y-1.5">
                          <div className="flex items-center gap-3">
                            <span className={`h-6 w-6 rounded-full flex items-center justify-center text-xs font-bold shrink-0 ${i === 0 ? 'bg-amber-400 text-white' : i === 1 ? 'bg-zinc-300 text-zinc-700' : i === 2 ? 'bg-amber-700 text-white' : 'bg-muted text-muted-foreground'}`}>{i + 1}</span>
                            <span className="h-8 w-8 rounded-lg bg-primary/10 flex items-center justify-center text-primary shrink-0">{iconMap[l.icon || 'link'] || iconMap.default}</span>
                            <div className="flex-1 min-w-0">
                              <p className="text-sm font-medium truncate">{l.title || l.url || 'Untitled'}</p>
                              <p className="text-xs text-muted-foreground truncate">{l.url?.replace(/^https?:\/\//, '') || '—'}</p>
                            </div>
                            <div className="text-right shrink-0">
                              <p className="text-sm font-bold">{l.clicks}</p>
                              <p className="text-xs text-muted-foreground">{l.pct.toFixed(1)}%</p>
                            </div>
                          </div>
                          <div className="h-2 rounded-full bg-muted overflow-hidden ml-9">
                            <div className="h-full rounded-full transition-all" style={{ width: `${Math.max(4, l.pct)}%`, background: donutColors[i % donutColors.length] }} />
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-sm text-muted-foreground py-6 text-center">No link clicks yet — data will appear after visitors click your links.</p>
                  )}
                </div>

                {/* Share donut */}
                <div className="card p-4 lg:col-span-2 space-y-4">
                  <h3 className="font-semibold flex items-center gap-2"><PieChartIcon className="h-4 w-4 text-primary" /> Click Share</h3>
                  {topLinksWithPct.length ? (
                    <>
                      <div className="flex justify-center">
                        <div className="relative h-48 w-48">
                          <svg viewBox="0 0 100 100" className="h-full w-full -rotate-90">
                            <circle cx="50" cy="50" r="32" fill="transparent" stroke="hsl(var(--muted))" strokeWidth="18" />
                            {donutSegments.map((s, i) => {
                              const dash = (s.len / 100) * (2 * Math.PI * 32)
                              const gap = 2 * Math.PI * 32 - dash
                              const offset = (s.start / 100) * (2 * Math.PI * 32)
                              return (
                                <circle
                                  key={s.linkId || i}
                                  cx="50" cy="50" r="32" fill="transparent"
                                  stroke={s.color} strokeWidth="18"
                                  strokeDasharray={`${dash} ${gap}`}
                                  strokeDashoffset={-offset}
                                  strokeLinecap="round"
                                  className="transition-all"
                                />
                              )
                            })}
                          </svg>
                          <div className="absolute inset-0 flex flex-col items-center justify-center">
                            <p className="text-2xl font-bold">{totalClicks}</p>
                            <p className="text-xs text-muted-foreground">total clicks</p>
                          </div>
                        </div>
                      </div>
                      <div className="space-y-1.5 max-h-40 overflow-auto pr-1">
                        {topLinksWithPct.slice(0, 6).map((l, i) => (
                          <div key={l.linkId || i} className="flex items-center gap-2 text-xs">
                            <span className="h-2.5 w-2.5 rounded-full shrink-0" style={{ background: donutColors[i % donutColors.length] }} />
                            <span className="flex-1 truncate font-medium">{l.title || l.url || '—'}</span>
                            <span className="text-muted-foreground">{l.pct.toFixed(1)}%</span>
                          </div>
                        ))}
                        {topLinksWithPct.length > 6 && <p className="text-xs text-muted-foreground text-center pt-1">+{topLinksWithPct.length - 6} more</p>}
                      </div>
                    </>
                  ) : (
                    <div className="h-48 flex items-center justify-center rounded-lg bg-muted/30">
                      <p className="text-sm text-muted-foreground">No share to show</p>
                    </div>
                  )}
                </div>
              </div>

              {/* Bar chart - clicks per link */}
              <div className="card p-4 space-y-3">
                <h3 className="font-semibold flex items-center gap-2"><BarChart3 className="h-4 w-4 text-primary" /> Clicks per Link</h3>
                {topLinks.length ? (
                  <div className="space-y-2">
                    {topLinksWithPct.map((l, i) => (
                      <div key={l.linkId || i} className="flex items-center gap-3">
                        <span className="w-28 sm:w-40 text-xs font-medium truncate text-right shrink-0" title={l.title || ''}>{l.title || l.url || '—'}</span>
                        <div className="flex-1 h-7 rounded-md bg-muted overflow-hidden relative">
                          <div className="h-full rounded-md flex items-center justify-end pr-2 text-xs font-bold text-white transition-all" style={{ width: `${Math.max(8, (l.clicks / maxClicks) * 100)}%`, background: donutColors[i % donutColors.length] }}>
                            {l.clicks}
                          </div>
                        </div>
                        <span className="w-12 text-xs text-muted-foreground text-right shrink-0">{l.pct.toFixed(1)}%</span>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-sm text-muted-foreground py-4 text-center">No data for bar chart</p>
                )}
              </div>

              {/* Time series */}
              <div className="card p-4 space-y-3">
                <div className="flex items-center justify-between">
                  <h3 className="font-semibold flex items-center gap-2"><Calendar className="h-4 w-4 text-primary" /> Clicks & Views — Last 7 Days</h3>
                  <div className="flex items-center gap-3 text-xs">
                    <span className="flex items-center gap-1.5"><span className="h-2 w-2 rounded-full bg-blue-500" /> Views</span>
                    <span className="flex items-center gap-1.5"><span className="h-2 w-2 rounded-full bg-[hsl(var(--primary))]" /> Clicks</span>
                  </div>
                </div>
                <div className="w-full overflow-x-auto">
                  <svg viewBox={`0 0 ${chartW} ${chartH}`} className="w-full h-[180px] min-w-[520px]" preserveAspectRatio="xMidYMid meet">
                    {/* grid */}
                    {[0, 1, 2, 3].map((g) => {
                      const y = padT + (innerH / 3) * g
                      return <line key={g} x1={padL} x2={chartW - padR} y1={y} y2={y} stroke="hsl(var(--border))" strokeWidth="0.7" strokeDasharray="3 4" opacity={0.6} />
                    })}
                    {/* y labels */}
                    {[maxDaily, Math.round(maxDaily * 0.66), Math.round(maxDaily * 0.33), 0].map((v, i) => {
                      const y = padT + (innerH / 3) * i
                      return <text key={i} x={padL - 6} y={y + 3} textAnchor="end" fontSize="8" fill="hsl(var(--muted-foreground))">{v}</text>
                    })}
                    {/* areas */}
                    <path d={viewsArea} fill="#3b82f6" opacity="0.08" />
                    <path d={clicksArea} fill="hsl(var(--primary))" opacity="0.12" />
                    {/* lines */}
                    <path d={viewsPath} fill="none" stroke="#3b82f6" strokeWidth="2.2" strokeLinejoin="round" strokeLinecap="round" />
                    <path d={clicksPath} fill="none" stroke="hsl(var(--primary))" strokeWidth="2.2" strokeLinejoin="round" strokeLinecap="round" />
                    {/* dots */}
                    {daily.map((d, i) => (
                      <g key={i}>
                        <circle cx={xScale(i)} cy={yScale(d.views)} r="3.5" fill="#3b82f6" stroke="white" strokeWidth="1.2" />
                        <circle cx={xScale(i)} cy={yScale(d.clicks)} r="3.5" fill="hsl(var(--primary))" stroke="white" strokeWidth="1.2" />
                      </g>
                    ))}
                    {/* x labels */}
                    {daily.map((d, i) => (
                      <text key={i} x={xScale(i)} y={chartH - 4} textAnchor="middle" fontSize="8" fill="hsl(var(--muted-foreground))">{d.date.slice(5)}</text>
                    ))}
                  </svg>
                </div>
                {/* mobile fallback table */}
                <div className="grid grid-cols-7 gap-1 text-center lg:hidden">
                  {daily.map((d) => (
                    <div key={d.date} className="rounded bg-muted/50 p-1.5">
                      <p className="text-[10px] text-muted-foreground">{d.date.slice(5)}</p>
                      <p className="text-xs font-bold text-[hsl(var(--primary))]">{d.clicks}</p>
                      <p className="text-[10px] text-blue-600">{d.views}v</p>
                    </div>
                  ))}
                </div>
              </div>

              {/* Detail table */}
              <div className="card overflow-hidden">
                <div className="p-4 pb-2 flex items-center justify-between">
                  <h3 className="font-semibold">Link Details</h3>
                  <span className="text-xs text-muted-foreground">{totalClicks} clicks total</span>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-y bg-muted/40 text-xs text-muted-foreground">
                        <th className="text-left font-medium px-4 py-2">#</th>
                        <th className="text-left font-medium px-4 py-2">Link</th>
                        <th className="text-right font-medium px-4 py-2">Clicks</th>
                        <th className="text-right font-medium px-4 py-2">Share</th>
                        <th className="text-left font-medium px-4 py-2 hidden sm:table-cell">URL</th>
                      </tr>
                    </thead>
                    <tbody>
                      {topLinksWithPct.length ? topLinksWithPct.map((l, i) => (
                        <tr key={l.linkId || i} className="border-b last:border-0 hover:bg-muted/20">
                          <td className="px-4 py-2.5 text-muted-foreground">{i + 1}</td>
                          <td className="px-4 py-2.5">
                            <div className="flex items-center gap-2 min-w-0">
                              <span className="h-7 w-7 rounded-md bg-primary/10 flex items-center justify-center text-primary shrink-0">{iconMap[l.icon || 'link'] || iconMap.default}</span>
                              <span className="font-medium truncate max-w-[160px] sm:max-w-[220px]">{l.title || '—'}</span>
                            </div>
                          </td>
                          <td className="px-4 py-2.5 text-right font-bold">{l.clicks}</td>
                          <td className="px-4 py-2.5 text-right">
                            <span className="inline-flex items-center gap-1.5">
                              <span className="hidden sm:inline-block h-1.5 w-12 rounded-full bg-muted overflow-hidden"><span className="block h-full rounded-full" style={{ width: `${l.pct}%`, background: donutColors[i % donutColors.length] }} /></span>
                              {l.pct.toFixed(1)}%
                            </span>
                          </td>
                          <td className="px-4 py-2.5 hidden sm:table-cell max-w-[200px] truncate text-xs text-muted-foreground">{l.url?.replace(/^https?:\/\//, '') || '—'}</td>
                        </tr>
                      )) : (
                        <tr><td colSpan={5} className="px-4 py-8 text-center text-muted-foreground">No links clicked yet</td></tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )
        })()}

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
                      className="rounded border px-2 py-1 text-xs hover:bg-accent"
                    >
                      Toggle status
                    </button>
                    <button
                      onClick={async () => {
                        await fetch(`/api/admin/users/${u.id}/role`, { method: 'PUT', headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${localStorage.getItem('session_token') || ''}` }, body: JSON.stringify({ role: u.role === 'admin' ? 'user' : 'admin' }) })
                        setAdminUsers((prev) => prev.map((x) => (x.id === u.id ? { ...x, role: x.role === 'admin' ? 'user' : 'admin' } : x)))
                      }}
                      className="rounded border px-2 py-1 text-xs hover:bg-accent"
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
