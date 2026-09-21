import { useParams, useNavigate } from 'react-router-dom'
import { useEffect, useState } from 'react'
import { Link as LinkIcon } from 'lucide-react'
import { api } from '../../services/api'
import PublicProfileView from '../../components/profile/PublicProfileView'
import {
  loadFont,
  resolveFeaturedLinkId,
  resolveLogoShape,
  resolveProfileTheme,
  resolveSeo,
  resolveShowShare,
  resolveSocialStyle,
  resolveTheme,
  themeToCssVars,
} from '../../themes'

type ProfileData = {
  user: { username: string; displayName: string; avatarUrl: string | null }
  profile: {
    bio: string | null
    theme?: string
    backgroundColor?: string
    textColor?: string
    buttonStyle?: string | null
    fontFamily?: string | null
    colorPalette?: string | null
    headerStyle?: string | null
    bannerUrl?: string | null
    logoUrl?: string | null
    themeConfig?: string | null
  }
  links: Array<{
    id: string
    title: string
    url: string
    icon: string | null
    sectionId: string | null
    type?: string | null
    metadata?: string | null
    showUrl?: boolean | null
    thumbnail?: string | null
  }>
  sections?: Array<{ id: string; title: string; position: number }>
  socials?: Array<{ platform: string; value: string }>
}

// Neutral placeholder tokens used while the profile resolves. The default
// preset's gradient (a pink/indigo mesh) used to flash before the owner's real
// theme arrived, so the skeleton uses a plain neutral surface instead.
const PLACEHOLDER_VARS = (() => {
  const base = resolveTheme(null)
  return themeToCssVars({
    ...base,
    background: { color: '#f4f4f5' },
    colors: {
      ...base.colors,
      card: '#e4e4e7',
      text: '#a1a1aa',
      textSecondary: '#d4d4d8',
    },
  })
})()

const LoadingState = () => (
  <div className="pp-root w-full min-h-[100dvh] min-h-screen" style={PLACEHOLDER_VARS}>
    <div className="pp-shell">
      <div className="pp-content animate-pulse motion-reduce:animate-none" aria-busy="true">
        <div className="space-y-3">
          <div className="pp-avatar mx-auto" />
          <div className="mx-auto h-7 w-40 rounded-full" style={{ background: 'var(--pp-card)' }} />
          <div className="mx-auto h-4 w-56 rounded-full" style={{ background: 'var(--pp-card)' }} />
        </div>
        <div className="pp-links">
          {[0, 1, 2].map((i) => (
            <div key={i} className="pp-link" aria-hidden="true" />
          ))}
        </div>
        <span className="sr-only">Loading profile…</span>
      </div>
    </div>
  </div>
)

const ErrorState = ({ message }: { message: string }) => (
  <div
    className="pp-root w-full min-h-[100dvh] min-h-screen"
    style={themeToCssVars(resolveTheme(null))}
  >
    <div className="pp-content">
      <div className="pp-card mx-auto mt-10 w-full max-w-md space-y-5 p-8 text-center">
        <div
          className="mx-auto inline-flex h-16 w-16 items-center justify-center rounded-full"
          style={{ background: 'var(--pp-accent-soft)', color: 'var(--pp-accent)' }}
        >
          <LinkIcon className="h-8 w-8" />
        </div>
        <div className="space-y-2">
          <h1 className="text-3xl font-bold tracking-tight" style={{ color: 'var(--pp-text)' }}>
            Page not found
          </h1>
          <p className="text-sm" style={{ color: 'var(--pp-text-secondary)' }}>
            {message}
          </p>
        </div>
        <div className="flex justify-center">
          <a
            href="/login"
            className="pp-btn pp-interactive inline-flex items-center justify-center px-6 py-2.5 text-sm font-medium"
          >
            Go to login
          </a>
        </div>
        <p className="text-xs" style={{ color: 'var(--pp-text-secondary)', opacity: 0.7 }}>
          Lensa Links
        </p>
      </div>
    </div>
  </div>
)

const PublicProfilePage = () => {
  const { username } = useParams<{ username: string }>()
  const navigate = useNavigate()
  const raw = (() => {
    try {
      return decodeURIComponent(username || '')
    } catch {
      return username || ''
    }
  })()
  // Handle encoded %40 -> redirect to canonical /@username
  useEffect(() => {
    if (username && username.startsWith('%40')) {
      const canonical = `/@${raw.replace(/^@/, '')}`
      navigate(canonical, { replace: true })
    }
  }, [username, raw, navigate])
  const clean = raw.replace(/^@/, '').toLowerCase()
  const [data, setData] = useState<ProfileData | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!clean) return
    setLoading(true)
    api
      .publicProfile(clean)
      .then((r: unknown) => {
        const res = r as { success: boolean; data: ProfileData }
        setData(res.data)
        // SEO: title + meta. Explicit SEO overrides win over the derived defaults.
        const seo = resolveSeo(res.data.profile)
        document.title =
          seo.title ||
          `${res.data.user.displayName} — ${res.data.profile.bio?.slice(0, 60) || 'Lensa Links'}`
        const desc =
          seo.description ||
          res.data.profile.bio ||
          `${res.data.user.displayName} on Lensa Links`
        let meta = document.querySelector('meta[name="description"]') as HTMLMetaElement | null
        if (!meta) {
          meta = document.createElement('meta')
          meta.name = 'description'
          document.head.appendChild(meta)
        }
        meta.content = desc.slice(0, 160)
        // OG
        const setOg = (prop: string, content: string) => {
          let el = document.querySelector(`meta[property="${prop}"]`) as HTMLMetaElement | null
          if (!el) {
            el = document.createElement('meta')
            el.setAttribute('property', prop)
            document.head.appendChild(el)
          }
          el.content = content
        }
        setOg('og:title', seo.title || res.data.user.displayName)
        setOg('og:description', desc.slice(0, 200))
        setOg('og:url', `${window.location.origin}/@${res.data.user.username}`)
        if (res.data.user.avatarUrl) setOg('og:image', res.data.user.avatarUrl)
        // Reflect the profile theme in browser chrome / mobile address bar.
        const resolved = resolveProfileTheme(res.data.profile)
        const themeColor = document.querySelector('meta[name="theme-color"]')
        if (themeColor) themeColor.setAttribute('content', resolved.background.color)
        api.trackView(clean).catch(() => {})
      })
      .catch((e: unknown) => {
        const msg = e instanceof Error ? e.message : 'Not found'
        setError(
          msg.includes('404') || msg.includes('not')
            ? 'The profile you are looking for does not exist or may have been removed.'
            : 'Something went wrong while loading this profile. Please try again later.'
        )
      })
      .finally(() => setLoading(false))
  }, [clean])

  // Only the active theme's font is fetched (on demand).
  const themeFont = data ? resolveProfileTheme(data.profile).typography.fontFamily : undefined
  useEffect(() => {
    loadFont(themeFont)
  }, [themeFont])

  if (loading) return <LoadingState />
  if (error || !data) return <ErrorState message={error || 'Profile not found.'} />

  const profileUrl = `${window.location.origin}/@${data.user.username}`
  const theme = resolveProfileTheme(data.profile)

  return (
    <PublicProfileView
      displayName={data.user.displayName}
      avatarUrl={data.user.avatarUrl}
      bio={data.profile.bio}
      logoUrl={data.profile.logoUrl ?? null}
      headerStyle={(data.profile.headerStyle as 'classic' | 'hero' | 'banner' | 'shape') ?? 'classic'}
      bannerUrl={data.profile.bannerUrl ?? null}
      links={data.links}
      sections={data.sections || []}
      socials={data.socials || []}
      profileUrl={profileUrl}
      theme={theme}
      showShare={resolveShowShare(data.profile)}
      socialStyle={resolveSocialStyle(data.profile)}
      logoShape={resolveLogoShape(data.profile)}
      featuredLinkId={resolveFeaturedLinkId(data.profile)}
      interactive
      onLinkClick={(linkId) => api.trackClick(clean, linkId).catch(() => {})}
      onSocialClick={(platform) => api.trackSocialClick(clean, platform).catch(() => {})}
    />
  )
}

export default PublicProfilePage
