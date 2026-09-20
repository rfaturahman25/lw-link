import { useParams, useNavigate } from 'react-router-dom'
import { useEffect, useState } from 'react'
import { Link as LinkIcon } from 'lucide-react'
import { api } from '../../services/api'
import PublicProfileView from '../../components/profile/PublicProfileView'
import {
  loadFont,
  resolveLogoShape,
  resolveProfileTheme,
  resolveShowShare,
  resolveSocialStyle,
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
  }>
  sections?: Array<{ id: string; title: string; position: number }>
  socials?: Array<{ platform: string; value: string }>
}

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
        // SEO: title + meta
        document.title = `${res.data.user.displayName} — ${res.data.profile.bio?.slice(0, 60) || 'Lensa Links'}`
        const desc = res.data.profile.bio || `${res.data.user.displayName} on Lensa Links`
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
        setOg('og:title', res.data.user.displayName)
        setOg('og:description', desc.slice(0, 200))
        setOg('og:url', `${window.location.origin}/@${res.data.user.username}`)
        if (res.data.user.avatarUrl) setOg('og:image', res.data.user.avatarUrl)
        api.trackView(clean).catch(() => {})
      })
      .catch((e: unknown) => {
        const msg = e instanceof Error ? e.message : 'Not found'
        setError(
          msg.includes('404') || msg.includes('not') ? 'Profile not found or unpublished' : msg
        )
      })
      .finally(() => setLoading(false))
  }, [clean])

  // Only the active theme's font is fetched (on demand).
  const themeFont = data ? resolveProfileTheme(data.profile).typography.fontFamily : undefined
  useEffect(() => {
    loadFont(themeFont)
  }, [themeFont])

  // Themed loading / error keep neutral (not palette) to avoid flash — full viewport, no app shell
  if (loading)
    return (
      <div className="min-h-[100dvh] min-h-screen w-full flex items-center justify-center bg-[#f8fafc]">
        <p className="py-16 text-center text-sm text-muted-foreground">Loading profile…</p>
      </div>
    )
  if (error || !data)
    return (
      <div className="min-h-[100dvh] min-h-screen w-full bg-[#f8fafc] flex items-center justify-center px-4">
        <div className="max-w-lg mx-auto text-center space-y-6 py-16">
          <div className="inline-flex h-16 w-16 items-center justify-center rounded-full bg-muted text-muted-foreground mx-auto">
            <LinkIcon className="h-8 w-8" />
          </div>
          <div className="space-y-2">
            <h1 className="text-4xl font-bold">404</h1>
            <h2 className="text-xl font-semibold">This page doesn't exist</h2>
            <p className="text-sm text-muted-foreground">
              The profile you're looking for doesn't exist or may have been removed.
            </p>
          </div>
          <div className="flex justify-center gap-3">
            <a
              href="/"
              className="inline-flex items-center justify-center rounded-md bg-primary px-6 py-2.5 text-sm font-medium text-primary-foreground cursor-pointer transition-all duration-200 ease-out hover:bg-primary/90 hover:-translate-y-0.5 hover:shadow-md active:scale-[0.97] active:translate-y-0 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 motion-reduce:transition-none motion-reduce:hover:transform-none"
            >
              Back to Home
            </a>
            <a
              href="/login"
              className="inline-flex items-center justify-center rounded-md border bg-white px-6 py-2.5 text-sm cursor-pointer transition-all duration-200 ease-out hover:bg-accent hover:-translate-y-0.5 hover:shadow-sm hover:border-black/10 active:scale-[0.97] active:translate-y-0 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 motion-reduce:transition-none motion-reduce:hover:transform-none"
            >
              Go to Login
            </a>
          </div>
          <p className="text-xs text-muted-foreground">Lensa Links</p>
        </div>
      </div>
    )

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
      interactive
      onLinkClick={(linkId) => api.trackClick(clean, linkId).catch(() => {})}
      onSocialClick={(platform) => api.trackSocialClick(clean, platform).catch(() => {})}
    />
  )
}

export default PublicProfilePage
