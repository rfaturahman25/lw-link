import PublicProfileView from '../profile/PublicProfileView'
import type {
  ProfileViewLink,
  ProfileViewSection,
  ProfileViewSocial,
} from '../profile/PublicProfileView'
import type { LogoShape, ProfileHeaderStyle, ResolvedTheme, SocialStyle } from '../../themes'

export type BuilderDevice = 'mobile' | 'desktop'

type Props = {
  theme: ResolvedTheme
  device: BuilderDevice
  displayName: string
  avatarUrl?: string | null
  bio?: string | null
  logoUrl?: string | null
  links: ProfileViewLink[]
  sections?: ProfileViewSection[]
  socials?: ProfileViewSocial[]
  profileUrl: string
  showShare?: boolean
  socialStyle?: SocialStyle
  headerStyle?: ProfileHeaderStyle
  bannerUrl?: string | null
  logoShape?: LogoShape
  featuredLinkId?: string | null
}

// The builder canvas renders the SAME PublicProfileView used by the public page,
// so the preview can never drift from production. It is always non-interactive:
// no analytics are emitted from inside the builder.
export default function BuilderCanvas({
  theme,
  device,
  showShare = true,
  socialStyle = 'circle',
  headerStyle = 'classic',
  bannerUrl = null,
  logoShape = 'circle',
  featuredLinkId,
  ...rest
}: Props) {
  const view = (
    <PublicProfileView
      variant="embedded"
      interactive={false}
      theme={theme}
      showShare={showShare}
      socialStyle={socialStyle}
      headerStyle={headerStyle}
      bannerUrl={bannerUrl}
      logoShape={logoShape}
      featuredLinkId={featuredLinkId}
      {...rest}
    />
  )

  return (
    <div className="builder-canvas-bg thin-scroll h-full w-full overflow-y-auto overscroll-contain">
      <div className="flex min-h-full justify-center px-4 pb-32 pt-6 sm:px-6 lg:pb-28">
        {/* The outer wrapper persists so its max-width animates between the
            mobile and desktop widths; the keyed inner frame cross-fades. */}
        <div
          className="w-full transition-[max-width] duration-300 ease-out"
          style={{ maxWidth: device === 'mobile' ? 390 : 900 }}
        >
          <div key={device} className="anim-device-in">
            {device === 'mobile' ? (
              <div className="mx-auto w-[390px] max-w-full">
                <div className="rounded-[2.5rem] border-[6px] border-slate-900 bg-slate-900 p-2 shadow-2xl">
                  <div
                    className="thin-scroll h-[min(720px,calc(100dvh-230px))] overflow-y-auto overscroll-contain rounded-[2rem] bg-white"
                    aria-label="Mobile preview"
                  >
                    {view}
                  </div>
                </div>
              </div>
            ) : (
              <div className="w-full">
                <div className="overflow-hidden rounded-2xl border bg-white shadow-2xl">
                  <div className="flex items-center gap-1.5 border-b bg-muted/50 px-3 py-2">
                    <span className="h-2.5 w-2.5 rounded-full bg-red-400" />
                    <span className="h-2.5 w-2.5 rounded-full bg-amber-400" />
                    <span className="h-2.5 w-2.5 rounded-full bg-green-400" />
                  </div>
                  <div
                    className="thin-scroll h-[min(780px,calc(100dvh-240px))] overflow-y-auto overscroll-contain"
                    aria-label="Desktop preview"
                  >
                    {view}
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
