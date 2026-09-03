import { z } from 'zod'

export const usernameSchema = z
  .string()
  .min(3, 'Username must be at least 3 characters')
  .max(30, 'Username too long')
  .regex(/^[a-z0-9_]+$/, 'Lowercase letters, numbers, underscore only')
  .transform((v) => v.toLowerCase())

export const urlSchema = z.string().url('Invalid URL').refine((v) => {
  try {
    const u = new URL(v)
    return u.protocol === 'http:' || u.protocol === 'https:'
  } catch {
    return false
  }
}, 'Only http/https URLs allowed')

export const profileUpdateSchema = z.object({
  displayName: z.string().min(1).max(100).optional(),
  bio: z.string().max(500).optional().nullable(),
  team: z.string().max(100).optional().nullable(),
  company: z.string().max(100).optional().nullable(),
  theme: z.enum(['default', 'light', 'dark', 'minimal', 'gradient']).optional(),
  backgroundColor: z.string().regex(/^#[0-9a-fA-F]{6}$/).optional(),
  textColor: z.string().regex(/^#[0-9a-fA-F]{6}$/).optional(),
  buttonStyle: z.enum(['rounded', 'square', 'pill']).optional(),
  fontFamily: z.string().max(50).optional(),
  textAlignment: z.enum(['left', 'center', 'right']).optional(),
  avatarShape: z.enum(['circle', 'square', 'rounded']).optional(),
  avatarUrl: z.string().url().optional().nullable().or(z.literal('')),
})

export const linkCreateSchema = z.object({
  title: z.string().min(1, 'Title required').max(100),
  url: urlSchema,
  icon: z.string().max(50).optional().nullable(),
  thumbnail: z.string().url().optional().nullable(),
  enabled: z.boolean().optional().default(true),
  sectionId: z.string().nullable().optional(),
})

export const linkUpdateSchema = z.object({
  title: z.string().min(1).max(100).optional(),
  url: urlSchema.optional(),
  icon: z.string().max(50).optional().nullable(),
  thumbnail: z.string().url().optional().nullable(),
  enabled: z.boolean().optional(),
  sectionId: z.string().nullable().optional(),
})

export const reorderSchema = z.object({
  orderedIds: z.array(z.string()).min(1),
})
