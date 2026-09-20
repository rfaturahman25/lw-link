import type { ComponentType } from 'react'
import {
  Github,
  Globe,
  Instagram,
  Link as LinkIcon,
  Linkedin,
  Mail,
  MessageCircle,
  Phone,
  Facebook,
  Youtube,
  Music,
} from 'lucide-react'
import { WhatsAppIcon, XIcon } from '../icons/BrandIcons'

type IconType = ComponentType<{ className?: string | undefined }>

export type SocialPlatform =
  | 'instagram'
  | 'tiktok'
  | 'threads'
  | 'youtube'
  | 'twitter'
  | 'facebook'
  | 'linkedin'
  | 'github'
  | 'website'
  | 'email'
  | 'phone'
  | 'whatsapp'

export type SocialKind = 'handle' | 'url' | 'email' | 'phone'

type SocialMeta = {
  label: string
  placeholder: string
  hint: string
  kind: SocialKind
  Icon: IconType
}

// Order shown in the admin platform picker.
export const SOCIAL_PLATFORMS: SocialPlatform[] = [
  'instagram',
  'tiktok',
  'threads',
  'youtube',
  'twitter',
  'facebook',
  'linkedin',
  'whatsapp',
  'email',
  'phone',
  'website',
  'github',
]

export const SOCIAL_META: Record<SocialPlatform, SocialMeta> = {
  instagram: {
    label: 'Instagram',
    placeholder: '@lensawaktu or https://instagram.com/lensawaktu',
    hint: 'Username (@) or full URL',
    kind: 'handle',
    Icon: Instagram,
  },
  tiktok: {
    label: 'TikTok',
    placeholder: '@lensawaktu or URL',
    hint: 'Username (@) or full URL',
    kind: 'handle',
    Icon: Music,
  },
  threads: {
    label: 'Threads',
    placeholder: '@lensawaktu or URL',
    hint: 'Username (@) or full URL',
    kind: 'handle',
    Icon: MessageCircle,
  },
  youtube: {
    label: 'YouTube',
    placeholder: '@channel or URL',
    hint: 'Username (@) or channel URL',
    kind: 'handle',
    Icon: Youtube,
  },
  twitter: {
    label: 'X / Twitter',
    placeholder: '@lensawaktu or URL',
    hint: 'Username (@) or full URL',
    kind: 'handle',
    Icon: XIcon,
  },
  facebook: {
    label: 'Facebook',
    placeholder: 'username or URL',
    hint: 'Username or full URL',
    kind: 'handle',
    Icon: Facebook,
  },
  linkedin: {
    label: 'LinkedIn',
    placeholder: 'username or URL',
    hint: 'Username (linkedin.com/in/...) or full URL',
    kind: 'handle',
    Icon: Linkedin,
  },
  github: {
    label: 'GitHub',
    placeholder: 'username or URL',
    hint: 'Username or full URL',
    kind: 'handle',
    Icon: Github,
  },
  whatsapp: {
    label: 'WhatsApp',
    placeholder: '+62 812 3456 7890',
    hint: 'WhatsApp number (international format supported)',
    kind: 'phone',
    Icon: WhatsAppIcon,
  },
  email: {
    label: 'Email',
    placeholder: 'nama@example.com',
    hint: 'Email address',
    kind: 'email',
    Icon: Mail,
  },
  phone: {
    label: 'Phone / Call',
    placeholder: '+62 812 3456 7890',
    hint: 'Phone number',
    kind: 'phone',
    Icon: Phone,
  },
  website: {
    label: 'Website',
    placeholder: 'https://example.com',
    hint: 'URL website',
    kind: 'url',
    Icon: Globe,
  },
}

// Editor draft item (client-only id for drag-and-drop ordering).
export type SocialDraft = {
  id: string
  platform: SocialPlatform
  value: string
  enabled: boolean
}

export const MAX_SOCIALS = 16

export function newSocialDraft(platform: SocialPlatform = 'instagram'): SocialDraft {
  const id =
    typeof crypto !== 'undefined' && 'randomUUID' in crypto
      ? crypto.randomUUID()
      : Math.random().toString(36).slice(2)
  return { id, platform, value: '', enabled: true }
}

export function socialIcon(platform: string, className = 'h-[18px] w-[18px]') {
  const meta = SOCIAL_META[platform as SocialPlatform]
  const Icon = meta?.Icon ?? LinkIcon
  return <Icon className={className} />
}

// Turn a stored value into a safe outbound URL. Full URLs are left untouched.
export function socialHref(platform: string, value: string): string {
  const v = value.trim()
  if (/^https?:\/\//i.test(v) || /^mailto:/i.test(v) || /^tel:/i.test(v)) return v
  const handle = v.replace(/^@/, '')
  switch (platform) {
    case 'instagram':
      return `https://instagram.com/${handle}`
    case 'tiktok':
      return `https://tiktok.com/@${handle}`
    case 'threads':
      return `https://threads.net/@${handle}`
    case 'youtube':
      return handle.includes('.') || handle.includes('/')
        ? `https://${handle}`
        : `https://youtube.com/@${handle}`
    case 'twitter':
      return `https://twitter.com/${handle}`
    case 'facebook':
      return `https://facebook.com/${handle}`
    case 'linkedin':
      return `https://linkedin.com/in/${handle}`
    case 'github':
      return `https://github.com/${handle}`
    case 'whatsapp':
      return `https://wa.me/${v.replace(/[^\d]/g, '')}`
    case 'email':
      return `mailto:${v}`
    case 'phone':
      return `tel:${v.replace(/[^\d+]/g, '')}`
    default:
      return v.startsWith('http') ? v : `https://${v}`
  }
}

const EMAIL_RE = /^[^@\s]+@[^@\s]+\.[^@\s]+$/
const DOMAIN_RE = /^(https?:\/\/)?[\w-]+(\.[\w-]+)+([/?#].*)?$/i

// Lenient per-platform validation — never reject legitimate international formats.
export function validateSocialValue(platform: string, value: string): string | null {
  const v = value.trim()
  if (!v) return 'Required.'
  const kind = SOCIAL_META[platform as SocialPlatform]?.kind ?? 'handle'
  if (kind === 'email') {
    return EMAIL_RE.test(v.replace(/^mailto:/i, '')) ? null : 'Invalid email format.'
  }
  if (kind === 'phone') {
    if (!/^[+\d\s().-]+$/.test(v)) {
      return 'Numbers may only contain digits, spaces, +, -, and parentheses.'
    }
    const digits = v.replace(/[^\d]/g, '')
    if (digits.length < 6 || digits.length > 15) return 'Invalid number (6–15 digits).'
    return null
  }
  if (kind === 'url') {
    return /^https?:\/\//i.test(v) || DOMAIN_RE.test(v)
      ? null
      : 'Enter a valid URL, e.g. https://example.com'
  }
  if (/\s/.test(v)) return 'Username cannot contain spaces.'
  return null
}
