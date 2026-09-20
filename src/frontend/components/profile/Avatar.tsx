import type { AvatarShape, LogoShape } from '../../themes'

type Props = {
  displayName: string
  avatarUrl?: string | null | undefined
  logoUrl?: string | null | undefined
  avatarShape?: AvatarShape | undefined
  logoShape?: LogoShape | undefined
}

// The uploaded logo doubles as the profile picture: shown inside the avatar
// container by default, or as a plain transparent PNG when "Plain (PNG)" is set.
export default function Avatar({
  displayName,
  avatarUrl,
  logoUrl,
  avatarShape = 'circle',
  logoShape = 'circle',
}: Props) {
  const avatarImage = avatarUrl || logoUrl
  const plainLogo = !avatarUrl && !!logoUrl && logoShape === 'plain'

  if (plainLogo) {
    return (
      <img
        src={logoUrl as string}
        alt={displayName}
        className="pp-avatar pp-avatar--plain object-contain"
      />
    )
  }

  return (
    <div className={`pp-avatar${avatarShape === 'hex' ? ' pp-avatar--hex' : ''}`}>
      {avatarImage ? (
        <img
          src={avatarImage}
          alt={displayName}
          className={`h-full w-full ${avatarUrl ? 'object-cover' : 'object-contain p-1'}`}
        />
      ) : (
        <span className="text-2xl font-semibold sm:text-3xl" style={{ color: 'var(--pp-text)' }}>
          {displayName.charAt(0).toUpperCase()}
        </span>
      )}
    </div>
  )
}
