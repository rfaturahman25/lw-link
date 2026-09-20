// Server-side SEO helpers for the public profile page.
//
// The app is a client-side SPA, so `/@username` would otherwise be served the
// same generic index.html to every crawler. Crawlers that don't run JavaScript
// (WhatsApp, Facebook, X, Slack, Telegram) would therefore always see the
// generic "Lensa Links" card. These helpers build and inject per-profile meta
// into index.html on the Worker before it is returned.

export type ProfileSeoInput = {
  username: string
  displayName: string
  bio?: string | null
  seoTitle?: string | null
  seoDescription?: string | null
  imageUrl?: string | null
  origin: string
  siteName: string
}

export type ProfileSeo = {
  title: string
  description: string
  canonicalUrl: string
  imageUrl: string | null
  siteName: string
}

const MAX_TITLE = 120
const MAX_DESCRIPTION = 300

export function escapeHtml(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;')
}

function truncate(value: string, max: number): string {
  const trimmed = value.trim()
  return trimmed.length > max ? `${trimmed.slice(0, max - 1).trimEnd()}…` : trimmed
}

// Reads the optional seoTitle/seoDescription stored inside profiles.theme_config.
// Mirrors the frontend resolver but stays defensive: any malformed value yields
// empty strings so the derived defaults are used instead.
export function readSeoFromThemeConfig(raw: unknown): { title: string; description: string } {
  if (!raw) return { title: '', description: '' }
  let value: unknown = raw
  if (typeof raw === 'string') {
    try {
      value = JSON.parse(raw)
    } catch {
      return { title: '', description: '' }
    }
  }
  if (!value || typeof value !== 'object') return { title: '', description: '' }
  const cfg = value as { seoTitle?: unknown; seoDescription?: unknown }
  return {
    title: typeof cfg.seoTitle === 'string' ? cfg.seoTitle.trim() : '',
    description: typeof cfg.seoDescription === 'string' ? cfg.seoDescription.trim() : '',
  }
}

function absoluteImage(url: string | null | undefined, origin: string): string | null {
  const v = (url || '').trim()
  if (!v) return null
  if (/^https?:\/\//i.test(v)) return v
  if (v.startsWith('/')) return `${origin.replace(/\/$/, '')}${v}`
  return null
}

export function buildProfileSeo(input: ProfileSeoInput): ProfileSeo {
  const displayName = input.displayName?.trim() || `@${input.username}`
  const bio = (input.bio || '').trim()
  const derivedTitle = bio ? `${displayName} — ${truncate(bio, 60)}` : displayName
  const title = truncate(input.seoTitle?.trim() || derivedTitle, MAX_TITLE)
  const description = truncate(
    input.seoDescription?.trim() || bio || `${displayName} on ${input.siteName}`,
    MAX_DESCRIPTION
  )
  return {
    title,
    description,
    canonicalUrl: `${input.origin.replace(/\/$/, '')}/@${input.username}`,
    imageUrl: absoluteImage(input.imageUrl, input.origin),
    siteName: input.siteName,
  }
}

// Replace the generic <title>/description and append canonical + Open Graph +
// Twitter tags so non-JS crawlers get profile-specific metadata.
export function injectProfileSeo(html: string, seo: ProfileSeo): string {
  const tags = [
    `<link rel="canonical" href="${escapeHtml(seo.canonicalUrl)}">`,
    `<meta name="robots" content="index,follow">`,
    `<meta property="og:type" content="profile">`,
    `<meta property="og:site_name" content="${escapeHtml(seo.siteName)}">`,
    `<meta property="og:title" content="${escapeHtml(seo.title)}">`,
    `<meta property="og:description" content="${escapeHtml(seo.description)}">`,
    `<meta property="og:url" content="${escapeHtml(seo.canonicalUrl)}">`,
    `<meta name="twitter:card" content="${seo.imageUrl ? 'summary_large_image' : 'summary'}">`,
    `<meta name="twitter:title" content="${escapeHtml(seo.title)}">`,
    `<meta name="twitter:description" content="${escapeHtml(seo.description)}">`,
  ]
  if (seo.imageUrl) {
    tags.push(`<meta property="og:image" content="${escapeHtml(seo.imageUrl)}">`)
    tags.push(`<meta name="twitter:image" content="${escapeHtml(seo.imageUrl)}">`)
  }

  let out = html.replace(/<title>[\s\S]*?<\/title>/i, `<title>${escapeHtml(seo.title)}</title>`)
  const descTag = `<meta name="description" content="${escapeHtml(seo.description)}">`
  if (/<meta\s+name=["']description["'][^>]*>/i.test(out)) {
    out = out.replace(/<meta\s+name=["']description["'][^>]*>/i, descTag)
  } else {
    out = out.replace(/<\/head>/i, `    ${descTag}\n  </head>`)
  }
  out = out.replace(/<\/head>/i, `    ${tags.join('\n    ')}\n  </head>`)
  return out
}

export function buildSitemapXml(origin: string, usernames: string[]): string {
  const base = origin.replace(/\/$/, '')
  const urls = usernames
    .map((u) => `  <url><loc>${escapeHtml(`${base}/@${u}`)}</loc></url>`)
    .join('\n')
  return `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${urls}\n</urlset>`
}
