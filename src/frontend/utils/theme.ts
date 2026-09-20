export type ColorPalette = 'ocean' | 'sunset' | 'forest' | 'berry' | 'midnight' | 'candy' | 'golden' | 'monochrome'

export type ThemeTokens = {
  pageBackground: string // CSS background (gradient or color)
  pageText: string
  pageTextSecondary: string
  surface: string
  surfaceHover: string
  cardText: string
  cardTextSecondary: string
  border: string
  borderHover: string
  accent: string
  accentHover: string
  iconBg: string
  iconColor: string
  shadow: string
  qrBg: string
}

type PaletteDef = {
  gradient: string
  accent: string
  isDark: boolean // page is dark -> header text should be light
}

// Soft, restrained palettes — background = subtle canvas (brand tint + white), not vivid gaming gradient.
// Keep accent for subtle focus only, content stays neutral.
const PALETTES: Record<ColorPalette, PaletteDef> = {
  ocean: { gradient: 'linear-gradient(180deg, #e0f2fe 0%, #f0f9ff 45%, #ffffff 100%)', accent: '#0077b6', isDark: false },
  sunset: { gradient: 'linear-gradient(180deg, #fff1e6 0%, #fef3ec 50%, #ffffff 100%)', accent: '#ff6b35', isDark: false },
  forest: { gradient: 'linear-gradient(180deg, #e6f4ea 0%, #f0faf4 50%, #ffffff 100%)', accent: '#2d6a4f', isDark: false },
  berry: { gradient: 'linear-gradient(180deg, #fde8e8 0%, #fef2f2 50%, #ffffff 100%)', accent: '#9d0208', isDark: false },
  midnight: { gradient: 'linear-gradient(180deg, #eef2ff 0%, #f5f3ff 45%, #ffffff 100%)', accent: '#03045e', isDark: false },
  candy: { gradient: 'linear-gradient(180deg, #ffe4f0 0%, #fef1f8 50%, #ffffff 100%)', accent: '#ff006e', isDark: false },
  golden: { gradient: 'linear-gradient(180deg, #fef9e7 0%, #fefce8 50%, #ffffff 100%)', accent: '#b8860b', isDark: false },
  monochrome: { gradient: 'linear-gradient(180deg, #f8fafc 0%, #f1f5f9 50%, #ffffff 100%)', accent: '#334155', isDark: false },
}

function hexToRgba(hex: string, alpha: number) {
  const r = parseInt(hex.slice(1, 3), 16)
  const g = parseInt(hex.slice(3, 5), 16)
  const b = parseInt(hex.slice(5, 7), 16)
  return `rgba(${r}, ${g}, ${b}, ${alpha})`
}

export function getThemeTokens(opts: {
  colorPalette?: string | null
  backgroundColor?: string | null
  textColor?: string | null
}): ThemeTokens {
  const p = (opts.colorPalette as ColorPalette | null) && PALETTES[opts.colorPalette as ColorPalette] ? PALETTES[opts.colorPalette as ColorPalette] : null

  if (p) {
    // Restrained: 1 dominant (page tint) + neutrals for content
    // Do not color card/border/icon with accent — keep content clean
    return {
      pageBackground: p.gradient,
      pageText: '#0f172a',
      pageTextSecondary: '#64748b',
      surface: '#ffffff',
      surfaceHover: '#ffffff',
      cardText: '#0f172a',
      cardTextSecondary: '#64748b',
      border: 'rgba(15,23,42,0.06)',
      borderHover: 'rgba(15,23,42,0.10)',
      accent: p.accent,
      accentHover: hexToRgba(p.accent, 0.92),
      iconBg: '#f1f5f9',
      iconColor: '#64748b',
      shadow: '0 1px 3px rgba(0,0,0,0.04), 0 4px 16px rgba(0,0,0,0.04)',
      qrBg: '#ffffff',
    }
  }

  // fallback: no palette -> clean neutral page (same restrained system)
  const bg = opts.backgroundColor || '#f8fafc'
  const text = opts.textColor || '#0f172a'
  const isBgDark = isColorDark(bg)
  // Even without palette, keep content clean — don't colorize with isBgDark accent
  return {
    pageBackground: isBgDark ? bg : '#f8fafc',
    pageText: text,
    pageTextSecondary: isBgDark ? 'rgba(255,255,255,0.7)' : '#64748b',
    surface: '#ffffff',
    surfaceHover: '#ffffff',
    cardText: '#0f172a',
    cardTextSecondary: '#64748b',
    border: 'rgba(15,23,42,0.06)',
    borderHover: 'rgba(15,23,42,0.10)',
    accent: 'hsl(221 83% 53%)',
    accentHover: 'hsl(221 83% 48%)',
    iconBg: '#f1f5f9',
    iconColor: '#64748b',
    shadow: '0 1px 3px rgba(0,0,0,0.04), 0 4px 16px rgba(0,0,0,0.04)',
    qrBg: '#ffffff',
  }
}

function isColorDark(hex: string): boolean {
  if (!hex.startsWith('#') || hex.length !== 7) return false
  const r = parseInt(hex.slice(1, 3), 16)
  const g = parseInt(hex.slice(3, 5), 16)
  const b = parseInt(hex.slice(5, 7), 16)
  const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255
  return luminance < 0.5
}

export const THEME_PALETTES = PALETTES
