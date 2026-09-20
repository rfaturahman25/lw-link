import type { MouseEvent as ReactMouseEvent, ReactNode } from 'react'
import {
  Github,
  Linkedin,
  Globe,
  Mail,
  Link as LinkIcon,
  Instagram,
  Youtube,
  Facebook,
  ExternalLink,
  FileSpreadsheet,
  FileText,
  ShoppingBag,
  Phone,
  Image as ImageIcon,
  Video,
  Music,
  MapPin,
  Headphones,
  Ban,
} from 'lucide-react'
import { WhatsAppIcon, XIcon } from '../icons/BrandIcons'
import { parseSmartMetadata } from './smartLink'

export type ProfileViewLink = {
  id: string
  title: string
  url: string
  icon: string | null
  sectionId?: string | null
  type?: string | null
  metadata?: string | null
  showUrl?: boolean | null
  align?: string | null
  thumbnail?: string | null
}

const iconMap: Record<string, ReactNode> = {
  github: <Github className="h-5 w-5" />,
  linkedin: <Linkedin className="h-5 w-5" />,
  twitter: <XIcon className="h-5 w-5" />,
  call: <Headphones className="h-5 w-5" />,
  globe: <Globe className="h-5 w-5" />,
  mail: <Mail className="h-5 w-5" />,
  instagram: <Instagram className="h-5 w-5" />,
  youtube: <Youtube className="h-5 w-5" />,
  facebook: <Facebook className="h-5 w-5" />,
  whatsapp: <WhatsAppIcon className="h-5 w-5" />,
  sheet: <FileSpreadsheet className="h-5 w-5" />,
  file: <FileText className="h-5 w-5" />,
  shop: <ShoppingBag className="h-5 w-5" />,
  phone: <Phone className="h-5 w-5" />,
  image: <ImageIcon className="h-5 w-5" />,
  video: <Video className="h-5 w-5" />,
  music: <Music className="h-5 w-5" />,
  tiktok: <Music className="h-5 w-5" />,
  none: <Ban className="h-5 w-5" />,
  link: <LinkIcon className="h-5 w-5" />,
  default: <LinkIcon className="h-5 w-5" />,
}

type Props = {
  link: ProfileViewLink
  interactive?: boolean | undefined
  onLinkClick?: ((linkId: string) => void) | undefined
}

export default function LinkCard({ link, interactive = false, onLinkClick }: Props) {
  // Smart Link (location): metadata comes from the server, never from the user.
  const loc = link.type === 'location' ? parseSmartMetadata(link) : null
  const titleNorm = link.title.trim().toLowerCase()
  const placeDiffers = !!loc?.placeName && loc.placeName.trim().toLowerCase() !== titleNorm
  const locPrimary = loc ? (placeDiffers ? loc.placeName : loc.address || 'Location') : null
  const locSecondary = placeDiffers && loc?.address ? loc.address : null
  const showLoc = !!loc && loc.showLocation !== false
  const showUrl = link.showUrl !== false
  const showIcon = link.icon !== 'none'
  const align =
    link.align === 'center' ? 'text-center' : link.align === 'right' ? 'text-right' : 'text-left'

  const handleClick = (e: ReactMouseEvent) => {
    if (!interactive) {
      e.preventDefault()
      return
    }
    onLinkClick?.(link.id)
  }

  return (
    <a
      href={link.url}
      target={interactive ? '_blank' : undefined}
      rel={interactive ? 'noopener noreferrer' : undefined}
      onClick={handleClick}
      className="pp-link pp-interactive group flex items-center justify-between gap-3 px-4 py-3.5"
    >
      <div className="flex min-w-0 flex-1 items-center gap-3.5">
        {showIcon && (
          <div
            className="pp-link-icon flex h-10 w-10 shrink-0 items-center justify-center rounded-xl"
            style={{ background: 'var(--pp-link-icon-bg)', color: 'var(--pp-link-icon-color)' }}
          >
            {iconMap[link.icon || 'default'] || iconMap.default}
          </div>
        )}
        <div className={`min-w-0 flex-1 ${align}`}>
          <p
            className="text-[15px] font-semibold leading-tight"
            style={{ color: 'var(--pp-link-text)' }}
          >
            {link.title}
          </p>
          {showLoc ? (
            <div className="mt-1 space-y-0.5">
              <p
                className="flex items-center gap-1 text-xs"
                style={{ color: 'var(--pp-link-secondary)' }}
              >
                <MapPin className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />
                <span className="truncate">{locPrimary}</span>
              </p>
              {locSecondary && (
                <p
                  className="break-words text-xs leading-snug"
                  style={{ color: 'var(--pp-link-secondary)' }}
                >
                  {locSecondary}
                </p>
              )}
            </div>
          ) : showUrl ? (
            <p className="mt-1 truncate text-xs" style={{ color: 'var(--pp-link-secondary)' }}>
              {link.url.replace(/^https?:\/\//, '')}
            </p>
          ) : null}
        </div>
      </div>
      <ExternalLink
        className="h-4 w-4 shrink-0 opacity-70 transition-opacity duration-200 ease-out group-hover:opacity-100"
        style={{ color: 'var(--pp-link-secondary)' }}
      />
    </a>
  )
}
