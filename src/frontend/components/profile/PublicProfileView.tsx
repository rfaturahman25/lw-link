import { useState } from 'react'
import type { MouseEvent as ReactMouseEvent, ReactNode } from 'react'
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
  Copy,
  Check,
  Download,
  MapPin,
} from 'lucide-react'
import { QRCodeSVG } from 'qrcode.react'
import { themeToCssVars } from '../../themes'
import type { ResolvedTheme, SocialStyle } from '../../themes'
import { socialHref, socialIcon } from './socialMeta'
import { parseSmartMetadata } from './smartLink'

export type ProfileViewLink = {
  id: string
  title: string
  url: string
  icon: string | null
  sectionId?: string | null
  type?: string | null
  metadata?: string | null
}
export type ProfileViewSection = { id: string; title: string; position?: number }
export type ProfileViewSocial = { platform: string; value: string }

type Props = {
  displayName: string
  avatarUrl?: string | null
  bio?: string | null
  logoUrl?: string | null
  links: ProfileViewLink[]
  sections?: ProfileViewSection[]
  socials?: ProfileViewSocial[]
  profileUrl: string
  theme: ResolvedTheme
  interactive?: boolean
  onLinkClick?: (linkId: string) => void
  onSocialClick?: (platform: string) => void
  variant?: 'page' | 'embedded'
  footerText?: string
  showShare?: boolean
  socialStyle?: SocialStyle
  headerStyle?: 'classic' | 'hero' | 'banner' | 'shape'
  bannerUrl?: string | null
}

const iconMap: Record<string, ReactNode> = {
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

export default function PublicProfileView({
  displayName,
  avatarUrl,
  bio,
  logoUrl,
  links,
  sections = [],
  socials = [],
  profileUrl,
  theme,
  interactive = false,
  onLinkClick,
  onSocialClick,
  variant = 'page',
  footerText = 'Lensa Links',
  showShare = true,
  socialStyle = 'circle',
  headerStyle = 'classic',
  bannerUrl = null,
}: Props) {
  const [copied, setCopied] = useState(false)
  const embedded = variant === 'embedded'

  const copyProfileLink = async () => {
    try {
      if (navigator.clipboard?.writeText) {
        await navigator.clipboard.writeText(profileUrl)
      } else {
        const ta = document.createElement('textarea')
        ta.value = profileUrl
        ta.setAttribute('readonly', '')
        ta.style.position = 'absolute'
        ta.style.left = '-9999px'
        document.body.appendChild(ta)
        ta.select()
        document.execCommand('copy')
        document.body.removeChild(ta)
      }
      setCopied(true)
      window.setTimeout(() => setCopied(false), 2000)
    } catch {
      // clipboard unavailable — no-op
    }
  }

  const handleLinkClick = (e: ReactMouseEvent, linkId: string) => {
    if (!interactive) {
      e.preventDefault()
      return
    }
    onLinkClick?.(linkId)
  }

  const bySection = new Map<string | null, ProfileViewLink[]>()
  for (const l of links) {
    const key = l.sectionId || null
    if (!bySection.has(key)) bySection.set(key, [])
    bySection.get(key)!.push(l)
  }
  const noSectionLinks = bySection.get(null) || []
  const hasSections = sections.length > 0
  const visibleSections = sections.filter((s) => (bySection.get(s.id) || []).length > 0)

  const LinkCard = ({ link }: { link: ProfileViewLink }) => {
    // Smart Link (location): metadata comes from the server, never from the user.
    const loc = link.type === 'location' ? parseSmartMetadata(link) : null
    const titleNorm = link.title.trim().toLowerCase()
    const placeDiffers = !!loc?.placeName && loc.placeName.trim().toLowerCase() !== titleNorm
    const locPrimary = loc ? (placeDiffers ? loc.placeName : loc.address || 'Location') : null
    const locSecondary = placeDiffers && loc?.address ? loc.address : null
    const showLoc = !!loc && loc.showLocation !== false

    const body = (
      <>
        <div className="flex min-w-0 items-center gap-3.5">
          <div
            className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl"
            style={{ background: 'var(--pp-link-icon-bg)', color: 'var(--pp-link-icon-color)' }}
          >
            {iconMap[link.icon || 'default'] || iconMap.default}
          </div>
          <div className="min-w-0 text-left">
            <p
              className="text-[15px] font-semibold leading-tight"
              style={{ color: 'var(--pp-link-text)' }}
            >
              {link.title}
            </p>
            {showLoc ? (
              <div className="mt-1 space-y-0.5">
                <p
                  className="flex items-center gap-1 text-xs"
                  style={{ color: 'var(--pp-link-secondary)' }}
                >
                  <MapPin className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />
                  <span className="truncate">{locPrimary}</span>
                </p>
                {locSecondary && (
                  <p
                    className="break-words text-xs leading-snug"
                    style={{ color: 'var(--pp-link-secondary)' }}
                  >
                    {locSecondary}
                  </p>
                )}
              </div>
            ) : (
              <p className="mt-1 truncate text-xs" style={{ color: 'var(--pp-link-secondary)' }}>
                {link.url.replace(/^https?:\/\//, '')}
              </p>
            )}
          </div>
        </div>
        <ExternalLink
          className="h-4 w-4 shrink-0 opacity-70 transition-opacity duration-200 ease-out group-hover:opacity-100"
          style={{ color: 'var(--pp-link-secondary)' }}
        />
      </>
    )

    return (
      <a
        href={link.url}
        target={interactive ? '_blank' : undefined}
        rel={interactive ? 'noopener noreferrer' : undefined}
        onClick={(e) => handleLinkClick(e, link.id)}
        className="pp-link pp-interactive group flex items-center justify-between gap-3 px-4 py-3.5"
      >
        {body}
      </a>
    )
  }

  const logoNode = logoUrl ? (
    <img
      src={logoUrl}
      alt={`${displayName} logo`}
      className="mx-auto h-12 w-auto max-w-[160px] object-contain opacity-90"
    />
  ) : null

  const avatarNode = (
    <div className="pp-card mx-auto flex h-24 w-24 items-center justify-center overflow-hidden rounded-full sm:h-28 sm:w-28">
      {avatarUrl ? (
        <img src={avatarUrl} alt={displayName} className="h-full w-full object-cover" />
      ) : (
        <span className="text-2xl font-semibold sm:text-3xl" style={{ color: 'var(--pp-text)' }}>
          {displayName.charAt(0).toUpperCase()}
        </span>
      )}
    </div>
  )

  const nameNode = (
    <h1
      className="text-[28px] font-bold leading-tight tracking-tight sm:text-[32px]"
      style={{ color: 'var(--pp-text)' }}
    >
      {displayName}
    </h1>
  )

  const bioNode = bio?.trim() ? (
    <p
      className="mx-auto max-w-[360px] break-words text-pretty text-[15px] leading-relaxed sm:max-w-[400px]"
      style={{ color: 'var(--pp-text-secondary)' }}
    >
      {bio}
    </p>
  ) : null

  const bannerFallback = { background: 'linear-gradient(135deg, var(--pp-accent-soft), transparent)' }
  const bannerImg = (h: string) =>
    bannerUrl ? (
      <img src={bannerUrl} alt="" className={`${h} w-full rounded-2xl object-cover`} />
    ) : (
      <div className={`${h} w-full rounded-2xl`} style={bannerFallback} />
    )

  const headerInner =
    headerStyle === 'banner' ? (
      <>
        <div>
          {bannerImg('h-28 sm:h-32')}
          <div className="-mt-10 flex justify-center">{avatarNode}</div>
        </div>
        {logoNode}
        {nameNode}
        {bioNode}
      </>
    ) : headerStyle === 'hero' ? (
      <>
        <div className="relative">
          {bannerImg('h-36 sm:h-44')}
          <div className="absolute inset-x-0 -bottom-10 flex justify-center">{avatarNode}</div>
        </div>
        <div className="space-y-3 pt-10">
          {logoNode}
          {nameNode}
          {bioNode}
        </div>
      </>
    ) : headerStyle === 'shape' ? (
      <>
        {logoNode}
        <div className="relative mx-auto h-24 w-24 sm:h-28 sm:w-28">
          <div
            className="absolute inset-0 rotate-6 rounded-[28px]"
            style={{ background: 'var(--pp-accent-soft)' }}
          />
          <div className="pp-card relative flex h-full w-full items-center justify-center overflow-hidden rounded-[24px]">
            {avatarUrl ? (
              <img src={avatarUrl} alt={displayName} className="h-full w-full object-cover" />
            ) : (
              <span
                className="text-2xl font-semibold sm:text-3xl"
                style={{ color: 'var(--pp-text)' }}
              >
                {displayName.charAt(0).toUpperCase()}
              </span>
            )}
          </div>
        </div>
        {nameNode}
        {bioNode}
      </>
    ) : (
      <>
        {logoNode}
        {avatarNode}
        {nameNode}
        {bioNode}
      </>
    )

  return (
    <div
      className={`pp-root w-full ${embedded ? '' : 'min-h-[100dvh] min-h-screen'}`}
      style={themeToCssVars(theme)}
    >
      <div
        className={`mx-auto w-full max-w-[480px] space-y-8 ${
          embedded ? 'px-4 py-8' : 'animate-fade-in px-4 py-12 motion-reduce:animate-none sm:px-5 sm:py-16'
        }`}
      >
        <div className="space-y-5 pb-1 text-center">
          {headerInner}
          {socials.length > 0 && (
            <div className="flex flex-wrap items-center justify-center gap-2.5 pt-1">
              {socials.map((s, idx) => (
                <a
                  key={`${s.platform}-${idx}`}
                  href={socialHref(s.platform, s.value)}
                  target={interactive ? '_blank' : undefined}
                  rel={interactive ? 'noopener noreferrer' : undefined}
                  aria-label={`${s.platform} — ${s.value}`}
                  onClick={(e) => {
                    if (!interactive) {
                      e.preventDefault()
                      return
                    }
                    onSocialClick?.(s.platform)
                  }}
                  className={
                    socialStyle === 'plain'
                      ? 'pp-social-plain pp-interactive inline-flex h-10 w-10 items-center justify-center'
                      : 'pp-social pp-interactive inline-flex h-10 w-10 items-center justify-center rounded-full'
                  }
                >
                  {socialIcon(s.platform)}
                </a>
              ))}
            </div>
          )}
        </div>

        <div className="space-y-5">
          {!hasSections && links.length === 0 && (
            <p className="py-8 text-center text-sm" style={{ color: 'var(--pp-text-secondary)' }}>
              No links yet
            </p>
          )}
          {visibleSections.map((sec) => (
            <div key={sec.id} className="space-y-3">
              <h2
                className="text-center text-[11px] font-semibold uppercase tracking-[0.16em]"
                style={{ color: 'var(--pp-text-secondary)' }}
              >
                {sec.title}
              </h2>
              <div className="space-y-3">
                {(bySection.get(sec.id) || []).map((link) => (
                  <LinkCard key={link.id} link={link} />
                ))}
              </div>
            </div>
          ))}
          {noSectionLinks.length > 0 && (
            <div className="space-y-3">
              {hasSections && (
                <h2
                  className="text-center text-[11px] font-semibold uppercase tracking-[0.16em]"
                  style={{ color: 'var(--pp-text-secondary)' }}
                >
                  Links
                </h2>
              )}
              <div className="space-y-3">
                {noSectionLinks.map((link) => (
                  <LinkCard key={link.id} link={link} />
                ))}
              </div>
            </div>
          )}
        </div>

        {showShare && (
          <div className="pp-card space-y-4 p-5 text-center">
            <p
              className="text-[11px] font-semibold uppercase tracking-[0.16em]"
              style={{ color: 'var(--pp-text-secondary)' }}
            >
              Share profile
            </p>
            <div className="flex justify-center rounded-xl bg-white p-3">
              <QRCodeSVG value={profileUrl} size={embedded ? 120 : 140} />
            </div>
            <div className="grid grid-cols-2 gap-2.5">
              <button
                type="button"
                onClick={copyProfileLink}
                className={`pp-ghost pp-interactive inline-flex items-center justify-center gap-2 px-3 py-2.5 text-[13px] font-medium ${copied ? 'text-[color:var(--pp-accent)]' : ''}`}
              >
                {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                <span className="truncate" aria-live="polite">
                  {copied ? 'Copied' : 'Copy link'}
                </span>
              </button>
              <a
                href={`https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=${encodeURIComponent(profileUrl)}`}
                target="_blank"
                rel="noreferrer"
                className="pp-ghost pp-interactive inline-flex items-center justify-center gap-2 px-3 py-2.5 text-[13px] font-medium"
              >
                <Download className="h-4 w-4" />
                <span className="truncate">QR code</span>
              </a>
            </div>
          </div>
        )}

        {footerText && (
          <p className="text-center text-[11px] tracking-wide" style={{ color: 'var(--pp-text-secondary)', opacity: 0.6 }}>
            {footerText}
          </p>
        )}
      </div>
    </div>
  )
}
