import { themeToCssVars } from '../../themes'
import type { LogoShape, ResolvedTheme, SocialStyle } from '../../themes'
import IdentityHeader from './IdentityHeader'
import SocialRow from './SocialRow'
import LinkCard from './LinkCard'
import FeaturedLink from './FeaturedLink'
import ShareCard from './ShareCard'
import type { ProfileViewLink } from './LinkCard'
import type { ProfileViewSocial } from './SocialRow'

export type { ProfileViewLink } from './LinkCard'
export type { ProfileViewSocial } from './SocialRow'
export type ProfileViewSection = { id: string; title: string; position?: number }

type Props = {
  displayName: string
  avatarUrl?: string | null | undefined
  bio?: string | null | undefined
  logoUrl?: string | null | undefined
  links: ProfileViewLink[]
  sections?: ProfileViewSection[] | undefined
  socials?: ProfileViewSocial[] | undefined
  profileUrl: string
  theme: ResolvedTheme
  interactive?: boolean | undefined
  onLinkClick?: ((linkId: string) => void) | undefined
  onSocialClick?: ((platform: string) => void) | undefined
  variant?: 'page' | 'embedded' | undefined
  footerText?: string | undefined
  showShare?: boolean | undefined
  socialStyle?: SocialStyle | undefined
  headerStyle?: 'classic' | 'hero' | 'banner' | 'shape' | undefined
  bannerUrl?: string | null | undefined
  logoShape?: LogoShape | undefined
  featuredLinkId?: string | null | undefined
}

export default function PublicProfileView({
  displayName,
  avatarUrl,
  bio,
  logoUrl,
  links,
  sections = [],
  socials = [],
  profileUrl,
  theme,
  interactive = false,
  onLinkClick,
  onSocialClick,
  variant = 'page',
  footerText = 'Lensa Links',
  showShare = true,
  socialStyle = 'circle',
  headerStyle = 'classic',
  bannerUrl = null,
  logoShape = 'circle',
  featuredLinkId,
}: Props) {
  const embedded = variant === 'embedded'
  const layout = theme.layout
  // Layout config wins; the legacy `socialStyle` prop still applies when the
  // layout only has the default surface style.
  const socialIconStyle =
    layout.socialIconStyle !== 'surface'
      ? layout.socialIconStyle
      : socialStyle === 'plain'
        ? 'plain'
        : 'surface'
  const promotedId = featuredLinkId !== undefined ? featuredLinkId : layout.featuredLinkId

  // A featured link is only promoted when it exists, is enabled (the caller
  // already filters disabled links), and has a thumbnail image.
  const featured = promotedId ? links.find((l) => l.id === promotedId && !!l.thumbnail) || null : null
  const restLinks = featured ? links.filter((l) => l.id !== featured.id) : links

  const bySection = new Map<string | null, ProfileViewLink[]>()
  for (const l of restLinks) {
    const key = l.sectionId || null
    if (!bySection.has(key)) bySection.set(key, [])
    bySection.get(key)!.push(l)
  }
  const noSectionLinks = bySection.get(null) || []
  const hasSections = sections.length > 0
  const visibleSections = sections.filter((s) => (bySection.get(s.id) || []).length > 0)

  return (
    <div
      className={`pp-root w-full ${embedded ? '' : 'min-h-[100dvh] min-h-screen'}`}
      style={themeToCssVars(theme)}
    >
      <div
        className={`pp-content ${embedded ? '' : 'animate-fade-in motion-reduce:animate-none'}`}
      >
        <div className="space-y-3">
          <IdentityHeader
            displayName={displayName}
            avatarUrl={avatarUrl}
            bio={bio}
            logoUrl={logoUrl}
            headerStyle={headerStyle}
            bannerUrl={bannerUrl}
            avatarShape={layout.avatarShape}
            logoShape={logoShape}
            nameTreatment={layout.nameTreatment}
            align={layout.align}
          />
          <SocialRow
            socials={socials}
            interactive={interactive}
            onSocialClick={onSocialClick}
            style={socialIconStyle}
          />
        </div>

        <div className="pp-links">
          {featured && (
            <FeaturedLink link={featured} interactive={interactive} onLinkClick={onLinkClick} />
          )}

          {!hasSections && restLinks.length === 0 && !featured && (
            <p className="py-8 text-center text-sm" style={{ color: 'var(--pp-text-secondary)' }}>
              No links yet
            </p>
          )}

          {visibleSections.map((sec) => (
            <div key={sec.id} className="pp-links-group">
              <h2 className="pp-section-label">{sec.title}</h2>
              <div className="pp-links-group">
                {(bySection.get(sec.id) || []).map((link) => (
                  <LinkCard
                    key={link.id}
                    link={link}
                    interactive={interactive}
                    onLinkClick={onLinkClick}
                  />
                ))}
              </div>
            </div>
          ))}

          {noSectionLinks.length > 0 && (
            <div className="pp-links-group">
              {hasSections && <h2 className="pp-section-label">Links</h2>}
              <div className="pp-links-group">
                {noSectionLinks.map((link) => (
                  <LinkCard
                    key={link.id}
                    link={link}
                    interactive={interactive}
                    onLinkClick={onLinkClick}
                  />
                ))}
              </div>
            </div>
          )}
        </div>

        {showShare && <ShareCard profileUrl={profileUrl} embedded={embedded} />}

        {footerText && (
          <p
            className="text-center text-[11px] tracking-wide"
            style={{ color: 'var(--pp-text-secondary)', opacity: 0.6 }}
          >
            {footerText}
          </p>
        )}
      </div>
    </div>
  )
}
