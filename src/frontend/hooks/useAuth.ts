import React, { createContext, useContext, useEffect, useState, ReactNode } from 'react'
import { api, setSessionToken, clearSessionToken } from '../services/api'

export type User = { id: string; email: string; username: string; displayName: string; avatarUrl: string | null; role: 'user' | 'admin' | 'super_admin' }

type AuthContextType = {
  user: User | null
  loading: boolean
  login: (identifier: string, password: string) => Promise<User>
  logout: () => Promise<void>
  isAdmin: boolean
  isSuperAdmin: boolean
  hasPermission: (perm: string) => boolean
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    api
      .session()
      .then((r: unknown) => {
        const data = r as { success: boolean; data: User }
        if (data.success) setUser(data.data)
      })
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [])

  const login = async (identifier: string, password: string) => {
    const res = (await api.login(identifier, password)) as { success: boolean; data: { user: User; token: string } }
    setSessionToken(res.data.token)
    setUser(res.data.user)
    return res.data.user
  }

  const logout = async () => {
    await api.logout().catch(() => {})
    clearSessionToken()
    setUser(null)
  }

  const hasPermission = (perm: string) => {
    if (!user) return false
    if (user.role === 'super_admin') return true
    const map: Record<string, string[]> = {
      user: ['profile.manage', 'link.read', 'link.create', 'link.update', 'link.delete', 'analytics.view'],
      admin: ['user.read', 'user.create', 'user.update', 'user.disable', 'user.delete', 'role.manage', 'analytics.view', 'analytics.view_all', 'link.manage_all', 'profile.manage', 'link.read', 'link.create', 'link.update', 'link.delete'],
    }
    return map[user.role]?.includes(perm) || false
  }

  return React.createElement(AuthContext.Provider, { value: { user, loading, login, logout, isAdmin: user?.role === 'admin' || user?.role === 'super_admin', isSuperAdmin: user?.role === 'super_admin', hasPermission } }, children)
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used within AuthProvider')
  return ctx
}
