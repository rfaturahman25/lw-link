import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import PublicProfileView from '@frontend/components/profile/PublicProfileView'
import {
  THEMES,
  THEME_MAP,
  parseStoredThemeConfig,
  resolveProfileTheme,
  resolveSeo,
  resolveShowShare,
  resolveTheme,
  themeToCssVars,
  toDraftConfig,
} from '@frontend/themes'
import type { AvatarShape, ContentWidth } from '@frontend/themes'

const LEGACY_PALETTES = [
  'ocean',
  'sunset',
  'forest',
  'berry',
  'midnight',
  'candy',
  'golden',
  'monochrome',
]

describe('theme presets', () => {
  it('provides a varied set of presets with unique ids', () => {
    expect(THEMES.length).toBeGreaterThanOrEqual(8)
    expect(new Set(THEMES.map((t) => t.id)).size).toBe(THEMES.length)
    expect(THEMES.some((t) => t.isDark)).toBe(true)
  })
})

describe('theme resolver (backward compatibility)', () => {
  it('maps every legacy color palette to an existing theme', () => {
    for (const p of LEGACY_PALETTES) {
      const id = resolveProfileTheme({ colorPalette: p, themeConfig: null }).id
      expect(THEME_MAP[id]).toBeTruthy()
    }
  })

  it('falls back to the default theme when nothing is configured', () => {
    expect(resolveProfileTheme({ colorPalette: null, themeConfig: null }).id).toBe('mesh')
    expect(resolveProfileTheme(undefined).id).toBe('mesh')
  })

  it('keeps legacy button/font fields for profiles without theme_config', () => {
    const t = resolveProfileTheme({
      colorPalette: 'sunset',
      themeConfig: null,
      buttonStyle: 'pill',
      fontFamily: 'poppins',
    })
    expect(t.button.shape).toBe('pill')
    expect(t.typography.fontFamily).toBe('poppins')
  })
})

describe('theme config parsing and overrides', () => {
  it('parses a JSON string config', () => {
    const cfg = parseStoredThemeConfig(
      JSON.stringify({ themeId: 'aurora', overrides: { buttonShape: 'pill' } })
    )
    expect(cfg?.themeId).toBe('aurora')
    expect(cfg?.overrides?.buttonShape).toBe('pill')
  })

  it('rejects an unknown theme id and falls back', () => {
    expect(resolveProfileTheme({ themeConfig: JSON.stringify({ themeId: 'nope' }) }).id).toBe(
      'mesh'
    )
    expect(parseStoredThemeConfig('{not json')).toBeNull()
  })

  it('applies user overrides on top of the selected theme', () => {
    const t = resolveTheme({
      themeId: 'mesh',
      overrides: { accentColor: '#ff0000', buttonShape: 'pill', fontFamily: 'poppins' },
    })
    expect(t.colors.accent).toBe('#ff0000')
    expect(t.button.shape).toBe('pill')
    expect(t.typography.fontFamily).toBe('poppins')
  })

  it('prefers theme_config over the legacy palette', () => {
    const t = resolveProfileTheme({
      colorPalette: 'ocean',
      themeConfig: JSON.stringify({ themeId: 'aurora' }),
    })
    expect(t.id).toBe('aurora')
  })

  it('reflects the button shape on link cards (radius/outlined)', () => {
    const vars = (shape: 'pill' | 'square' | 'outlined' | 'elevated') =>
      themeToCssVars(resolveTheme({ themeId: 'mesh', overrides: { buttonShape: shape } })) as Record<
        string,
        string
      >
    expect(vars('pill')['--pp-link-radius']).toBe('9999px')
    expect(vars('square')['--pp-link-radius']).toBe('0px')
    expect(vars('outlined')['--pp-link-bg']).toBe('transparent')
    expect(vars('outlined')['--pp-link-text']).toBeTruthy()
    expect(vars('elevated')['--pp-link-shadow']).toContain('rgba(0,0,0,0.18)')
  })

  it('reflects the button colour override on both buttons and link cards', () => {
    const vars = themeToCssVars(
      resolveTheme({ themeId: 'mesh', overrides: { buttonColor: '#ff0000' } })
    ) as Record<string, string>
    expect(vars['--pp-btn-bg']).toBe('#ff0000')
    expect(vars['--pp-link-bg']).toBe('#ff0000')
  })

  it('parses showShare and defaults to visible', () => {
    expect(
      parseStoredThemeConfig(JSON.stringify({ themeId: 'mesh', showShare: false }))?.showShare
    ).toBe(false)
    expect(resolveShowShare({ themeConfig: JSON.stringify({ themeId: 'mesh' }) })).toBe(true)
    expect(
      resolveShowShare({ themeConfig: JSON.stringify({ themeId: 'mesh', showShare: false }) })
    ).toBe(false)
  })

  it('emits theme CSS variables including rgba card colour', () => {
    const vars = themeToCssVars(resolveTheme({ themeId: 'aurora' })) as Record<string, string>
    expect(vars['--pp-bg-color']).toBe('#070b14')
    expect(vars['--pp-card']).toMatch(/^rgba\(/)
    expect(vars['--pp-font']).toContain('Sora')
  })
})

describe('theme layout options', () => {
  it('resolves layout options into CSS variables', () => {
    const t = resolveTheme({
      themeId: 'mesh',
      avatarShape: 'hex',
      nameTreatment: 'gradient',
      contentWidth: 'wide',
      density: 'compact',
      profileAlign: 'left',
    })
    expect(t.layout.avatarShape).toBe('hex')
    expect(t.layout.contentWidth).toBe('wide')
    expect(t.layout.align).toBe('left')
    const vars = themeToCssVars(t) as Record<string, string>
    expect(vars['--pp-content-width']).toBe('560px')
    expect(vars['--pp-avatar-radius']).toBe('0px')
    expect(vars['--pp-name-gradient']).toContain('linear-gradient')
    expect(vars['--pp-align']).toBe('left')
  })

  it('defaults layout options safely for old configs', () => {
    const t = resolveTheme({ themeId: 'mesh' })
    expect(t.layout).toEqual({
      avatarShape: 'circle',
      nameTreatment: 'solid',
      socialIconStyle: 'surface',
      contentWidth: 'cozy',
      density: 'comfortable',
      align: 'center',
      featuredLinkId: null,
      typeScale: 1,
      avatarSize: 'md',
      avatarRing: true,
    })
  })

  it('keeps newer curated fonts from legacy fontFamily values', () => {
    const t = resolveProfileTheme({ themeConfig: null, colorPalette: null, fontFamily: 'outfit' })
    expect(t.typography.fontFamily).toBe('outfit')
  })

  it('round-trips layout options through the draft config', () => {
    const draft = toDraftConfig({
      themeConfig: JSON.stringify({
        themeId: 'aurora',
        avatarShape: 'squircle',
        contentWidth: 'compact',
        featuredLinkId: 'link-1',
      }),
    })
    expect(draft.avatarShape).toBe('squircle')
    expect(draft.contentWidth).toBe('compact')
    expect(draft.featuredLinkId).toBe('link-1')
  })
})

describe('visual builder theme options', () => {
  it('clamps the type scale and reflects it in CSS variables', () => {
    const low = resolveTheme({ themeId: 'mesh', typeScale: 0.1 })
    const high = resolveTheme({ themeId: 'mesh', typeScale: 9 })
    expect(low.layout.typeScale).toBe(0.9)
    expect(high.layout.typeScale).toBe(1.15)
    const vars = themeToCssVars(resolveTheme({ themeId: 'mesh', typeScale: 1.1 })) as Record<
      string,
      string
    >
    expect(vars['--pp-type-scale']).toBe('1.1')
  })

  it('resolves avatar size and ring options into CSS variables', () => {
    const vars = themeToCssVars(
      resolveTheme({ themeId: 'mesh', avatarSize: 'lg', avatarRing: false })
    ) as Record<string, string>
    expect(vars['--pp-avatar-size']).toBe('120px')
    expect(vars['--pp-avatar-ring-width']).toBe('0px')
  })

  it('applies a background colour override without touching gradients', () => {
    const theme = resolveTheme({
      themeId: 'aurora',
      overrides: { backgroundColor: '#123456' },
    })
    expect(theme.background.color).toBe('#123456')
    expect(theme.background.image).toBeTruthy()
    const vars = themeToCssVars(theme) as Record<string, string>
    expect(vars['--pp-bg-color']).toBe('#123456')
  })

  it('resolves SEO overrides and falls back to empty strings', () => {
    expect(resolveSeo({ themeConfig: null })).toEqual({ title: '', description: '' })
    const seo = resolveSeo({
      themeConfig: JSON.stringify({
        themeId: 'mesh',
        seoTitle: '  My Page  ',
        seoDescription: 'A description',
      }),
    })
    expect(seo.title).toBe('My Page')
    expect(seo.description).toBe('A description')
  })

  it('round-trips builder options through the draft config', () => {
    const draft = toDraftConfig({
      themeConfig: JSON.stringify({
        themeId: 'mesh',
        typeScale: 1.05,
        avatarSize: 'sm',
        avatarRing: false,
        seoTitle: 'Hello',
        seoDescription: 'World',
      }),
    })
    expect(draft.typeScale).toBe(1.05)
    expect(draft.avatarSize).toBe('sm')
    expect(draft.avatarRing).toBe(false)
    expect(draft.seoTitle).toBe('Hello')
    expect(draft.seoDescription).toBe('World')
  })
})

describe('PublicProfileView', () => {
  it('renders profile, links and sections with a resolved theme', () => {
    render(
      <PublicProfileView
        displayName="Jane Doe"
        bio="Hello there"
        links={[
          { id: '1', title: 'My Link', url: 'https://example.com/page', icon: 'link', sectionId: null },
        ]}
        profileUrl="https://example.com/@jane"
        theme={resolveTheme({ themeId: 'ocean' })}
      />
    )
    expect(screen.getByText('Jane Doe')).toBeInTheDocument()
    expect(screen.getByText('Hello there')).toBeInTheDocument()
    expect(screen.getByText('My Link')).toBeInTheDocument()
  })

  it('promotes a featured link with a thumbnail exactly once', () => {
    render(
      <PublicProfileView
        displayName="Jane Doe"
        links={[
          {
            id: 'f',
            title: 'Featured',
            url: 'https://example.com/f',
            icon: 'link',
            sectionId: null,
            thumbnail: 'https://example.com/t.png',
          },
          { id: 'n', title: 'Normal', url: 'https://example.com/n', icon: 'link', sectionId: null },
        ]}
        profileUrl="https://example.com/@jane"
        theme={resolveTheme({ themeId: 'mesh' })}
        featuredLinkId="f"
      />
    )
    expect(screen.getAllByText('Featured')).toHaveLength(1)
    expect(screen.getByText('Normal')).toBeInTheDocument()
  })

  it('renders the Lensawaktu copyright beneath the branding footer', () => {
    render(
      <PublicProfileView
        displayName="Jane Doe"
        links={[]}
        profileUrl="https://example.com/@jane"
        theme={resolveTheme({ themeId: 'mesh' })}
      />
    )
    expect(screen.getByText('Lensa Links')).toBeInTheDocument()
    expect(
      screen.getByText(`© ${new Date().getFullYear()} Lensawaktu. All rights reserved.`)
    ).toBeInTheDocument()
  })

  it('fills the embedded builder preview so the background never stops early', () => {
    const { container } = render(
      <PublicProfileView
        variant="embedded"
        displayName="Jane Doe"
        links={[]}
        profileUrl="https://example.com/@jane"
        theme={resolveTheme({ themeId: 'mesh' })}
      />
    )
    const root = container.querySelector('.pp-root')
    expect(root?.className).toContain('min-h-full')
  })
})

describe('builder control tokens', () => {
  const vars = (config: Parameters<typeof resolveTheme>[0]) =>
    themeToCssVars(resolveTheme(config)) as Record<string, string>

  it('scopes Card colour to cards and link cards, never the avatar or socials', () => {
    const base = vars({ themeId: 'mesh' })
    const overridden = vars({ themeId: 'mesh', overrides: { cardColor: '#ff0000' } })
    // Link cards and card surfaces follow the override…
    expect(overridden['--pp-link-bg']).toMatch(/^rgba\(255, 0, 0/)
    expect(overridden['--pp-card']).toMatch(/^rgba\(255, 0, 0/)
    // …while the avatar container and social buttons keep their preset surface.
    expect(overridden['--pp-avatar-bg']).toBe(base['--pp-avatar-bg'])
    expect(overridden['--pp-social-bg']).toBe(base['--pp-social-bg'])
    expect(overridden['--pp-avatar-bg']).not.toMatch(/255, 0, 0/)
  })

  it('gives every avatar shape a distinct radius', () => {
    const shapes: AvatarShape[] = ['circle', 'rounded', 'squircle', 'square', 'hex']
    const radii = shapes.map((avatarShape) => vars({ themeId: 'mesh', avatarShape })['--pp-avatar-radius'])
    expect(new Set(radii).size).toBe(shapes.length)
  })

  it('makes the content width options visibly different', () => {
    const widths: ContentWidth[] = ['compact', 'cozy', 'wide']
    expect(widths.map((contentWidth) => vars({ themeId: 'mesh', contentWidth })['--pp-content-width'])).toEqual([
      '300px',
      '440px',
      '560px',
    ])
  })
})
