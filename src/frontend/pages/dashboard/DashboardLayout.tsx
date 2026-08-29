import { useEffect, useState } from 'react'
import { NavLink, Outlet, useOutletContext } from 'react-router-dom'
import { useAuth } from '../../hooks/useAuth'
import { api } from '../../services/api'
import { QRCodeSVG } from 'qrcode.react'
import { Link } from 'react-router-dom'
import { BarChart3, Link as LinkIcon, User, Shield, Crown, ScrollText, Users } from 'lucide-react'

type Profile = { bio: string | null; team: string | null; company: string | null; theme: string; backgroundColor: string; textColor: string; buttonStyle: string; published: boolean; avatarUrl?: string | null; displayName?: string }
type LinkItem = { id: string; title: string; url: string; icon: string | null; position: number; enabled: boolean }

type DashboardContextType = {
  profile: Profile | null
  links: LinkItem[]
  analytics: { totalViews: number; totalClicks: number; uniqueVisitors: number; topLinks: Array<{ linkId: string | null; clicks: number; title: string | null; url: string | null; icon: string | null }>; daily: Array<{ date: string; views: number; clicks: number }> } | null
  reload: () => Promise<void>
  setLinks: React.Dispatch<React.SetStateAction<LinkItem[]>>
}

function RoleBadge({ role }: { role: string }) {
  const cls =
    role === 'super_admin'
      ? 'bg-purple-100 text-purple-700 border-purple-200'
      : role === 'admin'
        ? 'bg-blue-100 text-blue-700 border-blue-200'
        : 'bg-gray-100 text-gray-700 border-gray-200'
  return <span className={`inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-[10px] font-bold tracking-wide ${cls}`}>{role === 'super_admin' ? 'SUPER ADMIN' : role.toUpperCase()}</span>
}

export default function DashboardLayout() {
  const { user } = useAuth()
  const isSuper = user?.role === 'super_admin'
  const isAdmin = user?.role === 'admin' || isSuper
  const [profile, setProfile] = useState<Profile | null>(null)
  const [links, setLinks] = useState<LinkItem[]>([])
  const [analytics, setAnalytics] = useState<DashboardContextType['analytics']>(null)
  const [loading, setLoading] = useState(true)

  const load = async () => {
    setLoading(true)
    try {
      const [pRes, lRes, aRes] = await Promise.all([
        api.profileGet() as Promise<{ success: boolean; data: Profile & { user: { displayName: string; avatarUrl: string | null } } }>,
        api.links() as Promise<{ success: boolean; data: LinkItem[] }>,
        api.analytics() as Promise<{ success: boolean; data: DashboardContextType['analytics'] }>,
      ])
      const p = pRes.data
      setProfile(p)
      setLinks(lRes.data || [])
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

  const navClass = ({ isActive }: { isActive: boolean }) => `w-full text-left rounded-md px-3 py-2 text-sm capitalize flex items-center gap-2 ${isActive ? 'bg-primary text-primary-foreground' : 'hover:bg-accent'}`

  return (
    <div className="flex flex-col lg:flex-row gap-6">
      <aside className="lg:w-56 flex-shrink-0 space-y-4">
        <nav className="card p-3 space-y-1">
          <NavLink to="/dashboard" end className={navClass}>
            <BarChart3 className="h-4 w-4" /> Overview
          </NavLink>
          <NavLink to="/dashboard/links" className={navClass}>
            <LinkIcon className="h-4 w-4" /> Links
          </NavLink>
          <NavLink to="/dashboard/profile" className={navClass}>
            <User className="h-4 w-4" /> Profile
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
            <div className="pt-2 mt-2 border-t">
              <p className="px-3 text-[10px] font-bold tracking-wide text-muted-foreground">SUPER ADMIN</p>
            </div>
          )}
          {user && (
            <div className="px-3 py-2 flex items-center gap-2">
              <RoleBadge role={user.role} />
            </div>
          )}
        </nav>
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
        <Outlet context={{ profile, links, analytics, reload: load, setLinks } satisfies DashboardContextType} />
      </main>
    </div>
  )
}

export function useDashboardContext() {
  return useOutletContext<DashboardContextType>()
}
