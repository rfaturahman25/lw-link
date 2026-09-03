import { useParams, useNavigate } from 'react-router-dom'
import { useEffect, useState } from 'react'
import { Github, Linkedin, Twitter, Globe, Mail, Link as LinkIcon, Instagram, Youtube, Facebook, ExternalLink, MessageCircle, FileSpreadsheet, FileText, ShoppingBag, Phone, Image as ImageIcon, Video, Music } from 'lucide-react'
import { QRCodeSVG } from 'qrcode.react'
import { api } from '../../services/api'

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

const PALETTE_STYLES: Record<string, { bgGradient: string; accentColor: string }> = {
  ocean: { bgGradient: 'linear-gradient(135deg, #0077b6 0%, #90e0ef 100%)', accentColor: '#0077b6' },
  sunset: { bgGradient: 'linear-gradient(135deg, #ff6b35 0%, #f7c59f 100%)', accentColor: '#ff6b35' },
  forest: { bgGradient: 'linear-gradient(135deg, #2d6a4f 0%, #74c69d 100%)', accentColor: '#2d6a4f' },
  berry: { bgGradient: 'linear-gradient(135deg, #9d0208 0%, #e85d04 100%)', accentColor: '#9d0208' },
  midnight: { bgGradient: 'linear-gradient(135deg, #03045e 0%, #90e0ef 100%)', accentColor: '#03045e' },
  candy: { bgGradient: 'linear-gradient(135deg, #ff006e 0%, #8338ec 100%)', accentColor: '#ff006e' },
  golden: { bgGradient: 'linear-gradient(135deg, #d4af37 0%, #fefae0 100%)', accentColor: '#d4af37' },
  monochrome: { bgGradient: 'linear-gradient(135deg, #000000 0%, #cccccc 100%)', accentColor: '#000000' },
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

  if (loading) return <div className="text-center py-16 text-muted-foreground">Loading @{clean}...</div>
  if (error || !data)
    return (
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
    )

  const profileUrl = `${window.location.origin}/@${data.user.username}`
  const themeBg = data.profile.backgroundColor || '#ffffff'
  const textColor = data.profile.textColor || '#000000'
  const paletteStyle = data.profile.colorPalette ? PALETTE_STYLES[data.profile.colorPalette] : null

  return (
    <div className="max-w-2xl mx-auto space-y-8" style={{ backgroundColor: themeBg, color: textColor }}>
      <div className="text-center space-y-4 py-6">
        {data.profile.logoUrl && (
          <div className="mb-4">
            <img src={data.profile.logoUrl} alt={`${data.user.displayName} logo`} className="h-16 w-auto max-w-[200px] object-contain mx-auto" />
          </div>
        )}
        <div className="h-28 w-28 rounded-full flex items-center justify-center mx-auto overflow-hidden" style={paletteStyle ? { background: paletteStyle.bgGradient } : { background: 'linear-gradient(135deg, var(--primary) 0%, #a855f7 100%)' }}>
          {data.user.avatarUrl ? (
            <img src={data.user.avatarUrl} alt={data.user.displayName} className="h-full w-full object-cover" />
          ) : (
            <span className="text-3xl font-bold text-white">{data.user.displayName.charAt(0).toUpperCase()}</span>
          )}
        </div>
        <h1 className="text-3xl font-bold">{data.user.displayName}</h1>
        <p className="text-muted-foreground">{data.profile.bio || 'No bio yet'}</p>
        <div className="flex flex-wrap justify-center gap-3 text-sm text-muted-foreground">
          {data.profile.company && <span>{data.profile.company}</span>}
          {data.profile.team && <span>• {data.profile.team}</span>}
        </div>
      </div>

      <div className="space-y-6">
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
          if (!hasSections && data.links.length === 0) return <p className="text-center text-muted-foreground py-8">No links yet</p>
          return (
            <>
              {sections.map((sec) => {
                const secLinks = bySection.get(sec.id) || []
                if (secLinks.length === 0) return null
                return (
                  <div key={sec.id} className="space-y-3">
                    <h3 className="text-sm font-bold tracking-widest text-muted-foreground uppercase text-center">{sec.title}</h3>
                    <div className="space-y-3">
                      {secLinks.map((link) => (
                        <a
                          key={link.id}
                          href={link.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          onClick={() => api.trackClick(clean, link.id).catch(() => {})}
                          className="group flex items-center justify-between rounded-xl border bg-white p-4 hover:shadow-md transition"
                          style={paletteStyle ? { borderColor: paletteStyle.accentColor + '40' } : {}}
                        >
                          <div className="flex items-center gap-3">
                            <div className="h-10 w-10 rounded-lg flex items-center justify-center" style={paletteStyle ? { backgroundColor: paletteStyle.accentColor + '20', color: paletteStyle.accentColor } : { backgroundColor: 'hsl(var(--primary) / 0.1)', color: 'hsl(var(--primary))' }}>{iconMap[link.icon || 'default'] || iconMap.default}</div>
                            <div className="text-left">
                              <p className="font-semibold text-gray-900">{link.title}</p>
                              <p className="text-xs text-muted-foreground truncate max-w-[220px]">{link.url.replace(/^https?:\/\//, '')}</p>
                            </div>
                          </div>
                          <ExternalLink className="h-5 w-5 text-muted-foreground group-hover:text-primary" />
                        </a>
                      ))}
                    </div>
                  </div>
                )
              })}
              {noSectionLinks.length > 0 && (
                <div className="space-y-3">
                  {hasSections && <h3 className="text-sm font-bold tracking-widest text-muted-foreground uppercase text-center">Links</h3>}
                  <div className="space-y-3">
                    {noSectionLinks.map((link) => (
                      <a
                        key={link.id}
                        href={link.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        onClick={() => api.trackClick(clean, link.id).catch(() => {})}
                        className="group flex items-center justify-between rounded-xl border bg-white p-4 hover:shadow-md transition"
                        style={paletteStyle ? { borderColor: paletteStyle.accentColor + '40' } : {}}
                      >
                        <div className="flex items-center gap-3">
                          <div className="h-10 w-10 rounded-lg flex items-center justify-center" style={paletteStyle ? { backgroundColor: paletteStyle.accentColor + '20', color: paletteStyle.accentColor } : { backgroundColor: 'hsl(var(--primary) / 0.1)', color: 'hsl(var(--primary))' }}>{iconMap[link.icon || 'default'] || iconMap.default}</div>
                          <div className="text-left">
                            <p className="font-semibold text-gray-900">{link.title}</p>
                            <p className="text-xs text-muted-foreground truncate max-w-[220px]">{link.url.replace(/^https?:\/\//, '')}</p>
                          </div>
                        </div>
                        <ExternalLink className="h-5 w-5 text-muted-foreground group-hover:text-primary" />
                      </a>
                    ))}
                  </div>
                </div>
              )}
              {hasSections && noSectionLinks.length === 0 && sections.every((s) => (bySection.get(s.id) || []).length === 0) && <p className="text-center text-muted-foreground py-8">No links yet</p>}
            </>
          )
        })()}
      </div>

      <div className="card p-6 text-center space-y-3 bg-white">
        <h3 className="font-semibold">Share</h3>
        <p className="text-sm text-muted-foreground break-all">{profileUrl}</p>
        <div className="flex justify-center bg-white p-4 rounded-lg">
          <QRCodeSVG value={profileUrl} size={180} />
        </div>
        <a href={`https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=${encodeURIComponent(profileUrl)}`} target="_blank" rel="noreferrer" className="text-sm text-primary hover:underline">
          Download QR (opens image)
        </a>
      </div>
    </div>
  )
}

export default PublicProfilePage
