import { createContext, useContext, useEffect, useState } from 'react'
import { api, setSessionToken, clearSessionToken } from '../services/api'

export type User = { id: string; email: string; username: string; displayName: string; avatarUrl: string | null; role: 'user' | 'admin' }

export function useAuth() {
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

  const login = async (email: string) => {
    const res = (await api.login(email)) as { success: boolean; data: { user: User; token: string } }
    setSessionToken(res.data.token)
    setUser(res.data.user)
    return res.data.user
  }

  const logout = async () => {
    await api.logout().catch(() => {})
    clearSessionToken()
    setUser(null)
  }

  return { user, loading, login, logout, isAdmin: user?.role === 'admin' }
}
