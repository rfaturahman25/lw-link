import { useEffect, useState } from 'react'
import { NavLink, Outlet, useOutletContext, useNavigate } from 'react-router-dom'
import { useAuth } from '../../hooks/useAuth'
import { api } from '../../services/api'
import { QRCodeSVG } from 'qrcode.react'
import { Link } from 'react-router-dom'
import {
  BarChart3,
  Palette,
  ScrollText,
  Users,
  LogOut,
} from 'lucide-react'

type Profile = {
  bio: string | null
  theme: string
  backgroundColor: string
  textColor: string
  buttonStyle: string
  published: boolean
  avatarUrl?: string | null
  displayName?: string
  headerStyle?: string | null
  bannerUrl?: string | null
  colorPalette?: string | null
  logoUrl?: string | null
  fontFamily?: string | null
  themeConfig?: unknown
  user?: { displayName: string; avatarUrl: string | null }
}
type LinkItem = {
  id: string
  title: string
  url: string
  icon: string | null
  type?: string | null
  metadata?: string | null
  showUrl?: boolean | null
  bold?: boolean | null
  thumbnail?: string | null
  position: number
  enabled: boolean
  sectionId: string | null
}
type Section = { id: string; title: string; position: number }
type Social = { platform: string; value: string; enabled: boolean; position: number }

type DashboardContextType = {
  profile: Profile | null
  links: LinkItem[]
  sections: Section[]
  socials: Social[]
  analytics: {
    totalViews: number
    totalClicks: number
    totalSocialClicks: number
    uniqueVisitors: number
    topLinks: Array<{
      linkId: string | null
      clicks: number
      title: string | null
      url: string | null
      icon: string | null
    }>
    topSocials: Array<{ platform: string | null; clicks: number }>
    daily: Array<{ date: string; views: number; clicks: number }>
  } | null
  reload: () => Promise<void>
  setLinks: React.Dispatch<React.SetStateAction<LinkItem[]>>
  setSections: React.Dispatch<React.SetStateAction<Section[]>>
}

function RoleBadge({ role }: { role: string }) {
  const cls =
    role === 'super_admin'
      ? 'bg-purple-100 text-purple-700 border-purple-200'
      : role === 'admin'
        ? 'bg-blue-100 text-blue-700 border-blue-200'
        : 'bg-gray-100 text-gray-700 border-gray-200'
  return (
    <span
      className={`inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-[10px] font-bold tracking-wide ${cls}`}
    >
      {role === 'super_admin' ? 'SUPER ADMIN' : role.toUpperCase()}
    </span>
  )
}

export default function DashboardLayout() {
  const { user, logout } = useAuth()
  const navigate = useNavigate()
  const isSuper = user?.role === 'super_admin'
  const isAdmin = user?.role === 'admin' || isSuper

  const handleLogout = async () => {
    await logout()
    navigate('/login')
  }
  const [profile, setProfile] = useState<Profile | null>(null)
  const [links, setLinks] = useState<LinkItem[]>([])
  const [sections, setSections] = useState<Section[]>([])
  const [socials, setSocials] = useState<Social[]>([])
  const [analytics, setAnalytics] = useState<DashboardContextType['analytics']>(null)
  const [loading, setLoading] = useState(true)

  const load = async () => {
    // Only the first load shows the full-screen loading state; later reloads are silent
    // so actions like toggling a link don't flash the whole dashboard.
    try {
      const [pRes, lRes, sRes, aRes, soRes] = await Promise.all([
        api.profileGet() as Promise<{
          success: boolean
          data: Profile & { user: { displayName: string; avatarUrl: string | null } }
        }>,
        api.links() as Promise<{ success: boolean; data: LinkItem[] }>,
        api.sections() as Promise<{ success: boolean; data: Section[] }>,
        api.analytics() as Promise<{ success: boolean; data: DashboardContextType['analytics'] }>,
        api.profileSocials() as Promise<{
          success: boolean
          data: Array<{ platform: string; value: string; enabled?: boolean; position?: number }>
        }>,
      ])
      const p = pRes.data
      setProfile(p)
      setLinks(lRes.data || [])
      setSections(
        ((sRes as unknown as { data: Section[] }).data || []).sort(
          (a, b) => a.position - b.position
        )
      )
      setSocials(
        (soRes.data || [])
          .map((s) => ({
            platform: s.platform,
            value: s.value,
            enabled: s.enabled !== false,
            position: s.position ?? 0,
          }))
          .sort((a, b) => a.position - b.position)
      )
      setAnalytics(aRes.data || null)
    } catch {
      // ignore
    }
    setLoading(false)
  }

  useEffect(() => {
    load()
  }, [])

  const publicUrl = user ? `${window.location.origin}/@${user.username}` : ''

  if (loading) return <div className="p-8 text-center">Loading dashboard...</div>

  const navClass = ({ isActive }: { isActive: boolean }) =>
    `flex w-full items-center gap-2 rounded-xl px-3 py-2.5 text-left text-sm font-medium transition-colors ${isActive ? 'bg-primary text-primary-foreground' : 'text-foreground/75 hover:bg-accent'}`

  return (
    <div className="dashboard-theme -mx-4 -my-8 min-h-[calc(100vh-8rem)] px-4 py-6 sm:px-6 sm:py-8 lg:px-8">
      <div className="mx-auto flex w-full max-w-7xl flex-col gap-6 lg:flex-row">
        <aside className="shrink-0 space-y-4 lg:w-64">
          <nav className="card grid grid-cols-2 gap-1 rounded-2xl p-2 lg:flex lg:flex-col">
            <NavLink to="/dashboard" end className={navClass}>
              <BarChart3 className="h-4 w-4" /> Overview
            </NavLink>
            <NavLink to="/dashboard/profile" className={navClass}>
              <Palette className="h-4 w-4" /> Builder
            </NavLink>
            <NavLink to="/dashboard/analytics" className={navClass}>
              <BarChart3 className="h-4 w-4" /> Analytics
            </NavLink>
            {isAdmin && (
              <NavLink to="/dashboard/users" className={navClass}>
                <Users className="h-4 w-4" /> Users
              </NavLink>
            )}
            {isSuper && (
              <NavLink to="/dashboard/audit-logs" className={navClass}>
                <ScrollText className="h-4 w-4" /> Audit Logs
              </NavLink>
            )}
            {isSuper && (
              <div className="col-span-2 mt-2 border-t pt-2 lg:w-full">
                <p className="px-3 text-[10px] font-bold tracking-wide text-muted-foreground">
                  SUPER ADMIN
                </p>
              </div>
            )}
            {user && (
              <div className="col-span-2 flex items-center gap-2 px-3 py-2 lg:w-full">
                <RoleBadge role={user.role} />
              </div>
            )}
            <button
              onClick={handleLogout}
              className="col-span-2 flex w-full items-center gap-2 rounded-xl border px-3 py-2.5 text-left text-sm font-medium hover:bg-accent lg:mt-1"
            >
              <LogOut className="h-4 w-4" /> Logout
            </button>
          </nav>
          <div className="card space-y-3 rounded-2xl p-4 text-center">
            <p className="font-semibold tracking-tight">Your profile</p>
            <p className="text-xs break-all text-muted-foreground">{publicUrl}</p>
            {profile?.published ? (
              <span className="inline-block rounded bg-green-100 px-2 py-1 text-xs text-green-700">
                Published
              </span>
            ) : (
              <span className="inline-block rounded bg-yellow-100 px-2 py-1 text-xs">Draft</span>
            )}
            <div className="flex justify-center rounded-xl bg-white p-3">
              <QRCodeSVG value={publicUrl} size={100} />
            </div>
            <Link
              to={`/@${user?.username}`}
              target="_blank"
              className="text-xs text-primary hover:underline block"
            >
              View public profile
            </Link>
          </div>
        </aside>

        <main className="min-w-0 flex-1 space-y-6">
          <Outlet
            context={
              {
                profile,
                links,
                sections,
                socials,
                analytics,
                reload: load,
                setLinks,
                setSections,
              } satisfies DashboardContextType
            }
          />
        </main>
      </div>
    </div>
  )
}

export function useDashboardContext() {
  return useOutletContext<DashboardContextType>()
}
