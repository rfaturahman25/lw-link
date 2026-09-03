import { sqliteTable, text, integer } from 'drizzle-orm/sqlite-core'
import { sql } from 'drizzle-orm'

export const users = sqliteTable('users', {
  id: text('id').primaryKey().$defaultFn(() => crypto.randomUUID()),
  email: text('email').notNull().unique(),
  username: text('username').notNull().unique(),
  displayName: text('display_name').notNull(),
  avatarUrl: text('avatar_url'),
  passwordHash: text('password_hash'),
  role: text('role', { enum: ['user', 'admin', 'super_admin'] }).notNull().default('user'),
  status: text('status', { enum: ['active', 'disabled'] }).notNull().default('active'),
  lastLoginAt: text('last_login_at'),
  createdAt: text('created_at').default(sql`CURRENT_TIMESTAMP`),
  updatedAt: text('updated_at').default(sql`CURRENT_TIMESTAMP`),
})

export const profiles = sqliteTable('profiles', {
  id: text('id').primaryKey().$defaultFn(() => crypto.randomUUID()),
  userId: text('user_id').notNull().unique().references(() => users.id, { onDelete: 'cascade' }),
  bio: text('bio'),
  team: text('team'),
  company: text('company'),
  theme: text('theme', { enum: ['default', 'light', 'dark', 'minimal', 'gradient'] }).default('default'),
  backgroundColor: text('background_color').default('#ffffff'),
  textColor: text('text_color').default('#000000'),
  buttonStyle: text('button_style', { enum: ['rounded', 'square', 'pill'] }).default('rounded'),
  fontFamily: text('font_family').default('system-ui'),
  textAlignment: text('text_alignment', { enum: ['left', 'center', 'right'] }).default('center'),
  avatarShape: text('avatar_shape', { enum: ['circle', 'square', 'rounded'] }).default('circle'),
  published: integer('published', { mode: 'boolean' }).default(false),
  createdAt: text('created_at').default(sql`CURRENT_TIMESTAMP`),
  updatedAt: text('updated_at').default(sql`CURRENT_TIMESTAMP`),
})

export const sections = sqliteTable('sections', {
  id: text('id').primaryKey().$defaultFn(() => crypto.randomUUID()),
  userId: text('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  title: text('title').notNull(),
  position: integer('position').notNull().default(0),
  createdAt: text('created_at').default(sql`CURRENT_TIMESTAMP`),
  updatedAt: text('updated_at').default(sql`CURRENT_TIMESTAMP`),
})

export const links = sqliteTable('links', {
  id: text('id').primaryKey().$defaultFn(() => crypto.randomUUID()),
  userId: text('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  sectionId: text('section_id').references(() => sections.id, { onDelete: 'set null' }),
  title: text('title').notNull(),
  url: text('url').notNull(),
  icon: text('icon'),
  thumbnail: text('thumbnail'),
  position: integer('position').notNull().default(0),
  enabled: integer('enabled', { mode: 'boolean' }).default(true),
  createdAt: text('created_at').default(sql`CURRENT_TIMESTAMP`),
  updatedAt: text('updated_at').default(sql`CURRENT_TIMESTAMP`),
})

export const analyticsEvents = sqliteTable('analytics_events', {
  id: text('id').primaryKey().$defaultFn(() => crypto.randomUUID()),
  userId: text('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  linkId: text('link_id').references(() => links.id, { onDelete: 'set null' }),
  eventType: text('event_type', { enum: ['profile_view', 'link_click'] }).notNull(),
  userAgent: text('user_agent'),
  referrer: text('referrer'),
  ipHash: text('ip_hash'),
  countryCode: text('country_code'),
  createdAt: text('created_at').default(sql`CURRENT_TIMESTAMP`),
})

export const sessions = sqliteTable('sessions', {
  id: text('id').primaryKey().$defaultFn(() => crypto.randomUUID()),
  userId: text('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  tokenHash: text('token_hash').notNull().unique(),
  expiresAt: text('expires_at').notNull(),
  userAgent: text('user_agent'),
  ipAddress: text('ip_address'),
  createdAt: text('created_at').default(sql`CURRENT_TIMESTAMP`),
})

export const auditLogs = sqliteTable('audit_logs', {
  id: text('id').primaryKey().$defaultFn(() => crypto.randomUUID()),
  actorId: text('actor_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  actorUsername: text('actor_username').notNull(),
  actorRole: text('actor_role').notNull(),
  action: text('action').notNull(),
  targetType: text('target_type').notNull(),
  targetId: text('target_id'),
  targetUsername: text('target_username'),
  details: text('details'),
  ipAddress: text('ip_address'),
  userAgent: text('user_agent'),
  createdAt: text('created_at').default(sql`CURRENT_TIMESTAMP`),
})

export type User = typeof users.$inferSelect
export type NewUser = typeof users.$inferInsert
export type Profile = typeof profiles.$inferSelect
export type NewProfile = typeof profiles.$inferInsert
export type Section = typeof sections.$inferSelect
export type NewSection = typeof sections.$inferInsert
export type Link = typeof links.$inferSelect
export type NewLink = typeof links.$inferInsert
export type AnalyticsEvent = typeof analyticsEvents.$inferSelect
export type Session = typeof sessions.$inferSelect
export type AuditLog = typeof auditLogs.$inferSelect
