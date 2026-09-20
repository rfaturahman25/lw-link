import PublicProfileView from './PublicProfileView'
import type {
  ProfileViewLink,
  ProfileViewSection,
  ProfileViewSocial,
} from './PublicProfileView'
import type { LogoShape, ResolvedTheme, SocialStyle } from '../../themes'

export type PreviewDeviceWidth = '390' | '430' | 'desktop'

type Props = {
  theme: ResolvedTheme
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
  headerStyle?: 'classic' | 'hero' | 'banner' | 'shape'
  bannerUrl?: string | null
  logoShape?: LogoShape
  featuredLinkId?: string | null
  deviceWidth?: PreviewDeviceWidth
}

const FRAME_WIDTH: Record<PreviewDeviceWidth, string> = {
  '390': 'w-[390px] max-w-full',
  '430': 'w-[430px] max-w-full',
  desktop: 'w-full',
}

export default function ProfilePreview({ deviceWidth = '390', ...props }: Props) {
  const isDesktop = deviceWidth === 'desktop'

  return (
    <div className={`mx-auto w-full ${isDesktop ? 'max-w-[560px]' : 'max-w-[430px]'}`}>
      <div
        className={`${FRAME_WIDTH[deviceWidth]} ${
          isDesktop
            ? 'overflow-hidden rounded-2xl border bg-white shadow-lg'
            : 'mx-auto rounded-[2.25rem] border-4 border-slate-900 bg-slate-900 p-2 shadow-xl'
        }`}
      >
        <div
          className={
            isDesktop ? 'overflow-hidden rounded-2xl bg-white' : 'overflow-hidden rounded-[1.75rem] bg-white'
          }
        >
          <div
            className={
              isDesktop ? 'max-h-[70vh] overflow-y-auto' : 'max-h-[60vh] overflow-y-auto sm:max-h-[560px]'
            }
          >
            <PublicProfileView variant="embedded" interactive={false} {...props} />
          </div>
        </div>
      </div>
      <p className="mt-3 text-center text-xs text-muted-foreground">
        Live preview — changes apply only after you save.
      </p>
    </div>
  )
}
