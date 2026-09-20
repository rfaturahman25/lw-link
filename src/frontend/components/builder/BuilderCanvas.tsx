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
          className="my-auto w-full transition-[max-width] duration-300 ease-out"
          style={{ maxWidth: device === 'mobile' ? 390 : 900 }}
        >
          <div key={device} className="anim-device-in">
            {device === 'mobile' ? (
              <div className="mx-auto w-[390px] max-w-full">
                {/* Device body: soft bezel gradient, side buttons, island and a
                    home indicator, so the preview reads as a real phone. */}
                <div className="relative rounded-[3rem] bg-gradient-to-b from-slate-800 via-slate-900 to-black p-3 shadow-[0_35px_70px_-20px_rgba(15,23,42,0.55)] ring-1 ring-slate-900/40">
                  <span
                    className="absolute -left-[3px] top-[128px] h-8 w-[3px] rounded-l-md bg-slate-700"
                    aria-hidden="true"
                  />
                  <span
                    className="absolute -left-[3px] top-[176px] h-14 w-[3px] rounded-l-md bg-slate-700"
                    aria-hidden="true"
                  />
                  <span
                    className="absolute -right-[3px] top-[150px] h-20 w-[3px] rounded-r-md bg-slate-700"
                    aria-hidden="true"
                  />

                  {/* Top bezel + dynamic island */}
                  <div
                    className="relative mb-2 flex h-6 items-center justify-center"
                    aria-hidden="true"
                  >
                    <span className="h-5 w-24 rounded-full bg-black" />
                    <span className="absolute right-7 h-2.5 w-2.5 rounded-full bg-slate-700" />
                  </div>

                  {/* Screen: a single, chrome-less scroll surface. */}
                  <div className="overflow-hidden rounded-[2.25rem] bg-white">
                    <div
                      className="no-scrollbar overflow-y-auto overscroll-contain"
                      style={{ height: 'min(660px, max(380px, calc(100dvh - 320px)))' }}
                      aria-label="Mobile preview"
                    >
                      {view}
                    </div>
                  </div>

                  {/* Bottom bezel + home indicator */}
                  <div
                    className="mt-2 flex h-4 items-center justify-center"
                    aria-hidden="true"
                  >
                    <span className="h-1 w-28 rounded-full bg-slate-600" />
                  </div>
                </div>
              </div>
            ) : (
              <div className="w-full">
                {/* Browser chrome shares the phone's dark palette so the
                    mobile↔desktop transition stays visually continuous. */}
                <div className="rounded-2xl bg-gradient-to-b from-slate-800 via-slate-900 to-black p-2 shadow-[0_35px_70px_-20px_rgba(15,23,42,0.55)] ring-1 ring-slate-900/40">
                  <div className="flex items-center gap-1.5 px-2 pb-2">
                    <span className="h-2.5 w-2.5 rounded-full bg-red-400" />
                    <span className="h-2.5 w-2.5 rounded-full bg-amber-400" />
                    <span className="h-2.5 w-2.5 rounded-full bg-green-400" />
                    <span
                      className="ml-2 h-5 w-full max-w-[320px] rounded-full bg-white/10"
                      aria-hidden="true"
                    />
                  </div>
                  <div className="overflow-hidden rounded-xl bg-white">
                    <div
                      className="thin-scroll overflow-y-auto overscroll-contain"
                      style={{ height: 'min(780px, max(360px, calc(100dvh - 260px)))' }}
                      aria-label="Desktop preview"
                    >
                      {view}
                    </div>
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
