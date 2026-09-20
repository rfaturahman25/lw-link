import PublicProfileView from './PublicProfileView'
import type {
  ProfileViewLink,
  ProfileViewSection,
  ProfileViewSocial,
} from './PublicProfileView'
import type { LogoShape, ResolvedTheme, SocialStyle } from '../../themes'

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
}

export default function ProfilePreview(props: Props) {
  return (
    <div className="mx-auto w-full max-w-[340px]">
      <div className="rounded-[2.25rem] border-4 border-slate-900 bg-slate-900 p-2 shadow-xl">
        <div className="overflow-hidden rounded-[1.75rem] bg-white">
          <div className="max-h-[60vh] overflow-y-auto sm:max-h-[560px]">
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
