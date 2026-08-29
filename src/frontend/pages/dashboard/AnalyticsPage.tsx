import { useAuth } from '../../hooks/useAuth'
import { useDashboardContext } from './DashboardLayout'
import { Eye, MousePointerClick, Users, TrendingUp, Trophy, BarChart3, PieChart as PieChartIcon, Calendar } from 'lucide-react'

const iconMap: Record<string, React.ReactNode> = {
  // minimal map for analytics - not needed but keep for future
}

export default function AnalyticsPage() {
  const { user } = useAuth()
  const { analytics } = useDashboardContext()
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
  const donutColors = ['hsl(var(--primary))', '#22c55e', '#f59e0b', '#ef4444', '#8b5cf6', '#06b6d4', '#ec4899', '#84cc16', '#f97316', '#6366f1']
  const hasData = totalClicks > 0 || totalViews > 0
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
                      return <circle key={s.linkId || i} cx="50" cy="50" r="32" fill="transparent" stroke={s.color} strokeWidth="18" strokeDasharray={`${dash} ${gap}`} strokeDashoffset={-offset} strokeLinecap="round" className="transition-all" />
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
              </div>
            </>
          ) : (
            <div className="h-48 flex items-center justify-center rounded-lg bg-muted/30">
              <p className="text-sm text-muted-foreground">No share to show</p>
            </div>
          )}
        </div>
      </div>
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
            {[0, 1, 2, 3].map((g) => {
              const y = padT + (innerH / 3) * g
              return <line key={g} x1={padL} x2={chartW - padR} y1={y} y2={y} stroke="hsl(var(--border))" strokeWidth="0.7" strokeDasharray="3 4" opacity={0.6} />
            })}
            {[maxDaily, Math.round(maxDaily * 0.66), Math.round(maxDaily * 0.33), 0].map((v, i) => {
              const y = padT + (innerH / 3) * i
              return <text key={i} x={padL - 6} y={y + 3} textAnchor="end" fontSize="8" fill="hsl(var(--muted-foreground))">{v}</text>
            })}
            <path d={viewsArea} fill="#3b82f6" opacity="0.08" />
            <path d={clicksArea} fill="hsl(var(--primary))" opacity="0.12" />
            <path d={viewsPath} fill="none" stroke="#3b82f6" strokeWidth="2.2" strokeLinejoin="round" strokeLinecap="round" />
            <path d={clicksPath} fill="none" stroke="hsl(var(--primary))" strokeWidth="2.2" strokeLinejoin="round" strokeLinecap="round" />
            {daily.map((d, i) => (
              <g key={i}>
                <circle cx={xScale(i)} cy={yScale(d.views)} r="3.5" fill="#3b82f6" stroke="white" strokeWidth="1.2" />
                <circle cx={xScale(i)} cy={yScale(d.clicks)} r="3.5" fill="hsl(var(--primary))" stroke="white" strokeWidth="1.2" />
              </g>
            ))}
            {daily.map((d, i) => (
              <text key={i} x={xScale(i)} y={chartH - 4} textAnchor="middle" fontSize="8" fill="hsl(var(--muted-foreground))">{d.date.slice(5)}</text>
            ))}
          </svg>
        </div>
      </div>
    </div>
  )
}
