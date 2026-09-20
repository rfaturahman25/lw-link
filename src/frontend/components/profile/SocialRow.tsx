import type { MouseEvent as ReactMouseEvent } from 'react'
import type { SocialIconStyle } from '../../themes'
import { socialHref, socialIcon } from './socialMeta'

export type ProfileViewSocial = { platform: string; value: string }

type Props = {
  socials: ProfileViewSocial[]
  interactive?: boolean | undefined
  onSocialClick?: ((platform: string) => void) | undefined
  style?: SocialIconStyle | undefined
}

// Primary social/contact cluster, rendered directly under the identity block.
export default function SocialRow({
  socials,
  interactive = false,
  onSocialClick,
  style = 'surface',
}: Props) {
  if (socials.length === 0) return null

  const handleClick = (e: ReactMouseEvent, platform: string) => {
    if (!interactive) {
      e.preventDefault()
      return
    }
    onSocialClick?.(platform)
  }

  return (
    <div className="pp-social-row">
      {socials.map((s, idx) => (
        <a
          key={`${s.platform}-${idx}`}
          href={socialHref(s.platform, s.value)}
          target={interactive ? '_blank' : undefined}
          rel={interactive ? 'noopener noreferrer' : undefined}
          aria-label={`${s.platform} — ${s.value}`}
          onClick={(e) => handleClick(e, s.platform)}
          className={
            style === 'plain'
              ? 'pp-social-plain pp-interactive inline-flex h-11 w-11 items-center justify-center'
              : 'pp-social pp-interactive inline-flex h-11 w-11 items-center justify-center rounded-full'
          }
        >
          {socialIcon(s.platform)}
        </a>
      ))}
    </div>
  )
}
