import { describe, it, expect, vi, afterEach } from 'vitest'
import { render, screen } from '@testing-library/react'
import PublicProfileView from '@frontend/components/profile/PublicProfileView'
import { parseSmartMetadata } from '@frontend/components/profile/smartLink'
import { resolveTheme } from '@frontend/themes'
import { extractLocation, isGoogleMapsUrl, resolveSmartLink } from '@backend/services/location'

const PLACE_URL =
  'https://www.google.com/maps/place/Studio+Lensawaktu,+Bogor,+Jawa+Barat/@-6.5,106.7,15z/data=!3m1'

describe('isGoogleMapsUrl', () => {
  it('recognises Google Maps URLs', () => {
    expect(isGoogleMapsUrl(PLACE_URL)).toBe(true)
    expect(isGoogleMapsUrl('https://maps.app.goo.gl/abc123')).toBe(true)
    expect(isGoogleMapsUrl('https://maps.google.com/?q=Bogor')).toBe(true)
    expect(isGoogleMapsUrl('https://www.google.co.id/maps/place/X')).toBe(true)
  })

  it('does not misclassify other URLs', () => {
    expect(isGoogleMapsUrl('https://example.com')).toBe(false)
    expect(isGoogleMapsUrl('https://www.google.com/search?q=maps')).toBe(false)
    expect(isGoogleMapsUrl('not a url')).toBe(false)
  })
})

describe('extractLocation', () => {
  it('extracts place name, address and coordinates', () => {
    const meta = extractLocation(PLACE_URL)
    expect(meta?.placeName).toBe('Studio Lensawaktu')
    expect(meta?.address).toBe('Bogor, Jawa Barat')
    expect(meta?.lat).toBeCloseTo(-6.5)
    expect(meta?.lng).toBeCloseTo(106.7)
  })

  it('extracts coordinates from a q= query', () => {
    const meta = extractLocation('https://www.google.com/maps?q=-6.5,106.7')
    expect(meta?.lat).toBeCloseTo(-6.5)
    expect(meta?.lng).toBeCloseTo(106.7)
    expect(meta?.placeName).toBeUndefined()
  })

  it('returns null when there is no usable location data', () => {
    expect(extractLocation('https://example.com')).toBeNull()
  })
})

describe('resolveSmartLink', () => {
  afterEach(() => vi.unstubAllGlobals())

  it('leaves regular links untouched (no metadata, no fetch)', async () => {
    const fetchSpy = vi.fn()
    vi.stubGlobal('fetch', fetchSpy)
    const result = await resolveSmartLink('https://example.com')
    expect(result).toEqual({ type: 'link', metadata: null })
    expect(fetchSpy).not.toHaveBeenCalled()
  })

  it('resolves a long Maps URL without any external request', async () => {
    const fetchSpy = vi.fn()
    vi.stubGlobal('fetch', fetchSpy)
    const result = await resolveSmartLink(PLACE_URL)
    expect(result.type).toBe('location')
    expect(result.metadata?.placeName).toBe('Studio Lensawaktu')
    expect(fetchSpy).not.toHaveBeenCalled()
  })

  it('expands short links server-side once, then extracts', async () => {
    const fetchSpy = vi.fn().mockResolvedValue({ url: PLACE_URL })
    vi.stubGlobal('fetch', fetchSpy)
    const result = await resolveSmartLink('https://maps.app.goo.gl/abc123')
    expect(fetchSpy).toHaveBeenCalledTimes(1)
    expect(result.type).toBe('location')
    expect(result.metadata?.source).toBe('url+redirect')
  })

  it('reverse geocodes coordinates that carry no address', async () => {
    const fetchSpy = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({
        address: {
          road: 'Jalan Melawai I',
          village: 'Melawai',
          city_district: 'Jakarta Selatan',
        },
      }),
    })
    vi.stubGlobal('fetch', fetchSpy)
    const result = await resolveSmartLink('https://www.google.com/maps?q=-6.5,106.7')
    expect(result.type).toBe('location')
    expect(result.metadata?.address).toBe('Jalan Melawai I, Melawai, Jakarta Selatan')
    expect(result.metadata?.source).toBe('url+geocode')
    expect(fetchSpy).toHaveBeenCalledTimes(1)
  })

  it('keeps the link usable when reverse geocoding fails', async () => {
    vi.stubGlobal('fetch', vi.fn().mockRejectedValue(new Error('offline')))
    const result = await resolveSmartLink('https://www.google.com/maps?q=-6.5,106.7')
    expect(result.type).toBe('location')
    expect(result.metadata?.address).toBeUndefined()
  })
})

describe('parseSmartMetadata', () => {
  it('parses location metadata and ignores regular/malformed links', () => {
    expect(parseSmartMetadata({ type: 'location', metadata: '{"placeName":"A"}' })?.placeName).toBe('A')
    expect(parseSmartMetadata({ type: 'link', metadata: '{"placeName":"A"}' })).toBeNull()
    expect(parseSmartMetadata({ type: 'location', metadata: '{bad' })).toBeNull()
  })
})

describe('PublicProfileView location smart link', () => {
  it('renders the resolved address as the subtitle without fetching on view', () => {
    const fetchSpy = vi.fn()
    vi.stubGlobal('fetch', fetchSpy)
    render(
      <PublicProfileView
        displayName="Jane"
        profileUrl="https://example.com/@jane"
        theme={resolveTheme({ themeId: 'mesh' })}
        links={[
          {
            id: '1',
            title: 'Kantor',
            url: PLACE_URL,
            icon: null,
            type: 'location',
            metadata: JSON.stringify({ placeName: 'Studio Lensawaktu', address: 'Bogor, Jawa Barat' }),
          },
        ]}
      />
    )
    expect(screen.getByText('Kantor')).toBeInTheDocument()
    expect(screen.getByText('Bogor, Jawa Barat')).toBeInTheDocument()
    expect(fetchSpy).not.toHaveBeenCalled()
    vi.unstubAllGlobals()
  })

  it('shows the address block when showLocation is enabled', () => {
    const meta = JSON.stringify({ placeName: 'Studio', address: 'Bogor', showLocation: true })
    render(
      <PublicProfileView
        displayName="Jane"
        profileUrl="https://example.com/@jane"
        theme={resolveTheme({ themeId: 'mesh' })}
        links={[
          { id: '1', title: 'Kantor', url: PLACE_URL, icon: null, type: 'location', metadata: meta },
        ]}
      />
    )
    expect(screen.getByText('Bogor')).toBeInTheDocument()
  })

  it('falls back to the place name when there is no address', () => {
    render(
      <PublicProfileView
        displayName="Jane"
        profileUrl="https://example.com/@jane"
        theme={resolveTheme({ themeId: 'mesh' })}
        links={[
          {
            id: '1',
            title: 'Kantor',
            url: PLACE_URL,
            icon: null,
            type: 'location',
            metadata: JSON.stringify({ placeName: 'Studio Lensawaktu' }),
          },
        ]}
      />
    )
    expect(screen.getByText('Studio Lensawaktu')).toBeInTheDocument()
  })

  it('never shows a meaningless "Location" placeholder', () => {
    const { container } = render(
      <PublicProfileView
        displayName="Jane"
        profileUrl="https://example.com/@jane"
        theme={resolveTheme({ themeId: 'mesh' })}
        links={[
          {
            id: '1',
            title: 'Titik Seduh Heritage',
            url: PLACE_URL,
            icon: null,
            type: 'location',
            // Place name matches the title, and there is no address: the card
            // must fall back to the URL instead of the word "Location".
            metadata: JSON.stringify({ placeName: 'Titik Seduh Heritage' }),
          },
        ]}
      />
    )
    expect(screen.queryByText('Location')).toBeNull()
    expect(container.textContent).toContain('google.com/maps')
  })

  it('falls back to the URL when the location block is hidden', () => {
    const { container } = render(
      <PublicProfileView
        displayName="Jane"
        profileUrl="https://example.com/@jane"
        theme={resolveTheme({ themeId: 'mesh' })}
        links={[
          {
            id: '1',
            title: 'Kantor',
            url: PLACE_URL,
            icon: null,
            type: 'location',
            metadata: JSON.stringify({ placeName: 'Studio', showLocation: false }),
          },
        ]}
      />
    )
    expect(screen.queryByText('Studio')).toBeNull()
    expect(container.textContent).toContain('google.com/maps')
  })

  it('degrades to a regular link when a Maps URL has no metadata', () => {
    render(
      <PublicProfileView
        displayName="Jane"
        profileUrl="https://example.com/@jane"
        theme={resolveTheme({ themeId: 'mesh' })}
        links={[{ id: '1', title: 'Website', url: 'https://example.com/page', icon: null, type: 'link' }]}
      />
    )
    expect(screen.getByText('example.com/page')).toBeInTheDocument()
  })

  it('aligns the location row with the card text alignment', () => {
    const { container } = render(
      <PublicProfileView
        displayName="Jane"
        profileUrl="https://example.com/@jane"
        theme={resolveTheme({ themeId: 'mesh' })}
        links={[
          {
            id: '1',
            title: 'Kantor',
            url: PLACE_URL,
            icon: null,
            type: 'location',
            align: 'center',
            metadata: JSON.stringify({ address: 'Bogor, Jawa Barat' }),
          },
        ]}
      />
    )
    const row = container.querySelector('.pp-link-sub')
    expect(row?.className).toContain('justify-center')
  })

  it('renders no outbound redirect icon on link cards', () => {
    const { container } = render(
      <PublicProfileView
        displayName="Jane"
        profileUrl="https://example.com/@jane"
        theme={resolveTheme({ themeId: 'mesh' })}
        links={[{ id: '1', title: 'Website', url: 'https://example.com/page', icon: null }]}
      />
    )
    expect(container.querySelector('.lucide-external-link')).toBeNull()
  })
})
