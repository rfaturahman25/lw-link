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

// Keep in sync with ProfilePage COLOR_PALETTES & PublicProfilePage PALETTE_STYLES
const PALETTES: Record<ColorPalette, PaletteDef> = {
  ocean: { gradient: 'linear-gradient(135deg, #0077b6 0%, #00b4d8 50%, #90e0ef 100%)', accent: '#0077b6', isDark: true },
  sunset: { gradient: 'linear-gradient(135deg, #ff6b35 0%, #f7c59f 50%, #efefd0 100%)', accent: '#ff6b35', isDark: false },
  forest: { gradient: 'linear-gradient(135deg, #1a3a2a 0%, #2d6a4f 45%, #74c69d 100%)', accent: '#2d6a4f', isDark: true },
  berry: { gradient: 'linear-gradient(135deg, #6a040f 0%, #9d0208 40%, #dc2f02 75%, #e85d04 100%)', accent: '#9d0208', isDark: true },
  midnight: { gradient: 'linear-gradient(135deg, #02010a 0%, #03045e 35%, #0077b6 70%, #90e0ef 100%)', accent: '#03045e', isDark: true },
  candy: { gradient: 'linear-gradient(135deg, #ff006e 0%, #fb5607 30%, #ffbe0b 60%, #8338ec 100%)', accent: '#ff006e', isDark: true },
  golden: { gradient: 'linear-gradient(135deg, #7c5a00 0%, #d4af37 35%, #f4e5c2 70%, #fefae0 100%)', accent: '#b8860b', isDark: false },
  monochrome: { gradient: 'linear-gradient(135deg, #0a0a0a 0%, #333333 50%, #666666 85%, #cccccc 100%)', accent: '#000000', isDark: true },
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
    const isDark = p.isDark
    return {
      pageBackground: p.gradient,
      pageText: isDark ? '#ffffff' : '#0f172a',
      pageTextSecondary: isDark ? 'rgba(255,255,255,0.75)' : 'rgba(15,23,42,0.65)',
      surface: '#ffffff',
      surfaceHover: '#ffffff',
      cardText: '#0f172a',
      cardTextSecondary: '#64748b',
      border: hexToRgba(p.accent, 0.15),
      borderHover: hexToRgba(p.accent, 0.28),
      accent: p.accent,
      accentHover: hexToRgba(p.accent, 0.9),
      iconBg: hexToRgba(p.accent, 0.12),
      iconColor: p.accent,
      shadow: isDark ? '0 8px 30px rgba(0,0,0,0.25), 0 2px 10px rgba(0,0,0,0.15)' : '0 8px 30px rgba(0,0,0,0.12), 0 2px 8px rgba(0,0,0,0.06)',
      qrBg: '#ffffff',
    }
  }

  // fallback: no palette -> use backgroundColor/textColor (existing behavior) but derive full tokens
  const bg = opts.backgroundColor || '#f8fafc' // previously #ffffff, use subtle gray for default so page not pure white
  const text = opts.textColor || '#0f172a'
  const isBgDark = isColorDark(bg)
  return {
    pageBackground: bg,
    pageText: text,
    pageTextSecondary: isBgDark ? 'rgba(255,255,255,0.7)' : 'rgba(15,23,42,0.6)',
    surface: isBgDark ? 'rgba(255,255,255,0.96)' : '#ffffff',
    surfaceHover: '#ffffff',
    cardText: isBgDark ? '#0f172a' : '#0f172a',
    cardTextSecondary: '#64748b',
    border: isBgDark ? 'rgba(255,255,255,0.18)' : 'rgba(15,23,42,0.08)',
    borderHover: isBgDark ? 'rgba(255,255,255,0.32)' : 'rgba(15,23,42,0.14)',
    accent: 'hsl(221 83% 53%)',
    accentHover: 'hsl(221 83% 48%)',
    iconBg: isBgDark ? 'rgba(255,255,255,0.14)' : 'rgba(59,130,246,0.1)',
    iconColor: isBgDark ? text : 'hsl(221 83% 53%)',
    shadow: isBgDark ? '0 8px 30px rgba(0,0,0,0.3)' : '0 4px 20px rgba(0,0,0,0.07)',
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
