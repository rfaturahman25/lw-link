import type { AvatarShape, LogoShape, NameTreatment, ProfileAlign } from '../../themes'
import Avatar from './Avatar'

type Props = {
  displayName: string
  avatarUrl?: string | null | undefined
  bio?: string | null | undefined
  logoUrl?: string | null | undefined
  headerStyle?: 'classic' | 'hero' | 'banner' | 'shape' | undefined
  bannerUrl?: string | null | undefined
  avatarShape?: AvatarShape | undefined
  logoShape?: LogoShape | undefined
  nameTreatment?: NameTreatment | undefined
  align?: ProfileAlign | undefined
}

const bannerFallback = {
  background: 'linear-gradient(135deg, var(--pp-accent-soft), transparent)',
}

export default function IdentityHeader({
  displayName,
  avatarUrl,
  bio,
  logoUrl,
  headerStyle = 'classic',
  bannerUrl = null,
  avatarShape = 'circle',
  logoShape = 'circle',
  nameTreatment = 'solid',
  align = 'center',
}: Props) {
  const avatar = (
    <Avatar
      displayName={displayName}
      avatarUrl={avatarUrl}
      logoUrl={logoUrl}
      avatarShape={avatarShape}
      logoShape={logoShape}
    />
  )

  const nameNode = (
    <h1 className={`pp-name${nameTreatment === 'gradient' ? ' pp-name--gradient' : ''}`}>
      {displayName}
    </h1>
  )

  const bioNode = bio?.trim() ? <p className="pp-bio">{bio}</p> : null

  const bannerImg = (h: string) => (
    <div className={`pp-banner ${h} w-full`}>
      {bannerUrl ? (
        <img src={bannerUrl} alt="" className="h-full w-full object-cover" />
      ) : (
        <div className="h-full w-full" style={bannerFallback} />
      )}
      <span className="pp-banner-scrim" aria-hidden="true" />
    </div>
  )

  const inner =
    headerStyle === 'banner' ? (
      <>
        <div>
          {bannerImg('h-32 sm:h-40')}
          <div className="-mt-12 flex justify-center">
            <span className="pp-avatar-halo">{avatar}</span>
          </div>
        </div>
        {nameNode}
        {bioNode}
      </>
    ) : headerStyle === 'hero' ? (
      <>
        <div className="relative">
          {bannerImg('h-40 sm:h-48')}
          <div className="absolute inset-x-0 -bottom-12 flex justify-center">
            <span className="pp-avatar-halo">{avatar}</span>
          </div>
        </div>
        <div className="space-y-3 pt-12">
          {nameNode}
          {bioNode}
        </div>
      </>
    ) : (
      // `classic` and the retired `shape` style (framed avatar) both render the
      // avatar through the single Avatar Shape configuration, so there is only
      // one source of truth for the profile image shape.
      <>
        {avatar}
        {nameNode}
        {bioNode}
      </>
    )

  return (
    <div className={`pp-identity${align === 'left' ? ' pp-identity--left' : ''}`}>{inner}</div>
  )
}
