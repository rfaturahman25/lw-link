import { useParams, useNavigate } from 'react-router-dom'
import { useEffect, useState } from 'react'
import {
  Github,
  Linkedin,
  Twitter,
  Globe,
  Mail,
  Link as LinkIcon,
  Instagram,
  Youtube,
  Facebook,
  ExternalLink,
  MessageCircle,
  FileSpreadsheet,
  FileText,
  ShoppingBag,
  Phone,
  Image as ImageIcon,
  Video,
  Music,
} from 'lucide-react'
import { QRCodeSVG } from 'qrcode.react'
import { api } from '../../services/api'
import { getThemeTokens } from '../../utils/theme'

const iconMap: Record<string, React.ReactNode> = {
  github: <Github className="h-5 w-5" />,
  linkedin: <Linkedin className="h-5 w-5" />,
  twitter: <Twitter className="h-5 w-5" />,
  globe: <Globe className="h-5 w-5" />,
  mail: <Mail className="h-5 w-5" />,
  instagram: <Instagram className="h-5 w-5" />,
  youtube: <Youtube className="h-5 w-5" />,
  facebook: <Facebook className="h-5 w-5" />,
  whatsapp: <MessageCircle className="h-5 w-5" />,
  sheet: <FileSpreadsheet className="h-5 w-5" />,
  file: <FileText className="h-5 w-5" />,
  shop: <ShoppingBag className="h-5 w-5" />,
  phone: <Phone className="h-5 w-5" />,
  image: <ImageIcon className="h-5 w-5" />,
  video: <Video className="h-5 w-5" />,
  music: <Music className="h-5 w-5" />,
  tiktok: <Music className="h-5 w-5" />,
  link: <LinkIcon className="h-5 w-5" />,
  default: <LinkIcon className="h-5 w-5" />,
}

type ProfileData = {
  user: { username: string; displayName: string; avatarUrl: string | null }
  profile: {
    bio: string | null
    theme?: string
    backgroundColor?: string
    textColor?: string
    colorPalette?: string | null
    logoUrl?: string | null
  }
  links: Array<{
    id: string
    title: string
    url: string
    icon: string | null
    sectionId: string | null
  }>
  sections?: Array<{ id: string; title: string; position: number }>
  socials?: Array<{ platform: string; value: string; enabled?: boolean; position?: number }>
}

// Keep for type compat but actual tokens come from getThemeTokens (full-page theming)
// Previously only used for avatar + link borders, now centralized in utils/theme.ts

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
        document.title = `${res.data.user.displayName} — ${res.data.profile.bio?.slice(0, 60) || 'LW-link'}`
        const desc = res.data.profile.bio || `${res.data.user.displayName} on LW-link`
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

  // Themed loading / error keep neutral (not palette) to avoid flash — full viewport, no app shell
  if (loading)
    return (
      <div className="min-h-[100dvh] min-h-screen w-full flex items-center justify-center bg-[#f8fafc]">
        <p className="text-center py-16 text-muted-foreground">Loading @{clean}...</p>
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
              The Linktree page you're looking for doesn't exist or may have been removed.
            </p>
            {error && (
              <p className="text-xs text-muted-foreground">
                @{clean} — {error}
              </p>
            )}
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
          <p className="text-xs text-muted-foreground">LW-link • Internal Linktree</p>
        </div>
      </div>
    )

  const profileUrl = `${window.location.origin}/@${data.user.username}`
  const tokens = getThemeTokens({
    colorPalette: data.profile.colorPalette ?? null,
    backgroundColor: data.profile.backgroundColor ?? null,
    textColor: data.profile.textColor ?? null,
  })

  return (
    <div
      className="min-h-[100dvh] min-h-screen w-full"
      style={{ background: tokens.pageBackground, color: tokens.pageText }}
    >
      <div className="mx-auto max-w-[480px] space-y-7 px-4 py-10 sm:py-12 w-full">
        <div className="text-center space-y-4 pb-2">
          {data.profile.logoUrl && (
            <div className="mb-2">
              <img
                src={data.profile.logoUrl}
                alt={`${data.user.displayName} logo`}
                className="h-12 w-auto max-w-[160px] object-contain mx-auto opacity-90"
              />
            </div>
          )}
          <div
            className="h-24 w-24 overflow-hidden rounded-full bg-white shadow-sm ring-1 flex items-center justify-center mx-auto"
            style={{ borderColor: tokens.border }}
          >
            {data.user.avatarUrl ? (
              <img
                src={data.user.avatarUrl}
                alt={data.user.displayName}
                className="h-full w-full object-cover"
              />
            ) : (
              <span className="text-2xl font-semibold" style={{ color: tokens.cardText }}>
                {data.user.displayName.charAt(0).toUpperCase()}
              </span>
            )}
          </div>
          <div className="space-y-1">
            <h1
              className="text-[26px] font-semibold tracking-tight leading-none"
              style={{ color: tokens.pageText }}
            >
              {data.user.displayName}
            </h1>
          </div>
          {data.profile.bio?.trim() && (
            <p
              className="mx-auto max-w-[360px] text-[14px] leading-[1.6] text-pretty"
              style={{ color: tokens.pageTextSecondary }}
            >
              {data.profile.bio}
            </p>
          )}
          {(() => {
            const socials = (data as unknown as { socials?: Array<{ platform: string; value: string }> }).socials || []
            if (socials.length === 0) return null
            const socialIconMap: Record<string, React.ReactNode> = {
              instagram: <Instagram className="h-[18px] w-[18px]" />,
              tiktok: <Music className="h-[18px] w-[18px]" />,
              threads: <MessageCircle className="h-[18px] w-[18px]" />,
              youtube: <Youtube className="h-[18px] w-[18px]" />,
              twitter: <Twitter className="h-[18px] w-[18px]" />,
              facebook: <Facebook className="h-[18px] w-[18px]" />,
              linkedin: <Linkedin className="h-[18px] w-[18px]" />,
              github: <Github className="h-[18px] w-[18px]" />,
              email: <Mail className="h-[18px] w-[18px]" />,
              phone: <Phone className="h-[18px] w-[18px]" />,
              website: <Globe className="h-[18px] w-[18px]" />,
            }
            const toHref = (platform: string, value: string) => {
              const v = value.trim()
              if (/^https?:\/\//i.test(v) || /^mailto:/i.test(v) || /^tel:/i.test(v)) return v
              const handle = v.replace(/^@/, '')
              switch (platform) {
                case 'instagram':
                  return `https://instagram.com/${handle}`
                case 'tiktok':
                  return `https://tiktok.com/@${handle}`
                case 'threads':
                  return `https://threads.net/@${handle}`
                case 'youtube':
                  return handle.includes('.') || handle.includes('/') ? `https://${handle}` : `https://youtube.com/@${handle}`
                case 'twitter':
                  return `https://twitter.com/${handle}`
                case 'facebook':
                  return `https://facebook.com/${handle}`
                case 'linkedin':
                  return `https://linkedin.com/in/${handle}`
                case 'github':
                  return `https://github.com/${handle}`
                case 'email':
                  return `mailto:${v}`
                case 'phone':
                  return `tel:${v}`
                case 'website':
                  return v.startsWith('http') ? v : `https://${v}`
                default:
                  return v.startsWith('http') ? v : `https://${v}`
              }
            }
            return (
              <div className="flex flex-wrap items-center justify-center gap-2.5 pt-1">
                {socials.map((s, idx) => (
                  <a
                    key={`${s.platform}-${idx}`}
                    href={toHref(s.platform, s.value)}
                    target="_blank"
                    rel="noopener noreferrer"
                    aria-label={`${s.platform} — ${s.value}`}
                    className="inline-flex h-10 w-10 items-center justify-center rounded-full border bg-white cursor-pointer transition-all duration-200 ease-out hover:-translate-y-0.5 hover:scale-105 hover:!border-black/10 hover:!shadow-[0_6px_16px_rgba(0,0,0,0.08),0_1px_4px_rgba(0,0,0,0.06)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-black/10 focus-visible:ring-offset-2 focus-visible:ring-offset-white active:scale-95 active:translate-y-0 motion-reduce:transition-none motion-reduce:hover:transform-none"
                    style={{ borderColor: tokens.border, boxShadow: tokens.shadow, color: tokens.iconColor }}
                  >
                    {socialIconMap[s.platform] || <LinkIcon className="h-[18px] w-[18px]" />}
                  </a>
                ))}
              </div>
            )
          })()}
        </div>

        <div className="space-y-5">
          {(() => {
            const sections =
              (data as unknown as { sections?: Array<{ id: string; title: string }> }).sections ||
              []
            const bySection = new Map<string | null, typeof data.links>()
            for (const l of data.links) {
              const key = (l as unknown as { sectionId?: string | null }).sectionId || null
              if (!bySection.has(key)) bySection.set(key, [])
              bySection.get(key)!.push(l)
            }
            const noSectionLinks = bySection.get(null) || []
            const hasSections = sections.length > 0
            if (!hasSections && data.links.length === 0)
              return (
                <p className="text-center py-8 text-sm" style={{ color: tokens.pageTextSecondary }}>
                  No links yet
                </p>
              )
            const LinkCard = ({ link }: { link: (typeof data.links)[number] }) => (
              <a
                href={link.url}
                target="_blank"
                rel="noopener noreferrer"
                onClick={() => api.trackClick(clean, link.id).catch(() => {})}
                className="group flex items-center justify-between rounded-[14px] border bg-white px-4 py-[14px] cursor-pointer transition-all duration-200 ease-out hover:-translate-y-0.5 hover:!border-black/[0.08] hover:!shadow-[0_8px_24px_rgba(0,0,0,0.08),0_2px_8px_rgba(0,0,0,0.06)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-black/10 focus-visible:ring-offset-2 focus-visible:ring-offset-white active:scale-[0.97] active:translate-y-0 motion-reduce:transition-none motion-reduce:hover:transform-none"
                style={{ borderColor: tokens.border, boxShadow: tokens.shadow }}
              >
                <div className="flex items-center gap-3.5">
                  <div
                    className="h-9 w-9 rounded-xl flex items-center justify-center shrink-0 bg-[#f8fafc] border transition-all duration-200 ease-out group-hover:scale-105 group-hover:bg-white group-hover:shadow-sm motion-reduce:transition-none"
                    style={{ borderColor: tokens.border, color: tokens.iconColor }}
                  >
                    {iconMap[link.icon || 'default'] || iconMap.default}
                  </div>
                  <div className="text-left">
                    <p
                      className="text-[14px] font-medium leading-none"
                      style={{ color: tokens.cardText }}
                    >
                      {link.title}
                    </p>
                    <p
                      className="text-xs truncate max-w-[220px] mt-1"
                      style={{ color: tokens.cardTextSecondary }}
                    >
                      {link.url.replace(/^https?:\/\//, '')}
                    </p>
                  </div>
                </div>
                <ExternalLink
                  className="h-4 w-4 shrink-0 transition-all duration-200 ease-out group-hover:translate-x-0.5 group-hover:opacity-100 motion-reduce:transition-none"
                  style={{ color: tokens.cardTextSecondary, opacity: 0.7 }}
                />
              </a>
            )
            return (
              <>
                {sections.map((sec) => {
                  const secLinks = bySection.get(sec.id) || []
                  if (secLinks.length === 0) return null
                  return (
                    <div key={sec.id} className="space-y-3">
                      <h3
                        className="text-[11px] font-semibold tracking-[0.14em] uppercase text-center"
                        style={{ color: tokens.pageTextSecondary }}
                      >
                        {sec.title}
                      </h3>
                      <div className="space-y-3">
                        {secLinks.map((link) => (
                          <LinkCard key={link.id} link={link} />
                        ))}
                      </div>
                    </div>
                  )
                })}
                {noSectionLinks.length > 0 && (
                  <div className="space-y-3">
                    {hasSections && (
                      <h3
                        className="text-[11px] font-semibold tracking-[0.14em] uppercase text-center"
                        style={{ color: tokens.pageTextSecondary }}
                      >
                        Links
                      </h3>
                    )}
                    <div className="space-y-3">
                      {noSectionLinks.map((link) => (
                        <LinkCard key={link.id} link={link} />
                      ))}
                    </div>
                  </div>
                )}
                {hasSections &&
                  noSectionLinks.length === 0 &&
                  sections.every((s) => (bySection.get(s.id) || []).length === 0) && (
                    <p
                      className="text-center py-8 text-sm"
                      style={{ color: tokens.pageTextSecondary }}
                    >
                      No links yet
                    </p>
                  )}
              </>
            )
          })()}
        </div>

        <div
          className="rounded-[14px] border bg-white p-5 text-center space-y-3"
          style={{ borderColor: tokens.border, boxShadow: tokens.shadow }}
        >
          <p
            className="text-[11px] font-semibold tracking-[0.14em] uppercase"
            style={{ color: tokens.pageTextSecondary }}
          >
            Share profile
          </p>
          <p className="text-xs break-all" style={{ color: tokens.cardTextSecondary }}>
            {profileUrl}
          </p>
          <div
            className="flex justify-center p-3 rounded-xl bg-white border"
            style={{ borderColor: tokens.border }}
          >
            <QRCodeSVG value={profileUrl} size={140} />
          </div>
          <a
            href={`https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=${encodeURIComponent(profileUrl)}`}
            target="_blank"
            rel="noreferrer"
            className="inline-flex items-center justify-center rounded-sm px-1 py-0.5 text-xs underline decoration-black/10 underline-offset-4 cursor-pointer transition-all duration-200 ease-out hover:decoration-black/30 hover:text-black focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-black/10 focus-visible:ring-offset-2 active:scale-[0.97] motion-reduce:transition-none"
            style={{ color: tokens.cardTextSecondary }}
          >
            Download QR
          </a>
        </div>
        <p
          className="text-center text-[11px] tracking-wide"
          style={{ color: tokens.pageTextSecondary, opacity: 0.6 }}
        >
          lensawaktu.id
        </p>
      </div>
    </div>
  )
}

export default PublicProfilePage
