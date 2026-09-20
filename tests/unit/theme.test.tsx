import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import PublicProfileView from '@frontend/components/profile/PublicProfileView'
import {
  THEMES,
  parseStoredThemeConfig,
  resolveProfileTheme,
  resolveShowShare,
  resolveTheme,
  themeToCssVars,
} from '@frontend/themes'

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
  it('maps every legacy color palette to a theme of the same id', () => {
    for (const p of LEGACY_PALETTES) {
      expect(resolveProfileTheme({ colorPalette: p, themeConfig: null }).id).toBe(p)
    }
  })

  it('falls back to the default theme when nothing is configured', () => {
    expect(resolveProfileTheme({ colorPalette: null, themeConfig: null }).id).toBe('minimal')
    expect(resolveProfileTheme(undefined).id).toBe('minimal')
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
      JSON.stringify({ themeId: 'neon', overrides: { buttonShape: 'pill' } })
    )
    expect(cfg?.themeId).toBe('neon')
    expect(cfg?.overrides?.buttonShape).toBe('pill')
  })

  it('rejects an unknown theme id and falls back', () => {
    expect(resolveProfileTheme({ themeConfig: JSON.stringify({ themeId: 'nope' }) }).id).toBe(
      'minimal'
    )
    expect(parseStoredThemeConfig('{not json')).toBeNull()
  })

  it('applies user overrides on top of the selected theme', () => {
    const t = resolveTheme({
      themeId: 'minimal',
      overrides: { accentColor: '#ff0000', buttonShape: 'pill', fontFamily: 'poppins' },
    })
    expect(t.colors.accent).toBe('#ff0000')
    expect(t.button.shape).toBe('pill')
    expect(t.typography.fontFamily).toBe('poppins')
  })

  it('prefers theme_config over the legacy palette', () => {
    const t = resolveProfileTheme({
      colorPalette: 'ocean',
      themeConfig: JSON.stringify({ themeId: 'neon' }),
    })
    expect(t.id).toBe('neon')
  })

  it('reflects the button shape on link cards (radius/outlined)', () => {
    const vars = (shape: 'pill' | 'square' | 'outlined' | 'elevated') =>
      themeToCssVars(resolveTheme({ themeId: 'minimal', overrides: { buttonShape: shape } })) as Record<
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
      resolveTheme({ themeId: 'minimal', overrides: { buttonColor: '#ff0000' } })
    ) as Record<string, string>
    expect(vars['--pp-btn-bg']).toBe('#ff0000')
    expect(vars['--pp-link-bg']).toBe('#ff0000')
  })

  it('parses showShare and defaults to visible', () => {
    expect(
      parseStoredThemeConfig(JSON.stringify({ themeId: 'minimal', showShare: false }))?.showShare
    ).toBe(false)
    expect(resolveShowShare({ themeConfig: JSON.stringify({ themeId: 'minimal' }) })).toBe(true)
    expect(
      resolveShowShare({ themeConfig: JSON.stringify({ themeId: 'minimal', showShare: false }) })
    ).toBe(false)
  })

  it('emits theme CSS variables including rgba card colour', () => {
    const vars = themeToCssVars(resolveTheme({ themeId: 'neon' })) as Record<string, string>
    expect(vars['--pp-bg-color']).toBe('#0b1020')
    expect(vars['--pp-card']).toMatch(/^rgba\(/)
    expect(vars['--pp-font']).toContain('Space Grotesk')
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
})
