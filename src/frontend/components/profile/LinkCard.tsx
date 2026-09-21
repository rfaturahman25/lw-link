import type { MouseEvent as ReactMouseEvent } from 'react'
import { MapPin } from 'lucide-react'
import { renderLinkIcon } from './linkIcons'
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

type Props = {
  link: ProfileViewLink
  interactive?: boolean | undefined
  onLinkClick?: ((linkId: string) => void) | undefined
}

export default function LinkCard({ link, interactive = false, onLinkClick }: Props) {
  // Smart Link (location): metadata comes from the server, never from the user.
  const loc = link.type === 'location' ? parseSmartMetadata(link) : null
  const titleNorm = link.title.trim().toLowerCase()
  const placeName = loc?.placeName?.trim()
  const address = loc?.address?.trim()
  // The subtitle is the real address, falling back to the place name — but only
  // when it adds information beyond the title the owner already wrote. This is
  // what stops the old meaningless "Location" placeholder from showing up.
  const locSubtitle =
    address && address.toLowerCase() !== titleNorm
      ? address
      : placeName && placeName.toLowerCase() !== titleNorm
        ? placeName
        : null
  const showLoc = !!loc && loc.showLocation !== false && !!locSubtitle
  const showUrl = link.showUrl !== false
  const showIcon = link.icon !== 'none'
  const align =
    link.align === 'center' ? 'text-center' : link.align === 'right' ? 'text-right' : 'text-left'
  // The location row is a flex line, so it needs explicit justification to
  // follow the card's text alignment instead of always sitting flush left.
  const justify =
    link.align === 'center' ? 'justify-center' : link.align === 'right' ? 'justify-end' : 'justify-start'

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
      className="pp-link pp-interactive group flex items-center gap-3 px-4 py-3.5"
    >
      {showIcon && (
        <div
          className="pp-link-icon flex h-10 w-10 shrink-0 items-center justify-center rounded-xl"
          style={{ background: 'var(--pp-link-icon-bg)', color: 'var(--pp-link-icon-color)' }}
        >
          {renderLinkIcon(link.icon)}
        </div>
      )}
      <div className={`min-w-0 flex-1 ${align}`}>
        <p
          className="pp-link-title font-semibold leading-tight"
          style={{ color: 'var(--pp-link-text)' }}
        >
          {link.title}
        </p>
        {showLoc ? (
          <p
            className={`pp-link-sub mt-1 flex items-center gap-1 ${justify}`}
            style={{ color: 'var(--pp-link-secondary)' }}
          >
            <MapPin className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />
            <span className="min-w-0 truncate">{locSubtitle}</span>
          </p>
        ) : showUrl ? (
          <p className="pp-link-sub mt-1 truncate" style={{ color: 'var(--pp-link-secondary)' }}>
            {link.url.replace(/^https?:\/\//, '')}
          </p>
        ) : null}
      </div>
    </a>
  )
}
