export type SmartLinkMetadata = {
  placeName?: string
  address?: string
  lat?: number
  lng?: number
  source?: string
  showLocation?: boolean
}

// Lightweight client-side check so the editor can recognise a Maps URL before saving.
export function isMapsUrl(url: string): boolean {
  const v = url.trim()
  if (!v) return false
  try {
    const u = new URL(/^https?:\/\//i.test(v) ? v : `https://${v}`)
    const host = u.hostname.toLowerCase()
    if (host === 'maps.app.goo.gl') return true
    if (host === 'goo.gl') return u.pathname.startsWith('/maps')
    if (host === 'maps.google.com') return true
    if (/(^|\.)google\.[a-z.]+$/i.test(host) && u.pathname.startsWith('/maps')) return true
    return false
  } catch {
    return false
  }
}


// Parses the server-resolved metadata stored on a smart link. Returns null for
// regular links or malformed data so the renderer always degrades to a plain link.
export function parseSmartMetadata(link: {
  type?: string | null
  metadata?: string | null
}): SmartLinkMetadata | null {
  if (!link || !link.type || link.type === 'link' || !link.metadata) return null
  try {
    const parsed = JSON.parse(link.metadata) as unknown
    if (!parsed || typeof parsed !== 'object') return null
    return parsed as SmartLinkMetadata
  } catch {
    return null
  }
}
