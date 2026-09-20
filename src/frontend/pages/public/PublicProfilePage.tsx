import { useParams, useNavigate } from 'react-router-dom'
import { useEffect, useState } from 'react'
import { Github, Linkedin, Twitter, Globe, Mail, Link as LinkIcon, Instagram, Youtube, Facebook, ExternalLink, MessageCircle, FileSpreadsheet, FileText, ShoppingBag, Phone, Image as ImageIcon, Video, Music } from 'lucide-react'
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
  profile: { bio: string | null; team: string | null; company: string | null; theme?: string; backgroundColor?: string; textColor?: string; colorPalette?: string | null; logoUrl?: string | null }
  links: Array<{ id: string; title: string; url: string; icon: string | null; sectionId: string | null }>
  sections?: Array<{ id: string; title: string; position: number }>
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
        setError(msg.includes('404') || msg.includes('not') ? 'Profile not found or unpublished' : msg)
      })
      .finally(() => setLoading(false))
  }, [clean])

  // Themed loading / error keep neutral (not palette) to avoid flash
  if (loading) return <div className="min-h-screen flex items-center justify-center bg-[#f8fafc]"><p className="text-center py-16 text-muted-foreground">Loading @{clean}...</p></div>
  if (error || !data)
    return (
      <div className="min-h-screen bg-[#f8fafc] flex items-center justify-center px-4">
        <div className="max-w-lg mx-auto text-center space-y-6 py-16">
          <div className="inline-flex h-16 w-16 items-center justify-center rounded-full bg-muted text-muted-foreground mx-auto">
            <LinkIcon className="h-8 w-8" />
          </div>
          <div className="space-y-2">
            <h1 className="text-4xl font-bold">404</h1>
            <h2 className="text-xl font-semibold">This page doesn't exist</h2>
            <p className="text-sm text-muted-foreground">The Linktree page you're looking for doesn't exist or may have been removed.</p>
            {error && <p className="text-xs text-muted-foreground">@{clean} — {error}</p>}
          </div>
          <div className="flex justify-center gap-3">
            <a href="/" className="inline-flex items-center justify-center rounded-md bg-primary px-6 py-2.5 text-sm font-medium text-primary-foreground hover:bg-primary/90">
              Back to Home
            </a>
            <a href="/login" className="inline-flex items-center justify-center rounded-md border px-6 py-2.5 text-sm hover:bg-accent">
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
    <div className="min-h-screen w-full" style={{ background: tokens.pageBackground, color: tokens.pageText }}>
      <div className="mx-auto max-w-[480px] space-y-7 px-4 py-10 sm:py-12">
        <div className="text-center space-y-4 pb-2">
          {data.profile.logoUrl && (
            <div className="mb-2">
              <img src={data.profile.logoUrl} alt={`${data.user.displayName} logo`} className="h-12 w-auto max-w-[160px] object-contain mx-auto opacity-90" />
            </div>
          )}
          <div className="h-24 w-24 overflow-hidden rounded-full bg-white shadow-sm ring-1 flex items-center justify-center mx-auto" style={{ borderColor: tokens.border }}>
            {data.user.avatarUrl ? (
              <img src={data.user.avatarUrl} alt={data.user.displayName} className="h-full w-full object-cover" />
            ) : (
              <span className="text-2xl font-semibold" style={{ color: tokens.cardText }}>{data.user.displayName.charAt(0).toUpperCase()}</span>
            )}
          </div>
          <div className="space-y-1.5">
            <h1 className="text-[26px] font-semibold tracking-tight leading-none" style={{ color: tokens.pageText }}>{data.user.displayName}</h1>
            <p className="text-[13px] font-medium tracking-wide" style={{ color: tokens.pageTextSecondary }}>@{data.user.username}</p>
          </div>
          <p className="mx-auto max-w-[360px] text-[14px] leading-[1.6] text-pretty" style={{ color: tokens.pageTextSecondary }}>{data.profile.bio || 'No bio yet'}</p>
          {(data.profile.company || data.profile.team) && (
            <div className="flex flex-wrap justify-center gap-2 text-xs" style={{ color: tokens.pageTextSecondary }}>
              {data.profile.company && <span>{data.profile.company}</span>}
              {data.profile.company && data.profile.team && <span style={{ opacity: 0.4 }}>·</span>}
              {data.profile.team && <span>{data.profile.team}</span>}
            </div>
          )}
        </div>

      <div className="space-y-5">
        {(() => {
          const sections = (data as unknown as { sections?: Array<{ id: string; title: string }> }).sections || []
          const bySection = new Map<string | null, typeof data.links>()
          for (const l of data.links) {
            const key = (l as unknown as { sectionId?: string | null }).sectionId || null
            if (!bySection.has(key)) bySection.set(key, [])
            bySection.get(key)!.push(l)
          }
          const noSectionLinks = bySection.get(null) || []
          const hasSections = sections.length > 0
          if (!hasSections && data.links.length === 0) return <p className="text-center py-8 text-sm" style={{ color: tokens.pageTextSecondary }}>No links yet</p>
          const LinkCard = ({ link }: { link: (typeof data.links)[number] }) => (
            <a
              href={link.url}
              target="_blank"
              rel="noopener noreferrer"
              onClick={() => api.trackClick(clean, link.id).catch(() => {})}
              className="group flex items-center justify-between rounded-[14px] border bg-white px-4 py-[14px] transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-black/10 active:scale-[0.98]"
              style={{ borderColor: tokens.border, boxShadow: tokens.shadow }}
            >
              <div className="flex items-center gap-3.5">
                <div className="h-9 w-9 rounded-xl flex items-center justify-center shrink-0 bg-[#f8fafc] border" style={{ borderColor: tokens.border, color: tokens.iconColor }}>{iconMap[link.icon || 'default'] || iconMap.default}</div>
                <div className="text-left">
                  <p className="text-[14px] font-medium leading-none" style={{ color: tokens.cardText }}>{link.title}</p>
                  <p className="text-xs truncate max-w-[220px] mt-1" style={{ color: tokens.cardTextSecondary }}>{link.url.replace(/^https?:\/\//, '')}</p>
                </div>
              </div>
              <ExternalLink className="h-4 w-4 shrink-0" style={{ color: tokens.cardTextSecondary, opacity: 0.7 }} />
            </a>
          )
          return (
            <>
              {sections.map((sec) => {
                const secLinks = bySection.get(sec.id) || []
                if (secLinks.length === 0) return null
                return (
                  <div key={sec.id} className="space-y-3">
                    <h3 className="text-[11px] font-semibold tracking-[0.14em] uppercase text-center" style={{ color: tokens.pageTextSecondary }}>{sec.title}</h3>
                    <div className="space-y-3">
                      {secLinks.map((link) => <LinkCard key={link.id} link={link} />)}
                    </div>
                  </div>
                )
              })}
              {noSectionLinks.length > 0 && (
                <div className="space-y-3">
                  {hasSections && <h3 className="text-[11px] font-semibold tracking-[0.14em] uppercase text-center" style={{ color: tokens.pageTextSecondary }}>Links</h3>}
                  <div className="space-y-3">
                    {noSectionLinks.map((link) => <LinkCard key={link.id} link={link} />)}
                  </div>
                </div>
              )}
              {hasSections && noSectionLinks.length === 0 && sections.every((s) => (bySection.get(s.id) || []).length === 0) && <p className="text-center py-8 text-sm" style={{ color: tokens.pageTextSecondary }}>No links yet</p>}
            </>
          )
        })()}
      </div>

      <div className="rounded-[14px] border bg-white p-5 text-center space-y-3" style={{ borderColor: tokens.border, boxShadow: tokens.shadow }}>
        <p className="text-[11px] font-semibold tracking-[0.14em] uppercase" style={{ color: tokens.pageTextSecondary }}>Share profile</p>
        <p className="text-xs break-all" style={{ color: tokens.cardTextSecondary }}>{profileUrl}</p>
        <div className="flex justify-center p-3 rounded-xl bg-white border" style={{ borderColor: tokens.border }}>
          <QRCodeSVG value={profileUrl} size={140} />
        </div>
        <a href={`https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=${encodeURIComponent(profileUrl)}`} target="_blank" rel="noreferrer" className="text-xs underline decoration-black/10 underline-offset-4 hover:decoration-black/20" style={{ color: tokens.cardTextSecondary }}>
          Download QR
        </a>
      </div>
      <p className="text-center text-[11px] tracking-wide" style={{ color: tokens.pageTextSecondary, opacity: 0.6 }}>lensawaktu.id • @{data.user.username}</p>
      </div>
    </div>
  )
}

export default PublicProfilePage
