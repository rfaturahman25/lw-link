import { useEffect, useState } from 'react'
import { useAuth } from '../../hooks/useAuth'
import { api } from '../../services/api'
import { Users, Search, Filter, Plus, Shield, Crown, Trash2, Ban, CheckCircle } from 'lucide-react'

type AdminUser = { id: string; username: string; email: string; role: string; status: string; displayName?: string; lastLoginAt?: string | null; createdAt?: string; updatedAt?: string }

function RoleBadge({ role }: { role: string }) {
  const cls = role === 'super_admin' ? 'bg-purple-100 text-purple-700 border-purple-200' : role === 'admin' ? 'bg-blue-100 text-blue-700 border-blue-200' : 'bg-gray-100 text-gray-700 border-gray-200'
  return <span className={`inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-[10px] font-bold tracking-wide ${cls}`}>{role === 'super_admin' ? 'SUPER ADMIN' : role.toUpperCase()}</span>
}

export default function UsersPage() {
  const { user } = useAuth()
  const isSuper = user?.role === 'super_admin'
  const [adminUsers, setAdminUsers] = useState<AdminUser[]>([])
  const [search, setSearch] = useState('')
  const [roleFilter, setRoleFilter] = useState<'all' | 'user' | 'admin' | 'super_admin'>('all')
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'disabled'>('all')
  const [createForm, setCreateForm] = useState({ email: '', username: '', displayName: '', password: '', role: 'user' as 'user' | 'admin' | 'super_admin' })
  const [creating, setCreating] = useState(false)

  const loadUsers = async () => {
    try {
      const r = (await api.adminUsers(search || undefined, roleFilter !== 'all' ? roleFilter : undefined, statusFilter !== 'all' ? statusFilter : undefined)) as { success: boolean; data: AdminUser[] }
      setAdminUsers(r.data || [])
    } catch (_e) {
      // ignore
    }
  }

  useEffect(() => {
    loadUsers()
  }, [roleFilter, statusFilter])

  useEffect(() => {
    const t = setTimeout(loadUsers, 300)
    return () => clearTimeout(t)
  }, [search])

  const handleCreateUser = async (e: React.FormEvent) => {
    e.preventDefault()
    if (createForm.role === 'super_admin' && !isSuper) {
      alert('Only SUPER_ADMIN can create super_admin')
      return
    }
    if (createForm.role === 'admin' || createForm.role === 'super_admin') {
      if (!confirm(`Create ${createForm.role.toUpperCase()}? This grants elevated permissions.`)) return
    }
    setCreating(true)
    try {
      await api.adminCreateUser(createForm)
      setCreateForm({ email: '', username: '', displayName: '', password: '', role: 'user' })
      await loadUsers()
      alert('User created')
    } catch (err: unknown) {
      alert(err instanceof Error ? err.message : 'Create failed')
    } finally {
      setCreating(false)
    }
  }

  const handleRoleChange = async (u: AdminUser, newRole: string) => {
    if (u.id === user?.id) {
      alert('Cannot change own role')
      return
    }
    if (newRole === 'super_admin' && !isSuper) {
      alert('Only SUPER_ADMIN can assign super_admin')
      return
    }
    if (u.role === 'super_admin' && !isSuper) {
      alert('Only SUPER_ADMIN can manage super_admin')
      return
    }
    if (!confirm(`Change ${u.username} from ${u.role.toUpperCase()} → ${newRole.toUpperCase()}? This changes privileges.`)) return
    try {
      await api.adminUpdateUserRole(u.id, newRole)
      await loadUsers()
    } catch (err: unknown) {
      alert(err instanceof Error ? err.message : 'Role change failed')
    }
  }

  const handleStatus = async (u: AdminUser) => {
    if (u.id === user?.id) {
      alert('Cannot change own status')
      return
    }
    if (u.role === 'super_admin' && !isSuper) {
      alert('Cannot disable SUPER_ADMIN')
      return
    }
    if (!confirm(`${u.status === 'active' ? 'Disable' : 'Enable'} @${u.username}?`)) return
    try {
      await api.adminUpdateUserStatus(u.id, u.status === 'active' ? 'disabled' : 'active')
      await loadUsers()
    } catch (err: unknown) {
      alert(err instanceof Error ? err.message : 'Status change failed')
    }
  }

  const handleDelete = async (u: AdminUser) => {
    if (u.id === user?.id) {
      alert('Cannot delete yourself')
      return
    }
    if (u.role === 'super_admin' && !isSuper) {
      alert('Cannot delete SUPER_ADMIN')
      return
    }
    if (!confirm(`Delete @${u.username} (${u.role})? This deletes profile & links and cannot be undone.`)) return
    if (!confirm(`Confirm again: DELETE @${u.username}?`)) return
    try {
      await api.adminDeleteUser(u.id)
      await loadUsers()
    } catch (err: unknown) {
      alert(err instanceof Error ? err.message : 'Delete failed')
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h2 className="text-2xl font-bold flex items-center gap-2"><Users className="h-6 w-6" /> User Management</h2>
          <p className="text-sm text-muted-foreground">Manage users • {user?.role === 'super_admin' ? 'Super Admin can manage all' : 'Admin can manage users only'}</p>
        </div>
        <div className="flex items-center gap-2">
          <RoleBadge role={user?.role || 'user'} />
          <span className="text-xs text-muted-foreground">{adminUsers.length} users</span>
        </div>
      </div>

      <div className="card p-4 space-y-3">
        <h3 className="font-semibold flex items-center gap-2"><Plus className="h-4 w-4" /> Create User</h3>
        <form onSubmit={handleCreateUser} className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <input value={createForm.email} onChange={(e) => setCreateForm({ ...createForm, email: e.target.value })} placeholder="email@lensawaktu.id" className="input" type="email" required />
          <input value={createForm.username} onChange={(e) => setCreateForm({ ...createForm, username: e.target.value })} placeholder="username (a-z0-9_)" className="input" required />
          <input value={createForm.displayName} onChange={(e) => setCreateForm({ ...createForm, displayName: e.target.value })} placeholder="Display name" className="input" required />
          <input value={createForm.password} onChange={(e) => setCreateForm({ ...createForm, password: e.target.value })} placeholder="password (min 6)" className="input" type="password" required />
          <select value={createForm.role} onChange={(e) => setCreateForm({ ...createForm, role: e.target.value as never })} className="input">
            <option value="user">USER</option>
            <option value="admin">ADMIN</option>
            {isSuper && <option value="super_admin">SUPER_ADMIN</option>}
          </select>
          <button type="submit" disabled={creating} className="inline-flex items-center justify-center gap-2 rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 disabled:opacity-50 shadow md:col-span-2">
            {creating ? 'Creating...' : <><Plus className="h-4 w-4" /> Create {createForm.role.toUpperCase()}</>}
          </button>
        </form>
      </div>

      <div className="card p-4 space-y-3">
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search name/email/username" className="input pl-10" />
          </div>
          <div className="flex gap-2">
            <select value={roleFilter} onChange={(e) => setRoleFilter(e.target.value as never)} className="input">
              <option value="all">All roles</option>
              <option value="super_admin">Super Admin</option>
              <option value="admin">Admin</option>
              <option value="user">User</option>
            </select>
            <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value as never)} className="input">
              <option value="all">All status</option>
              <option value="active">Active</option>
              <option value="disabled">Disabled</option>
            </select>
          </div>
        </div>
        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          <Filter className="h-4 w-4" /> Filters: {roleFilter} / {statusFilter} {search && `• "${search}"`}
        </div>
      </div>

      <div className="card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b bg-muted/40 text-xs text-muted-foreground">
                <th className="text-left font-medium px-4 py-3">Name</th>
                <th className="text-left font-medium px-4 py-3 hidden md:table-cell">Email</th>
                <th className="text-left font-medium px-4 py-3">Role</th>
                <th className="text-left font-medium px-4 py-3">Status</th>
                <th className="text-left font-medium px-4 py-3 hidden lg:table-cell">Created</th>
                <th className="text-left font-medium px-4 py-3 hidden lg:table-cell">Last Login</th>
                <th className="text-right font-medium px-4 py-3">Actions</th>
              </tr>
            </thead>
            <tbody>
              {adminUsers.map((u) => (
                <tr key={u.id} className="border-b last:border-0 hover:bg-muted/20">
                  <td className="px-4 py-3">
                    <div className="min-w-0">
                      <p className="font-medium truncate flex items-center gap-2">
                        @{u.username}
                        {u.id === user?.id && <span className="text-[10px] bg-primary text-primary-foreground px-1.5 py-0.5 rounded">YOU</span>}
                      </p>
                      <p className="text-xs text-muted-foreground truncate">{u.email}</p>
                    </div>
                  </td>
                  <td className="px-4 py-3 hidden md:table-cell text-xs truncate max-w-[180px]">{u.email}</td>
                  <td className="px-4 py-3"><RoleBadge role={u.role} /></td>
                  <td className="px-4 py-3">
                    <span className={`inline-flex items-center gap-1 rounded-full px-2 py-1 text-xs font-medium ${u.status === 'active' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                      {u.status === 'active' ? <CheckCircle className="h-3 w-3" /> : <Ban className="h-3 w-3" />} {u.status}
                    </span>
                  </td>
                  <td className="px-4 py-3 hidden lg:table-cell text-xs text-muted-foreground">{u.createdAt ? new Date(u.createdAt).toLocaleDateString() : '—'}</td>
                  <td className="px-4 py-3 hidden lg:table-cell text-xs text-muted-foreground">{u.lastLoginAt ? new Date(u.lastLoginAt).toLocaleDateString() : 'never'}</td>
                  <td className="px-4 py-3">
                    <div className="flex justify-end gap-1 flex-wrap">
                      <select value={u.role} onChange={(e) => handleRoleChange(u, e.target.value)} disabled={u.id === user?.id || (u.role === 'super_admin' && !isSuper)} className="rounded border px-2 py-1 text-xs bg-background disabled:opacity-50">
                        <option value="user">USER</option>
                        <option value="admin">ADMIN</option>
                        {isSuper && <option value="super_admin">SUPER_ADMIN</option>}
                        {!isSuper && u.role === 'super_admin' && <option value="super_admin">SUPER_ADMIN</option>}
                      </select>
                      <button onClick={() => handleStatus(u)} disabled={u.id === user?.id || (u.role === 'super_admin' && !isSuper)} className="rounded border px-2 py-1 text-xs hover:bg-accent disabled:opacity-50 flex items-center gap-1">
                        {u.status === 'active' ? <Ban className="h-3 w-3" /> : <CheckCircle className="h-3 w-3" />} {u.status === 'active' ? 'Disable' : 'Enable'}
                      </button>
                      <button onClick={() => handleDelete(u)} disabled={u.id === user?.id || (u.role === 'super_admin' && !isSuper)} className="rounded bg-red-50 px-2 py-1 text-xs text-red-700 hover:bg-red-100 disabled:opacity-50 flex items-center gap-1">
                        <Trash2 className="h-3 w-3" /> Delete
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
              {adminUsers.length === 0 && <tr><td colSpan={7} className="px-4 py-8 text-center text-muted-foreground">No users found</td></tr>}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
