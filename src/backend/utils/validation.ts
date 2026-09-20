import { z } from 'zod'

const colorSchema = z.string().regex(/^#[0-9a-fA-F]{6}$/)

// Logo/banner images: an absolute http(s) URL or a same-origin uploaded media path.
const imageUrlSchema = z
  .string()
  .refine((v) => /^https?:\/\//i.test(v) || v.startsWith('/media/'), 'Invalid image URL')
  .optional()
  .nullable()
  .transform((v) => (v === '' ? null : v))
export const socialPlatformSchema = z.enum(['instagram', 'tiktok', 'threads', 'youtube', 'twitter', 'facebook', 'linkedin', 'github', 'website', 'email', 'phone', 'whatsapp'])

const fontFamilySchema = z.enum(['inter', 'dm-sans', 'poppins', 'manrope', 'plus-jakarta-sans', 'space-grotesk', 'playfair-display'])
const buttonShapeSchema = z.enum(['square', 'rounded', 'pill', 'outlined', 'elevated'])

// Theme system: profiles.theme_config stores { themeId, overrides } as JSON text.
const themeOverridesSchema = z.object({
  buttonColor: colorSchema.optional(),
  buttonTextColor: colorSchema.optional(),
  accentColor: colorSchema.optional(),
  textColor: colorSchema.optional(),
  textSecondaryColor: colorSchema.optional(),
  cardColor: colorSchema.optional(),
  socialIconColor: colorSchema.optional(),
  fontFamily: fontFamilySchema.optional(),
  buttonShape: buttonShapeSchema.optional(),
})

const themeConfigSchema = z.object({
  themeId: z.string().min(1).max(40),
  overrides: themeOverridesSchema.optional().nullable(),
  showShare: z.boolean().optional(),
  socialStyle: z.enum(['circle', 'plain']).optional(),
})

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
  fontFamily: fontFamilySchema.optional(),
  textAlignment: z.enum(['left', 'center', 'right']).optional(),
  avatarShape: z.enum(['circle', 'square', 'rounded']).optional(),
  colorPalette: z
    .enum(['ocean', 'sunset', 'forest', 'berry', 'midnight', 'candy', 'golden', 'monochrome'])
    .optional()
    .nullable(),
  logoUrl: imageUrlSchema,
  headerStyle: z.enum(['classic', 'hero', 'banner', 'shape']).optional(),
  bannerUrl: imageUrlSchema,
  themeConfig: themeConfigSchema.optional().nullable(),
  avatarUrl: z
    .string()
    .url()
    .optional()
    .nullable()
    .transform((v) => (v === '' ? null : v)),
})

const socialItemSchema = z
  .object({
    platform: socialPlatformSchema,
    value: z.string().min(1).max(500),
    enabled: z.boolean(),
    position: z.number().int().min(0),
  })
  .superRefine((item, ctx) => {
    const v = item.value.trim()
    // Lenient checks only — never reject legitimate international formats.
    if (item.platform === 'email' && !/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(v.replace(/^mailto:/i, ''))) {
      ctx.addIssue({ code: z.ZodIssueCode.custom, message: 'Invalid email address' })
    }
    if (item.platform === 'phone' || item.platform === 'whatsapp') {
      const digits = v.replace(/[^\d]/g, '')
      if (digits.length < 6 || digits.length > 15) {
        ctx.addIssue({ code: z.ZodIssueCode.custom, message: 'Invalid phone number' })
      }
    }
  })

export const profileSocialLinksSchema = z.object({
  socials: z.array(socialItemSchema).max(16),
})

export const linkCreateSchema = z.object({
  title: z.string().min(1, 'Title required').max(100),
  url: urlSchema,
  icon: z.string().max(50).optional().nullable(),
  thumbnail: z.string().url().optional().nullable(),
  enabled: z.boolean().optional().default(true),
  sectionId: z.string().nullable().optional(),
  // Location Smart Link: whether the public profile embeds a map.
  showLocation: z.boolean().optional(),
})

export const linkUpdateSchema = z.object({
  title: z.string().min(1).max(100).optional(),
  url: urlSchema.optional(),
  icon: z.string().max(50).optional().nullable(),
  thumbnail: z.string().url().optional().nullable(),
  enabled: z.boolean().optional(),
  sectionId: z.string().nullable().optional(),
  showLocation: z.boolean().optional(),
})

export const reorderSchema = z.object({
  orderedIds: z.array(z.string()).min(1),
})
