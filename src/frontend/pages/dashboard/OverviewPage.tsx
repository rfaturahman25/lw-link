import { useNavigate } from 'react-router-dom'
import { BarChart3, Eye, Link2, MousePointerClick, Sparkles } from 'lucide-react'
import { useDashboardContext } from './DashboardLayout'

export default function OverviewPage() {
  const { profile, links, analytics } = useDashboardContext()
  const navigate = useNavigate()
  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.16em] text-primary">
            Dashboard
          </p>
          <h1 className="mt-1 text-3xl font-bold tracking-tight">Overview</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            A clear view of your public profile and link activity.
          </p>
        </div>
        <span
          className={`inline-flex items-center rounded-full px-3 py-1.5 text-xs font-semibold ${profile?.published ? 'bg-primary/15 text-primary' : 'bg-muted text-muted-foreground'}`}
        >
          {profile?.published ? 'Published profile' : 'Draft profile'}
        </span>
      </div>
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="card rounded-2xl p-4 sm:p-5">
          <div className="flex items-start justify-between gap-3">
            <p className="text-sm text-muted-foreground">Links</p>
            <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary/10 text-primary">
              <Link2 className="h-4 w-4" />
            </span>
          </div>
          <p className="mt-5 text-3xl font-bold tracking-tight">{links.length}</p>
          <p className="mt-1 text-xs text-muted-foreground">links in your profile</p>
        </div>
        <div className="card rounded-2xl p-4 sm:p-5">
          <div className="flex items-start justify-between gap-3">
            <p className="text-sm text-muted-foreground">Views</p>
            <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary/10 text-primary">
              <Eye className="h-4 w-4" />
            </span>
          </div>
          <p className="mt-5 text-3xl font-bold tracking-tight">{analytics?.totalViews ?? 0}</p>
          <p className="mt-1 text-xs text-muted-foreground">profile visits recorded</p>
        </div>
        <div className="card rounded-2xl p-4 sm:p-5">
          <div className="flex items-start justify-between gap-3">
            <p className="text-sm text-muted-foreground">Clicks</p>
            <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary/10 text-primary">
              <MousePointerClick className="h-4 w-4" />
            </span>
          </div>
          <p className="mt-5 text-3xl font-bold tracking-tight">{analytics?.totalClicks ?? 0}</p>
          <p className="mt-1 text-xs text-muted-foreground">link interactions recorded</p>
        </div>
        <div className="rounded-2xl bg-primary p-4 text-primary-foreground sm:p-5">
          <div className="flex items-start justify-between gap-3">
            <p className="text-sm text-primary-foreground/70">Status</p>
            <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary-foreground/10">
              <Sparkles className="h-4 w-4" />
            </span>
          </div>
          <p className="mt-5 text-2xl font-bold tracking-tight">
            {profile?.published ? 'Published' : 'Draft'}
          </p>
          <p className="mt-1 text-xs text-primary-foreground/70">
            {profile?.published ? 'visible to visitors' : 'not publicly visible'}
          </p>
        </div>
      </div>
      <div className="card rounded-2xl p-5 sm:p-6">
        <div className="flex items-center gap-2">
          <BarChart3 className="h-4 w-4 text-primary" />
          <h3 className="font-semibold">Quick actions</h3>
        </div>
        <div className="mt-4 flex flex-wrap gap-2">
          <button
            onClick={() => navigate('/dashboard/links')}
            className="inline-flex items-center justify-center rounded-xl bg-primary px-4 py-2.5 text-sm font-medium text-primary-foreground hover:bg-primary/90"
          >
            Manage links
          </button>
          <button
            onClick={() => navigate('/dashboard/profile')}
            className="rounded-xl border px-4 py-2.5 text-sm font-medium hover:bg-accent"
          >
            Design profile
          </button>
          <button
            onClick={() => navigate('/dashboard/analytics')}
            className="rounded-xl border px-4 py-2.5 text-sm font-medium hover:bg-accent"
          >
            View analytics
          </button>
        </div>
      </div>
    </div>
  )
}
