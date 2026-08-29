import { createDb } from '../db/client'
import { auditLogs } from '../db/schema'

type AuditParams = {
  actorId: string
  actorUsername: string
  actorRole: string
  action: string
  targetType: string
  targetId?: string
  targetUsername?: string
  details?: string
  ipAddress?: string | null
  userAgent?: string | null
}

export async function createAuditLog(db: D1Database, params: AuditParams) {
  try {
    const drizzle = createDb(db)
    await drizzle.insert(auditLogs).values({
      actorId: params.actorId,
      actorUsername: params.actorUsername,
      actorRole: params.actorRole,
      action: params.action,
      targetType: params.targetType,
      targetId: params.targetId || null,
      targetUsername: params.targetUsername || null,
      details: params.details || null,
      ipAddress: params.ipAddress || null,
      userAgent: params.userAgent?.slice(0, 500) || null,
    })
  } catch {
    // never block main action
  }
}
