import type { MouseEvent as ReactMouseEvent } from 'react'
import type { ProfileViewLink } from './LinkCard'

type Props = {
  link: ProfileViewLink
  interactive?: boolean | undefined
  onLinkClick?: ((linkId: string) => void) | undefined
}

// Optional promoted tile. Rendered only when a link has a thumbnail, and kept
// visually distinct from standard link cards. Clicks use the same analytics
// handler as standard links so tracking stays exactly-once.
export default function FeaturedLink({ link, interactive = false, onLinkClick }: Props) {
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
      className="pp-featured pp-interactive group block"
    >
      <img src={link.thumbnail as string} alt="" className="pp-featured-img" loading="lazy" />
      <div className="px-4 py-3">
        <p
          className="pp-link-title min-w-0 truncate font-semibold"
          style={{ color: 'var(--pp-text)' }}
        >
          {link.title}
        </p>
      </div>
    </a>
  )
}
