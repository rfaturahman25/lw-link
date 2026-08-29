import { Context, Next } from 'hono'
import type { AuthUser } from './auth'

// Permission constants - Role → Permission → Resource/Action
export const PERMISSIONS = {
  // user
  USER_READ: 'user.read',
  USER_CREATE: 'user.create',
  USER_UPDATE: 'user.update',
  USER_DELETE: 'user.delete',
  USER_DISABLE: 'user.disable',
  // role & system
  ROLE_MANAGE: 'role.manage',
  SYSTEM_MANAGE: 'system.manage',
  // analytics
  ANALYTICS_VIEW: 'analytics.view',
  ANALYTICS_VIEW_ALL: 'analytics.view_all',
  // link
  LINK_READ: 'link.read',
  LINK_CREATE: 'link.create',
  LINK_UPDATE: 'link.update',
  LINK_DELETE: 'link.delete',
  LINK_MANAGE_ALL: 'link.manage_all',
  // profile
  PROFILE_MANAGE: 'profile.manage',
  // audit
  AUDIT_READ: 'audit_log.read',
} as const

export type Permission = typeof PERMISSIONS[keyof typeof PERMISSIONS]

// Role → Permissions
export const ROLE_PERMISSIONS: Record<AuthUser['role'], Permission[]> = {
  super_admin: ['*'] as unknown as Permission[], // all
  admin: [
    PERMISSIONS.USER_READ,
    PERMISSIONS.USER_CREATE,
    PERMISSIONS.USER_UPDATE,
    PERMISSIONS.USER_DISABLE,
    PERMISSIONS.USER_DELETE, // only USER targets - enforced in handler
    PERMISSIONS.ROLE_MANAGE, // can change USER roles (not SUPER_ADMIN) - enforced via canManageRole
    PERMISSIONS.ANALYTICS_VIEW,
    PERMISSIONS.ANALYTICS_VIEW_ALL,
    PERMISSIONS.LINK_MANAGE_ALL,
    PERMISSIONS.LINK_READ,
    PERMISSIONS.LINK_CREATE,
    PERMISSIONS.LINK_UPDATE,
    PERMISSIONS.LINK_DELETE,
    PERMISSIONS.PROFILE_MANAGE,
  ],
  user: [
    PERMISSIONS.PROFILE_MANAGE,
    PERMISSIONS.LINK_READ,
    PERMISSIONS.LINK_CREATE,
    PERMISSIONS.LINK_UPDATE,
    PERMISSIONS.LINK_DELETE,
    PERMISSIONS.ANALYTICS_VIEW,
  ],
}

export function hasPermission(role: AuthUser['role'], permission: Permission): boolean {
  const perms = ROLE_PERMISSIONS[role]
  if (!perms) return false
  if (perms.includes('*' as Permission)) return true
  return perms.includes(permission)
}

// hierarchy for privilege escalation checks
const ROLE_HIERARCHY: Record<AuthUser['role'], number> = {
  user: 1,
  admin: 2,
  super_admin: 3,
}

export function canManageRole(actorRole: AuthUser['role'], targetRole: AuthUser['role'], newRole?: AuthUser['role']): boolean {
  const actorLevel = ROLE_HIERARCHY[actorRole]
  const targetLevel = ROLE_HIERARCHY[targetRole]
  // cannot manage someone with equal or higher level unless super_admin
  if (actorRole === 'super_admin') return true
  if (actorRole === 'admin') {
    // admin cannot touch super_admin at all
    if (targetRole === 'super_admin') return false
    // admin cannot create/promote to super_admin
    if (newRole === 'super_admin') return false
    // admin can only manage users (level 1)
    if (targetLevel >= actorLevel) return false
    // newRole must be lower than actor
    if (newRole && ROLE_HIERARCHY[newRole] >= actorLevel) return false
    return true
  }
  return false // user cannot manage anyone
}

export function requirePermission(...perms: Permission[]) {
  return async (c: Context, next: Next) => {
    const user = c.get('user') as AuthUser | undefined
    if (!user) return c.json({ success: false, error: { code: 'UNAUTHORIZED', message: 'Authentication required' } }, 401)
    const ok = perms.some((p) => hasPermission(user.role, p))
    if (!ok) {
      return c.json({ success: false, error: { code: 'FORBIDDEN', message: `Missing permission: ${perms.join(', ')}` } }, 403)
    }
    await next()
  }
}
