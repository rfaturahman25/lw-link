// Smart Link metadata resolution.
//
// We deliberately avoid external geocoding APIs: there is no reliable, key-free
// provider, and we must not fake data. Instead we extract only what Google Maps
// URLs actually contain (place slug + coordinates). Short links (maps.app.goo.gl)
// are expanded once, server-side, at save time — never on a public page view.

export type LocationMetadata = {
  placeName?: string
  address?: string
  lat?: number
  lng?: number
  source: 'url' | 'url+redirect'
  // User preference: embed a map on the public profile (set from the editor).
  showLocation?: boolean
}

export type SmartLink = {
  type: 'link' | 'location'
  metadata: LocationMetadata | null
}

function safeUrl(url: string): URL | null {
  try {
    return new URL(url)
  } catch {
    return null
  }
}

function isGoogleHost(host: string): boolean {
  return /(^|\.)google\.[a-z.]+$/i.test(host) || host === 'goo.gl'
}

export function isGoogleMapsUrl(url: string): boolean {
  const u = safeUrl(url)
  if (!u) return false
  const host = u.hostname.toLowerCase()
  if (host === 'maps.app.goo.gl') return true
  if (host === 'goo.gl') return u.pathname.startsWith('/maps')
  if (host === 'maps.google.com') return true
  if (isGoogleHost(host) && u.pathname.startsWith('/maps')) return true
  return false
}

const COORD_RE = /(-?\d{1,3}\.\d+),\s*(-?\d{1,3}\.\d+)/

// Extract place/coords from an already-expanded Maps URL. Returns null if the URL
// carries no usable location data (so the caller degrades to a regular link).
export function extractLocation(url: string): LocationMetadata | null {
  const u = safeUrl(url)
  if (!u) return null
  const meta: LocationMetadata = { source: 'url' }

  const atMatch = u.pathname.match(/@(-?\d{1,3}\.\d+),(-?\d{1,3}\.\d+)/)
  if (atMatch) {
    meta.lat = parseFloat(atMatch[1])
    meta.lng = parseFloat(atMatch[2])
  }

  const query =
    u.searchParams.get('q') ||
    u.searchParams.get('query') ||
    u.searchParams.get('ll') ||
    u.searchParams.get('destination')

  if (meta.lat === undefined && query) {
    const coord = query.match(COORD_RE)
    if (coord) {
      meta.lat = parseFloat(coord[1])
      meta.lng = parseFloat(coord[2])
    }
  }

  const placeMatch = u.pathname.match(/\/maps\/place\/([^/]+)/)
  const rawPlace = placeMatch
    ? decodeURIComponent(placeMatch[1].replace(/\+/g, ' '))
    : query && !COORD_RE.test(query)
      ? decodeURIComponent(query.replace(/\+/g, ' '))
      : null

  if (rawPlace) {
    const parts = rawPlace
      .split(',')
      .map((s) => s.trim())
      .filter(Boolean)
    if (parts.length > 0) {
      meta.placeName = parts[0]
      if (parts.length > 1) meta.address = parts.slice(1).join(', ')
    }
  }

  if (!meta.placeName && meta.lat === undefined) return null
  return meta
}

const SHORT_HOSTS = new Set(['maps.app.goo.gl'])

async function expandShortUrl(url: string): Promise<string> {
  const controller = new AbortController()
  const timer = setTimeout(() => controller.abort(), 4000)
  try {
    const res = await fetch(url, {
      redirect: 'follow',
      signal: controller.signal,
      headers: { 'User-Agent': 'Lensa-Links/1.0 (+https://links.lensawaktu.id)' },
    })
    return res.url || url
  } catch {
    return url
  } finally {
    clearTimeout(timer)
  }
}

// Entry point used by the links API on create/update. Never called on public views.
export async function resolveSmartLink(url: string): Promise<SmartLink> {
  if (!isGoogleMapsUrl(url)) return { type: 'link', metadata: null }

  const u = safeUrl(url)
  const host = u?.hostname.toLowerCase() ?? ''
  const isShort = SHORT_HOSTS.has(host) || (host === 'goo.gl' && (u?.pathname.startsWith('/maps') ?? false))

  let target = url
  if (isShort) target = await expandShortUrl(url)

  const metadata = extractLocation(target)
  if (!metadata) {
    // Recognised as a Maps link but no extractable metadata -> degrade gracefully.
    return { type: 'link', metadata: null }
  }
  if (isShort && target !== url) metadata.source = 'url+redirect'
  return { type: 'location', metadata }
}
