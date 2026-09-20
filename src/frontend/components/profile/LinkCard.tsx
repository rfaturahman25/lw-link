import type { MouseEvent as ReactMouseEvent } from 'react'
import { ExternalLink, MapPin } from 'lucide-react'
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
            <div className="mt-1 space-y-0.5">
              <p
                className="pp-link-sub flex items-center gap-1"
                style={{ color: 'var(--pp-link-secondary)' }}
              >
                <MapPin className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />
                <span className="truncate">{locPrimary}</span>
              </p>
              {locSecondary && (
                <p
                  className="pp-link-sub break-words leading-snug"
                  style={{ color: 'var(--pp-link-secondary)' }}
                >
                  {locSecondary}
                </p>
              )}
            </div>
          ) : showUrl ? (
            <p
              className="pp-link-sub mt-1 truncate"
              style={{ color: 'var(--pp-link-secondary)' }}
            >
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
