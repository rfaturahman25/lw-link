import { useEffect, useState } from 'react'
import { useAuth } from '../../hooks/useAuth'
import { api } from '../../services/api'
import { ScrollText, AlertTriangle } from 'lucide-react'

type AuditLog = { id: string; actorUsername: string; actorRole: string; action: string; targetType: string; targetId?: string; targetUsername?: string; details?: string; ipAddress?: string; createdAt: string }

function RoleBadge({ role }: { role: string }) {
  const cls = role === 'super_admin' ? 'bg-purple-100 text-purple-700 border-purple-200' : role === 'admin' ? 'bg-blue-100 text-blue-700 border-blue-200' : 'bg-gray-100 text-gray-700 border-gray-200'
  return <span className={`inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-[10px] font-bold tracking-wide ${cls}`}>{role === 'super_admin' ? 'SUPER ADMIN' : role.toUpperCase()}</span>
}

export default function AuditLogsPage() {
  const { user } = useAuth()
  const isSuper = user?.role === 'super_admin'
  const [logs, setLogs] = useState<AuditLog[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!isSuper) {
      setLoading(false)
      return
    }
    api
      .adminAuditLogs(50)
      .then((r) => setLogs((r as { success: boolean; data: AuditLog[] }).data || []))
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [isSuper])

  if (!isSuper) {
    return (
      <div className="card p-8 text-center space-y-2">
        <AlertTriangle className="h-8 w-8 mx-auto text-amber-500" />
        <p className="font-medium">Access denied</p>
        <p className="text-sm text-muted-foreground">Audit logs — SUPER_ADMIN only</p>
      </div>
    )
  }

  if (loading) return <div className="p-8 text-center">Loading audit logs...</div>

  return (
    <div className="space-y-4">
      <h2 className="text-2xl font-bold flex items-center gap-2"><ScrollText className="h-6 w-6" /> Audit Logs</h2>
      <p className="text-sm text-muted-foreground">Sensitive actions — SUPER_ADMIN only • {logs.length} entries</p>
      <div className="card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b bg-muted/40 text-xs text-muted-foreground">
                <th className="text-left font-medium px-4 py-2">Time</th>
                <th className="text-left font-medium px-4 py-2">Actor</th>
                <th className="text-left font-medium px-4 py-2">Action</th>
                <th className="text-left font-medium px-4 py-2">Target</th>
                <th className="text-left font-medium px-4 py-2 hidden md:table-cell">Details</th>
                <th className="text-left font-medium px-4 py-2 hidden lg:table-cell">IP</th>
              </tr>
            </thead>
            <tbody>
              {logs.map((l) => (
                <tr key={l.id} className="border-b last:border-0 hover:bg-muted/20">
                  <td className="px-4 py-2 text-xs text-muted-foreground whitespace-nowrap">{new Date(l.createdAt).toLocaleString()}</td>
                  <td className="px-4 py-2">
                    <div className="flex items-center gap-2">
                      <span className="font-medium text-xs">@{l.actorUsername}</span>
                      <RoleBadge role={l.actorRole} />
                    </div>
                  </td>
                  <td className="px-4 py-2"><span className="inline-flex rounded bg-muted px-2 py-1 text-xs font-mono">{l.action}</span></td>
                  <td className="px-4 py-2 text-xs">
                    <span className="font-medium">{l.targetType}</span> {l.targetUsername ? `@${l.targetUsername}` : l.targetId ? l.targetId.slice(0, 8) : '—'}
                  </td>
                  <td className="px-4 py-2 hidden md:table-cell text-xs text-muted-foreground max-w-[200px] truncate">{l.details || '—'}</td>
                  <td className="px-4 py-2 hidden lg:table-cell text-xs text-muted-foreground">{l.ipAddress || '—'}</td>
                </tr>
              ))}
              {logs.length === 0 && <tr><td colSpan={6} className="px-4 py-8 text-center text-muted-foreground">No audit logs yet</td></tr>}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
