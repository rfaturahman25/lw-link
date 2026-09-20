import { describe, it, expect } from 'vitest'
import app from '../../src/backend/index'
import {
  buildProfileSeo,
  buildSitemapXml,
  escapeHtml,
  injectProfileSeo,
  readSeoFromThemeConfig,
} from '../../src/backend/utils/seo'

const SHELL = `<!doctype html><html><head>
    <meta name="description" content="Lensa Links — link sharing platform" />
    <title>Lensa Links</title>
  </head><body><div id="root"></div></body></html>`

describe('seo helpers', () => {
  it('escapes HTML-sensitive characters', () => {
    expect(escapeHtml('<a href="x">&</a>')).toBe(
      '&lt;a href=&quot;x&quot;&gt;&amp;&lt;/a&gt;'
    )
  })

  it('reads and trims SEO overrides from theme_config', () => {
    expect(readSeoFromThemeConfig(null)).toEqual({ title: '', description: '' })
    expect(readSeoFromThemeConfig('{not json')).toEqual({ title: '', description: '' })
    expect(
      readSeoFromThemeConfig(JSON.stringify({ seoTitle: '  Hi  ', seoDescription: ' Desc ' }))
    ).toEqual({ title: 'Hi', description: 'Desc' })
  })

  it('prefers SEO overrides and falls back to identity', () => {
    const withOverrides = buildProfileSeo({
      username: 'jane',
      displayName: 'Jane Doe',
      bio: 'Hello there',
      seoTitle: 'Custom',
      seoDescription: 'Custom desc',
      imageUrl: '/media/uploads/logo.png',
      origin: 'https://links.example.com',
      siteName: 'Lensa Links',
    })
    expect(withOverrides.title).toBe('Custom')
    expect(withOverrides.description).toBe('Custom desc')
    expect(withOverrides.canonicalUrl).toBe('https://links.example.com/@jane')
    expect(withOverrides.imageUrl).toBe('https://links.example.com/media/uploads/logo.png')

    const fallback = buildProfileSeo({
      username: 'jane',
      displayName: 'Jane Doe',
      bio: 'Hello there',
      origin: 'https://links.example.com',
      siteName: 'Lensa Links',
    })
    expect(fallback.title).toBe('Jane Doe — Hello there')
    expect(fallback.description).toBe('Hello there')
    expect(fallback.imageUrl).toBeNull()
  })

  it('injects canonical, Open Graph and Twitter tags and replaces the shell meta', () => {
    const meta = buildProfileSeo({
      username: 'jane',
      displayName: 'Jane Doe',
      bio: 'Hello there',
      imageUrl: 'https://cdn.example.com/a.png',
      origin: 'https://links.example.com',
      siteName: 'Lensa Links',
    })
    const out = injectProfileSeo(SHELL, meta)
    expect(out).toContain('<title>Jane Doe — Hello there</title>')
    expect(out).toContain('<meta name="description" content="Hello there">')
    expect(out).toContain('<link rel="canonical" href="https://links.example.com/@jane">')
    expect(out).toContain('<meta property="og:title" content="Jane Doe — Hello there">')
    expect(out).toContain('<meta property="og:image" content="https://cdn.example.com/a.png">')
    expect(out).toContain('<meta name="twitter:card" content="summary_large_image">')
    expect(out).not.toContain('Lensa Links — link sharing platform')
  })

  it('escapes user content before injecting it into the document', () => {
    const meta = buildProfileSeo({
      username: 'jane',
      displayName: '<script>alert(1)</script>',
      origin: 'https://links.example.com',
      siteName: 'Lensa Links',
    })
    const out = injectProfileSeo(SHELL, meta)
    expect(out).not.toContain('<script>alert(1)</script>')
    expect(out).toContain('&lt;script&gt;alert(1)&lt;/script&gt;')
  })

  it('builds a sitemap listing canonical profile URLs', () => {
    const xml = buildSitemapXml('https://links.example.com', ['jane', 'bob'])
    expect(xml).toContain('<loc>https://links.example.com/@jane</loc>')
    expect(xml).toContain('<loc>https://links.example.com/@bob</loc>')
    expect(xml).toContain('<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">')
  })
})

describe('seo routes', () => {
  const env = {
    DB: undefined as unknown as D1Database,
    NODE_ENV: 'test',
    SESSION_SECRET: 'x',
    ALLOWED_ORIGINS: '*',
    APP_NAME: 'Lensa Links',
  }

  it('serves an empty sitemap gracefully when the DB is unavailable', async () => {
    const res = await app.fetch(new Request('http://localhost/sitemap.xml'), env)
    expect(res.status).toBe(200)
    expect(res.headers.get('content-type')).toContain('xml')
    expect(await res.text()).toContain('<urlset')
  })

  it('falls back to a JSON 404 for a profile when assets/DB are unavailable', async () => {
    const res = await app.fetch(new Request('http://localhost/@nobody'), env)
    expect(res.status).toBe(404)
  })
})
