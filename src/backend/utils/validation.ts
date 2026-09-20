import { z } from 'zod'

const colorSchema = z.string().regex(/^#[0-9a-fA-F]{6}$/)
export const socialPlatformSchema = z.enum(['instagram', 'tiktok', 'threads', 'youtube', 'twitter', 'facebook', 'linkedin', 'github', 'email', 'phone', 'website'])

export const usernameSchema = z
  .string()
  .min(3, 'Username must be at least 3 characters')
  .max(30, 'Username too long')
  .regex(/^[a-z0-9_]+$/, 'Lowercase letters, numbers, underscore only')
  .transform((v) => v.toLowerCase())

export const urlSchema = z
  .string()
  .url('Invalid URL')
  .refine((v) => {
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
  theme: z.enum(['default', 'light', 'dark', 'minimal', 'gradient']).optional(),
  backgroundColor: colorSchema.optional(),
  textColor: colorSchema.optional(),
  buttonStyle: z.enum(['rounded', 'square', 'pill']).optional(),
  fontFamily: z.enum(['inter', 'dm-sans', 'poppins', 'manrope', 'plus-jakarta-sans', 'space-grotesk', 'playfair-display']).optional(),
  textAlignment: z.enum(['left', 'center', 'right']).optional(),
  avatarShape: z.enum(['circle', 'square', 'rounded']).optional(),
  colorPalette: z
    .enum(['ocean', 'sunset', 'forest', 'berry', 'midnight', 'candy', 'golden', 'monochrome'])
    .optional()
    .nullable(),
  logoUrl: z
    .string()
    .url()
    .optional()
    .nullable()
    .transform((v) => (v === '' ? null : v)),
  themeConfig: z.object({ background: colorSchema, surface: colorSchema, button: colorSchema, buttonText: colorSchema, text: colorSchema, secondaryText: colorSchema, accent: colorSchema }).optional().nullable(),
  avatarUrl: z
    .string()
    .url()
    .optional()
    .nullable()
    .transform((v) => (v === '' ? null : v)),
})

export const profileSocialLinksSchema = z.object({
  socials: z.array(z.object({ platform: socialPlatformSchema, value: z.string().min(1).max(500), enabled: z.boolean(), position: z.number().int().min(0) })).max(16),
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
