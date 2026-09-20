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

  const bannerImg = (h: string) =>
    bannerUrl ? (
      <img src={bannerUrl} alt="" className={`${h} w-full rounded-2xl object-cover`} />
    ) : (
      <div className={`${h} w-full rounded-2xl`} style={bannerFallback} />
    )

  const inner =
    headerStyle === 'banner' ? (
      <>
        <div>
          {bannerImg('h-28 sm:h-32')}
          <div className="-mt-10 flex justify-center">{avatar}</div>
        </div>
        {nameNode}
        {bioNode}
      </>
    ) : headerStyle === 'hero' ? (
      <>
        <div className="relative">
          {bannerImg('h-36 sm:h-44')}
          <div className="absolute inset-x-0 -bottom-10 flex justify-center">{avatar}</div>
        </div>
        <div className="space-y-3 pt-10">
          {nameNode}
          {bioNode}
        </div>
      </>
    ) : headerStyle === 'shape' ? (
      <>
        {logoShape === 'plain' && !avatarUrl && logoUrl ? (
          avatar
        ) : (
          <div className="relative mx-auto h-24 w-24 sm:h-28 sm:w-28">
            <div
              className="absolute inset-0 rotate-6 rounded-[28px]"
              style={{ background: 'var(--pp-accent-soft)' }}
            />
            <div className="pp-card relative flex h-full w-full items-center justify-center overflow-hidden rounded-[24px]">
              {avatarUrl || logoUrl ? (
                <img
                  src={(avatarUrl || logoUrl) as string}
                  alt={displayName}
                  className="h-full w-full object-cover"
                />
              ) : (
                <span
                  className="text-2xl font-semibold sm:text-3xl"
                  style={{ color: 'var(--pp-text)' }}
                >
                  {displayName.charAt(0).toUpperCase()}
                </span>
              )}
            </div>
          </div>
        )}
        {nameNode}
        {bioNode}
      </>
    ) : (
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
