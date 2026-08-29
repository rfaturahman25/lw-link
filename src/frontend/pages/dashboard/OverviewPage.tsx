import { useNavigate } from 'react-router-dom'
import { useDashboardContext } from './DashboardLayout'

export default function OverviewPage() {
  const { profile, links, analytics } = useDashboardContext()
  const navigate = useNavigate()
  return (
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
          <button onClick={() => navigate('/dashboard/links')} className="inline-flex items-center justify-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 shadow">
            Manage links
          </button>
          <button onClick={() => navigate('/dashboard/profile')} className="rounded-md border px-4 py-2 text-sm hover:bg-accent">
            Edit profile
          </button>
          <button onClick={() => navigate('/dashboard/analytics')} className="rounded-md border px-4 py-2 text-sm hover:bg-accent">
            View analytics
          </button>
        </div>
      </div>
    </div>
  )
}
