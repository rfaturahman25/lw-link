const API_BASE = '' // same origin, proxied via vite

async function request<T>(path: string, opts: RequestInit = {}): Promise<{ success: boolean; data?: T; error?: unknown }> {
  const headers: Record<string, string> = { ...(opts.headers as Record<string, string> | undefined) }
  if (!(opts.body instanceof FormData) && opts.body) headers['Content-Type'] = 'application/json'
  const token = localStorage.getItem('session_token')
  if (token) headers['Authorization'] = `Bearer ${token}`
  const res = await fetch(`${API_BASE}${path}`, { ...opts, headers, credentials: 'include' })
  const json = (await res.json().catch(() => ({}))) as { success: boolean; data?: T; error?: { message?: string } }
  if (!res.ok) throw Object.assign(new Error(json?.error?.message || 'Request failed'), { status: res.status, details: json })
  return json as { success: boolean; data?: T; error?: unknown }
}

export const api = {
  login: (identifier: string, password: string) =>
    request<{ user: unknown; token: string }>('/api/auth/login', { method: 'POST', body: JSON.stringify({ identifier, password, username: identifier, email: identifier }) }),
  logout: () => request('/api/auth/logout', { method: 'POST' }),
  session: () => request('/api/auth/session'),
  me: () => request('/api/me'),
  meUpdate: (data: { username?: string; displayName?: string; avatarUrl?: string | null }) => request('/api/me', { method: 'PUT', body: JSON.stringify(data) }),
  profileGet: () => request('/api/profile'),
  profilePut: (data: unknown) => request('/api/profile', { method: 'PUT', body: JSON.stringify(data) }),
  profilePublish: (published: boolean) => request('/api/profile/publish', { method: 'PUT', body: JSON.stringify({ published }) }),
  links: () => request('/api/links'),
  linkCreate: (data: unknown) => request('/api/links', { method: 'POST', body: JSON.stringify(data) }),
  linkUpdate: (id: string, data: unknown) => request(`/api/links/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
  linkDelete: (id: string) => request(`/api/links/${id}`, { method: 'DELETE' }),
  linkToggle: (id: string) => request(`/api/links/${id}/toggle`, { method: 'PUT' }),
  linkReorder: (orderedIds: string[]) => request('/api/links/reorder', { method: 'PUT', body: JSON.stringify({ orderedIds }) }),
  publicProfile: (username: string) => request(`/api/public/${username}`),
  trackView: (username: string) => request(`/api/public/${username}/view`, { method: 'POST' }),
  trackClick: (username: string, linkId: string) => request(`/api/public/${username}/click`, { method: 'POST', body: JSON.stringify({ linkId }) }),
  analytics: () => request('/api/analytics'),
  adminUsers: (q?: string, role?: string, status?: string) => {
    const p = new URLSearchParams()
    if (q) p.set('q', q)
    if (role) p.set('role', role)
    if (status) p.set('status', status)
    const qs = p.toString() ? `?${p.toString()}` : ''
    return request(`/api/admin/users${qs}`)
  },
  adminCreateUser: (data: unknown) => request('/api/admin/users', { method: 'POST', body: JSON.stringify(data) }),
  adminUpdateUserStatus: (id: string, status: string) => request(`/api/admin/users/${id}/status`, { method: 'PUT', body: JSON.stringify({ status }) }),
  adminUpdateUserRole: (id: string, role: string) => request(`/api/admin/users/${id}/role`, { method: 'PUT', body: JSON.stringify({ role }) }),
  adminDeleteUser: (id: string) => request(`/api/admin/users/${id}`, { method: 'DELETE' }),
  adminAuditLogs: (limit?: number) => request(`/api/admin/audit-logs${limit ? `?limit=${limit}` : ''}`),
  sections: () => request('/api/sections'),
  sectionCreate: (title: string) => request('/api/sections', { method: 'POST', body: JSON.stringify({ title }) }),
  sectionUpdate: (id: string, title: string) => request(`/api/sections/${id}`, { method: 'PUT', body: JSON.stringify({ title }) }),
  sectionDelete: (id: string) => request(`/api/sections/${id}`, { method: 'DELETE' }),
  sectionReorder: (orderedIds: string[]) => request('/api/sections/reorder', { method: 'PUT', body: JSON.stringify({ orderedIds }) }),
}

export function setSessionToken(token: string) {
  localStorage.setItem('session_token', token)
}
export function clearSessionToken() {
  localStorage.removeItem('session_token')
}
