import { Hono } from 'hono'
import { eq, like, sql, desc, and, or } from 'drizzle-orm'
import { z } from 'zod'
import { zValidator } from '@hono/zod-validator'
import { createDb } from '../../db/client'
import { users, profiles, auditLogs } from '../../db/schema'
import { authMiddleware } from '../../middleware/auth'
import { requirePermission, PERMISSIONS, canManageRole } from '../../middleware/rbac'
import { hashPassword } from '../../utils/security'
import { createAuditLog } from '../../services/audit'
import type { AuthUser } from '../../middleware/auth'

type Bindings = { DB: D1Database }

const adminRoutes = new Hono<{ Bindings: Bindings; Variables: { user: AuthUser } }>()
adminRoutes.use('*', authMiddleware(true))

// Helper to get client IP
function getIP(c: { req: { header: (n: string) => string | undefined } }): string {
  return c.req.header('cf-connecting-ip') || c.req.header('x-forwarded-for')?.split(',')[0] || 'unknown'
}

// Schemas
const createUserSchema = z.object({
  email: z.string().email(),
  username: z.string().min(3).max(30).regex(/^[a-z0-9_]+$/, 'Only lowercase alphanumeric and underscore'),
  displayName: z.string().min(1).max(100),
  password: z.string().min(6).max(100),
  role: z.enum(['user', 'admin', 'super_admin']).default('user'),
  team: z.string().max(100).optional(),
  company: z.string().max(100).optional(),
})

const updateRoleSchema = z.object({
  role: z.enum(['user', 'admin', 'super_admin']),
})

// GET /users - list with filters
adminRoutes.get('/users', requirePermission(PERMISSIONS.USER_READ), async (c) => {
  const q = c.req.query('q') || ''
  const role = c.req.query('role') || ''
  const status = c.req.query('status') || ''
  const db = createDb(c.env.DB)

  const conditions: ReturnType<typeof eq>[] = []
  // we build where clause manually via sql
  let whereClause: ReturnType<typeof sql> | undefined
  const filters: string[] = []
  const params: Record<string, unknown> = {}

  // Use drizzle query builder with dynamic where
  // Simpler: fetch all and filter in JS for now (50 limit) - but do SQL for efficiency
  // Build query with and()
  const wheres: ReturnType<typeof eq>[] = []
  // We'll use SQL template for flexibility
  const rows = await db.select().from(users).orderBy(desc(users.createdAt)).limit(100)
  let filtered = rows
  if (q) {
    const lq = q.toLowerCase()
    filtered = filtered.filter((u) => u.username.toLowerCase().includes(lq) || u.email.toLowerCase().includes(lq) || u.displayName.toLowerCase().includes(lq))
  }
  if (role && ['user', 'admin', 'super_admin'].includes(role)) {
    filtered = filtered.filter((u) => u.role === role)
  }
  if (status && ['active', 'disabled'].includes(status)) {
    filtered = filtered.filter((u) => u.status === status)
  }
  // select safe columns (exclude password_hash)
  const safe = filtered.map((u) => ({
    id: u.id,
    email: u.email,
    username: u.username,
    displayName: u.displayName,
    avatarUrl: u.avatarUrl,
    role: u.role,
    status: u.status,
    lastLoginAt: u.lastLoginAt,
    createdAt: u.createdAt,
    updatedAt: u.updatedAt,
  }))
  return c.json({ success: true, data: safe })
})

// POST /users - create user
adminRoutes.post('/users', requirePermission(PERMISSIONS.USER_CREATE), zValidator('json', createUserSchema), async (c) => {
  const actor = c.get('user') as AuthUser
  const body = c.req.valid('json')
  const db = createDb(c.env.DB)

  // RBAC: ADMIN cannot create SUPER_ADMIN
  if (!canManageRole(actor.role, 'user' as AuthUser['role'], body.role as AuthUser['role'])) {
    return c.json({ success: false, error: { code: 'FORBIDDEN', message: 'Cannot create user with this role' } }, 403)
  }

  // check duplicate
  const dupEmail = await db.select().from(users).where(eq(users.email, body.email.toLowerCase())).limit(1)
  if (dupEmail.length) return c.json({ success: false, error: { code: 'EMAIL_TAKEN', message: 'Email already taken' } }, 409)
  const dupUser = await db.select().from(users).where(eq(users.username, body.username.toLowerCase())).limit(1)
  if (dupUser.length) return c.json({ success: false, error: { code: 'USERNAME_TAKEN', message: 'Username already taken' } }, 409)

  const passwordHash = await hashPassword(body.password)
  const id = crypto.randomUUID()
  await db.insert(users).values({
    id,
    email: body.email.toLowerCase(),
    username: body.username.toLowerCase(),
    displayName: body.displayName,
    passwordHash,
    role: body.role as AuthUser['role'],
    status: 'active',
  })
  // create profile
  try {
    await db.insert(profiles).values({ userId: id, team: body.team || null, company: body.company || null, published: false })
  } catch (_e) {
    // ignore
  }

  await createAuditLog(c.env.DB, {
    actorId: actor.id,
    actorUsername: actor.username,
    actorRole: actor.role,
    action: 'CREATE_USER',
    targetType: 'user',
    targetId: id,
    targetUsername: body.username,
    details: `Created ${body.role} ${body.email}`,
    ipAddress: getIP(c),
    userAgent: c.req.header('user-agent'),
  })

  const fresh = await db.select().from(users).where(eq(users.id, id)).limit(1)
  return c.json({ success: true, data: fresh[0] }, 201)
})

// PUT /users/:id/status - disable/enable
adminRoutes.put('/users/:id/status', requirePermission(PERMISSIONS.USER_DISABLE), async (c) => {
  const actor = c.get('user') as AuthUser
  const id = c.req.param('id')
  const { status } = (await c.req.json().catch(() => ({}))) as { status?: string }
  if (!['active', 'disabled'].includes(status || '')) return c.json({ success: false, error: { code: 'BAD_STATUS' } }, 400)
  if (actor.id === id) return c.json({ success: false, error: { code: 'SELF_DISABLE', message: 'Cannot change own status' } }, 400)

  const db = createDb(c.env.DB)
  const targetRows = await db.select().from(users).where(eq(users.id, id)).limit(1)
  if (!targetRows.length) return c.json({ success: false, error: { code: 'NOT_FOUND' } }, 404)
  const target = targetRows[0] as AuthUser & { id: string }
  if (!canManageRole(actor.role, target.role as AuthUser['role'])) {
    return c.json({ success: false, error: { code: 'FORBIDDEN', message: 'Cannot manage this user' } }, 403)
  }

  await db.update(users).set({ status: status as 'active' | 'disabled', updatedAt: new Date().toISOString() }).where(eq(users.id, id))

  await createAuditLog(c.env.DB, {
    actorId: actor.id,
    actorUsername: actor.username,
    actorRole: actor.role,
    action: status === 'disabled' ? 'DISABLE_USER' : 'ENABLE_USER',
    targetType: 'user',
    targetId: id,
    targetUsername: target.username,
    details: `Status ${target.status} → ${status}`,
    ipAddress: getIP(c),
    userAgent: c.req.header('user-agent'),
  })

  return c.json({ success: true })
})

// PUT /users/:id/role - change role
adminRoutes.put('/users/:id/role', requirePermission(PERMISSIONS.ROLE_MANAGE), zValidator('json', updateRoleSchema), async (c) => {
  const actor = c.get('user') as AuthUser
  const id = c.req.param('id')
  const { role } = c.req.valid('json')
  if (actor.id === id) return c.json({ success: false, error: { code: 'SELF_ROLE', message: 'Cannot change own role' } }, 400)

  const db = createDb(c.env.DB)
  const targetRows = await db.select().from(users).where(eq(users.id, id)).limit(1)
  if (!targetRows.length) return c.json({ success: false, error: { code: 'NOT_FOUND' } }, 404)
  const target = targetRows[0] as AuthUser & { id: string }

  if (!canManageRole(actor.role, target.role as AuthUser['role'], role as AuthUser['role'])) {
    return c.json({ success: false, error: { code: 'FORBIDDEN', message: 'Cannot assign this role' } }, 403)
  }

  await db.update(users).set({ role: role as AuthUser['role'], updatedAt: new Date().toISOString() }).where(eq(users.id, id))

  await createAuditLog(c.env.DB, {
    actorId: actor.id,
    actorUsername: actor.username,
    actorRole: actor.role,
    action: 'CHANGE_ROLE',
    targetType: 'user',
    targetId: id,
    targetUsername: target.username,
    details: `${target.role} → ${role}`,
    ipAddress: getIP(c),
    userAgent: c.req.header('user-agent'),
  })

  return c.json({ success: true })
})

// DELETE /users/:id
adminRoutes.delete('/users/:id', requirePermission(PERMISSIONS.USER_DELETE), async (c) => {
  const actor = c.get('user') as AuthUser
  const id = c.req.param('id')
  if (actor.id === id) return c.json({ success: false, error: { code: 'SELF_DELETE', message: 'Cannot delete yourself' } }, 400)

  const db = createDb(c.env.DB)
  const targetRows = await db.select().from(users).where(eq(users.id, id)).limit(1)
  if (!targetRows.length) return c.json({ success: false, error: { code: 'NOT_FOUND' } }, 404)
  const target = targetRows[0] as AuthUser & { id: string }
  if (!canManageRole(actor.role, target.role as AuthUser['role'])) {
    return c.json({ success: false, error: { code: 'FORBIDDEN', message: 'Cannot delete this user' } }, 403)
  }
  // prevent deleting last super_admin
  if (target.role === 'super_admin') {
    const supers = await db.select().from(users).where(eq(users.role, 'super_admin'))
    if (supers.length <= 1) return c.json({ success: false, error: { code: 'LAST_SUPER_ADMIN', message: 'Cannot delete last super_admin' } }, 400)
  }

  await db.delete(users).where(eq(users.id, id))

  await createAuditLog(c.env.DB, {
    actorId: actor.id,
    actorUsername: actor.username,
    actorRole: actor.role,
    action: 'DELETE_USER',
    targetType: 'user',
    targetId: id,
    targetUsername: target.username,
    details: `Deleted ${target.role} ${target.email}`,
    ipAddress: getIP(c),
    userAgent: c.req.header('user-agent'),
  })

  return c.json({ success: true })
})

// GET /profiles - admin view
adminRoutes.get('/profiles', requirePermission(PERMISSIONS.USER_READ), async (c) => {
  const db = createDb(c.env.DB)
  const rows = await db.select().from(profiles).limit(100)
  return c.json({ success: true, data: rows })
})

adminRoutes.put('/profiles/:id/publish', requirePermission(PERMISSIONS.LINK_MANAGE_ALL), async (c) => {
  const id = c.req.param('id')
  const { published } = (await c.req.json().catch(() => ({}))) as { published?: boolean }
  const db = createDb(c.env.DB)
  await db.update(profiles).set({ published: !!published, updatedAt: new Date().toISOString() }).where(eq(profiles.id, id))
  const actor = c.get('user') as AuthUser
  await createAuditLog(c.env.DB, {
    actorId: actor.id,
    actorUsername: actor.username,
    actorRole: actor.role,
    action: published ? 'PUBLISH_PROFILE' : 'UNPUBLISH_PROFILE',
    targetType: 'profile',
    targetId: id,
    ipAddress: getIP(c),
    userAgent: c.req.header('user-agent'),
  })
  return c.json({ success: true })
})

// GET /audit-logs - super_admin only
adminRoutes.get('/audit-logs', requirePermission(PERMISSIONS.AUDIT_READ), async (c) => {
  const user = c.get('user') as AuthUser
  if (user.role !== 'super_admin') return c.json({ success: false, error: { code: 'FORBIDDEN', message: 'Super admin only' } }, 403)
  const db = createDb(c.env.DB)
  const limit = Math.min(100, parseInt(c.req.query('limit') || '50', 10))
  const rows = await db.select().from(auditLogs).orderBy(desc(auditLogs.createdAt)).limit(limit)
  return c.json({ success: true, data: rows })
})

// GET /analytics-all - view all analytics (super_admin/admin)
adminRoutes.get('/analytics-all', requirePermission(PERMISSIONS.ANALYTICS_VIEW_ALL), async (c) => {
  const db = createDb(c.env.DB)
  // simple aggregate for demo: total views/clicks across all users
  const total = await db.select({ cnt: sql<number>`count(*)` }).from(auditLogs)
  // placeholder - return user count
  const userCount = await db.select({ cnt: sql<number>`count(*)` }).from(users)
  return c.json({ success: true, data: { totalUsers: userCount[0]?.cnt ?? 0, auditCount: total[0]?.cnt ?? 0 } })
})

export default adminRoutes
