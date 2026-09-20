import type {
  ProfileTheme,
  ThemeButtonShape,
  ThemeCategory,
  ThemeHoverEffect,
  ProfileFont,
} from './types'

type ThemeInput = {
  id: string
  name: string
  category: ThemeCategory
  background: ProfileTheme['background']
  colors: ProfileTheme['colors']
  fontFamily: ProfileFont
  shape: ThemeButtonShape
  hover: ThemeHoverEffect
  isDark?: boolean
  border?: string
  shadow?: string
  shadowHover?: string
  cardRadius?: string
  cardBlur?: string
}

const LIGHT_EFFECTS = {
  border: 'rgba(15,23,42,0.08)',
  shadow: '0 1px 2px rgba(15,23,42,0.04), 0 2px 8px rgba(15,23,42,0.05)',
  shadowHover: '0 8px 20px rgba(15,23,42,0.10), 0 2px 6px rgba(15,23,42,0.06)',
  cardRadius: '1rem',
}

function defineTheme(input: ThemeInput): ProfileTheme {
  return {
    id: input.id,
    name: input.name,
    category: input.category,
    background: input.background,
    colors: {
      text: input.colors.text,
      textSecondary: input.colors.textSecondary,
      card: input.colors.card,
      cardOpacity: input.colors.cardOpacity,
      button: input.colors.button,
      buttonText: input.colors.buttonText,
      accent: input.colors.accent,
      socialIcon: input.colors.socialIcon,
    },
    typography: { fontFamily: input.fontFamily },
    button: { shape: input.shape },
    effects: {
      border: input.border ?? LIGHT_EFFECTS.border,
      shadow: input.shadow ?? LIGHT_EFFECTS.shadow,
      shadowHover: input.shadowHover ?? LIGHT_EFFECTS.shadowHover,
      hover: input.hover,
      cardRadius: input.cardRadius ?? LIGHT_EFFECTS.cardRadius,
      ...(input.cardBlur ? { cardBlur: input.cardBlur } : {}),
    },
    isDark: input.isDark ?? false,
  }
}

const GRID_PATTERN =
  "url(\"data:image/svg+xml,%3Csvg%20xmlns='http://www.w3.org/2000/svg'%20width='28'%20height='28'%3E%3Cpath%20d='M28%200H0v28'%20fill='none'%20stroke='%230f172a'%20stroke-opacity='0.06'/%3E%3C/svg%3E\")"

const WAVE_PATTERN =
  "url(\"data:image/svg+xml,%3Csvg%20xmlns='http://www.w3.org/2000/svg'%20width='120'%20height='60'%3E%3Cpath%20d='M0%2030%20Q30%200%2060%2030%20T120%2030'%20fill='none'%20stroke='%23ec4899'%20stroke-opacity='0.25'%20stroke-width='2'/%3E%3Cpath%20d='M0%2048%20Q30%2018%2060%2048%20T120%2048'%20fill='none'%20stroke='%238b5cf6'%20stroke-opacity='0.22'%20stroke-width='2'/%3E%3C/svg%3E\")"

const STARS_PATTERN =
  "url(\"data:image/svg+xml,%3Csvg%20xmlns='http://www.w3.org/2000/svg'%20width='60'%20height='60'%3E%3Ccircle%20cx='10'%20cy='12'%20r='1'%20fill='white'%20fill-opacity='0.7'/%3E%3Ccircle%20cx='40'%20cy='8'%20r='1.2'%20fill='white'%20fill-opacity='0.5'/%3E%3Ccircle%20cx='28'%20cy='34'%20r='0.9'%20fill='white'%20fill-opacity='0.6'/%3E%3Ccircle%20cx='52'%20cy='44'%20r='1'%20fill='white'%20fill-opacity='0.45'/%3E%3Ccircle%20cx='16'%20cy='50'%20r='0.8'%20fill='white'%20fill-opacity='0.5'/%3E%3C/svg%3E\")"

// Artistic theme collection — backgrounds are CSS/SVG generated (no external assets).
export const THEMES: ProfileTheme[] = [
  defineTheme({
    id: 'agate',
    name: 'Agate',
    category: 'artistic',
    // Natural marble: layered light streaks over a deep stone base.
    background: {
      color: '#12141a',
      image:
        'radial-gradient(120% 90% at 12% 8%, rgba(255,255,255,0.16) 0%, transparent 45%), radial-gradient(90% 120% at 88% 22%, rgba(148,163,184,0.20) 0%, transparent 50%), linear-gradient(160deg, #16181f 0%, #23262f 46%, #0e1015 100%)',
      size: 'cover',
    },
    colors: { text: '#e8eaf0', textSecondary: '#9aa3b2', card: '#1b1e27', cardOpacity: 0.85, button: '#e8eaf0', buttonText: '#12141a', accent: '#cbd5e1', socialIcon: '#cbd5e1' },
    fontFamily: 'bricolage-grotesque',
    shape: 'rounded',
    hover: 'glow',
    isDark: true,
    border: 'rgba(255,255,255,0.14)',
    shadow: '0 10px 28px rgba(0,0,0,0.5)',
    shadowHover: '0 14px 34px rgba(0,0,0,0.6)',
    cardBlur: '6px',
  }),
  defineTheme({
    id: 'aurora',
    name: 'Aurora',
    category: 'dark',
    // Fluid aurora ribbons of teal, violet and emerald.
    background: {
      color: '#070b14',
      image:
        'radial-gradient(at 15% 18%, rgba(56,189,248,0.50) 0%, transparent 45%), radial-gradient(at 82% 14%, rgba(168,85,247,0.45) 0%, transparent 45%), radial-gradient(at 50% 82%, rgba(16,185,129,0.35) 0%, transparent 52%), linear-gradient(180deg, #070b14 0%, #0b1220 100%)',
      size: 'cover',
    },
    colors: { text: '#eaf2ff', textSecondary: '#9fb0c8', card: '#0f1726', cardOpacity: 0.7, button: '#ffffff', buttonText: '#0b1220', accent: '#67e8f9', socialIcon: '#a5f3fc' },
    fontFamily: 'sora',
    shape: 'pill',
    hover: 'glow',
    isDark: true,
    border: 'rgba(255,255,255,0.16)',
    shadow: '0 10px 30px rgba(2,6,23,0.55)',
    shadowHover: '0 0 0 1px rgba(103,232,249,0.35), 0 14px 36px rgba(56,189,248,0.28)',
    cardBlur: '12px',
  }),
  defineTheme({
    id: 'bloom',
    name: 'Bloom',
    category: 'vibrant',
    // Abstract wave pattern in soft pink/violet.
    background: { color: '#fdf2f8', image: WAVE_PATTERN, size: '120px 60px', repeat: 'repeat' },
    colors: { text: '#3b1d33', textSecondary: '#7c5b73', card: '#ffffff', cardOpacity: 0.82, button: '#9d174d', buttonText: '#ffffff', accent: '#db2777', socialIcon: '#9d174d' },
    fontFamily: 'outfit',
    shape: 'pill',
    hover: 'lift',
    border: 'rgba(157,23,77,0.14)',
    cardBlur: '8px',
  }),
  defineTheme({
    id: 'ember',
    name: 'Ember',
    category: 'vibrant',
    // Warm fire glow on a dark base.
    background: {
      color: '#140806',
      image:
        'radial-gradient(at 50% 0%, rgba(249,115,22,0.38) 0%, transparent 55%), radial-gradient(at 10% 92%, rgba(220,38,38,0.30) 0%, transparent 55%), linear-gradient(180deg, #140806 0%, #1f0d08 100%)',
      size: 'cover',
    },
    colors: { text: '#ffeee6', textSecondary: '#fdba74', card: '#1f0f0a', cardOpacity: 0.8, button: '#fb923c', buttonText: '#1a0a06', accent: '#f97316', socialIcon: '#fdba74' },
    fontFamily: 'outfit',
    shape: 'pill',
    hover: 'glow',
    isDark: true,
    border: 'rgba(249,115,22,0.28)',
    shadow: '0 10px 28px rgba(0,0,0,0.5)',
    shadowHover: '0 0 0 1px rgba(251,146,60,0.45), 0 14px 34px rgba(249,115,22,0.35)',
    cardBlur: '8px',
  }),
  defineTheme({
    id: 'grid',
    name: 'Grid',
    category: 'minimal',
    background: { color: '#ffffff', image: GRID_PATTERN, size: '28px 28px', repeat: 'repeat' },
    colors: { text: '#0f172a', textSecondary: '#64748b', card: '#ffffff', cardOpacity: 1, button: '#111827', buttonText: '#ffffff', accent: '#2563eb', socialIcon: '#475569' },
    fontFamily: 'dm-sans',
    shape: 'rounded',
    hover: 'lift',
    border: 'rgba(15,23,42,0.10)',
  }),
  defineTheme({
    id: 'mesh',
    name: 'Mesh',
    category: 'minimal',
    background: {
      color: '#f8f7ff',
      image:
        'radial-gradient(at 12% 8%, rgba(129,140,248,0.35) 0%, transparent 50%), radial-gradient(at 88% 6%, rgba(56,189,248,0.32) 0%, transparent 50%), radial-gradient(at 50% 40%, rgba(244,114,182,0.22) 0%, transparent 55%)',
      size: 'cover',
    },
    colors: { text: '#111827', textSecondary: '#64748b', card: '#ffffff', cardOpacity: 0.85, button: '#ffffff', buttonText: '#111827', accent: '#6366f1', socialIcon: '#64748b' },
    fontFamily: 'plus-jakarta-sans',
    shape: 'rounded',
    hover: 'lift',
    border: 'rgba(17,24,39,0.10)',
    cardBlur: '10px',
  }),
  defineTheme({
    id: 'nebula',
    name: 'Nebula',
    category: 'dark',
    // Cosmic clouds of violet, pink and blue.
    background: {
      color: '#080616',
      image:
        'radial-gradient(at 25% 15%, rgba(139,92,246,0.42) 0%, transparent 50%), radial-gradient(at 82% 20%, rgba(236,72,153,0.32) 0%, transparent 50%), radial-gradient(at 50% 86%, rgba(59,130,246,0.30) 0%, transparent 55%), linear-gradient(180deg, #080616 0%, #0d0a22 100%)',
      size: 'cover',
    },
    colors: { text: '#ecebff', textSecondary: '#c4b5fd', card: '#140f2e', cardOpacity: 0.8, button: '#a78bfa', buttonText: '#0b0820', accent: '#a78bfa', socialIcon: '#ddd6fe' },
    fontFamily: 'sora',
    shape: 'rounded',
    hover: 'glow',
    isDark: true,
    border: 'rgba(167,139,250,0.28)',
    shadow: '0 10px 30px rgba(2,6,23,0.55)',
    shadowHover: '0 0 0 1px rgba(167,139,250,0.45), 0 14px 36px rgba(139,92,246,0.35)',
    cardBlur: '10px',
  }),
  defineTheme({
    id: 'opal',
    name: 'Opal',
    category: 'minimal',
    // Iridescent pearl light with soft prism tints.
    background: {
      color: '#f7f5ff',
      image:
        'radial-gradient(at 20% 10%, rgba(186,230,253,0.55) 0%, transparent 45%), radial-gradient(at 80% 15%, rgba(251,207,232,0.50) 0%, transparent 45%), radial-gradient(at 50% 82%, rgba(221,214,254,0.50) 0%, transparent 55%), linear-gradient(160deg, #f7f5ff 0%, #ffffff 100%)',
      size: 'cover',
    },
    colors: { text: '#2a2340', textSecondary: '#6b6480', card: '#ffffff', cardOpacity: 0.75, button: '#7c3aed', buttonText: '#ffffff', accent: '#8b5cf6', socialIcon: '#6d28d9' },
    fontFamily: 'urbanist',
    shape: 'rounded',
    hover: 'lift',
    border: 'rgba(124,58,237,0.16)',
    cardBlur: '10px',
  }),
  defineTheme({
    id: 'stardust',
    name: 'Stardust',
    category: 'artistic',
    // Star field over deep navy with a soft glow.
    background: {
      color: '#0a0e1a',
      image: STARS_PATTERN,
      size: 'cover, 60px 60px',
      position: 'center, top left',
      repeat: 'no-repeat, repeat',
      overlay: 'radial-gradient(at 50% 0%, rgba(129,140,248,0.28) 0%, transparent 60%)',
    },
    colors: { text: '#e6e9ff', textSecondary: '#a5b4fc', card: '#131a2e', cardOpacity: 0.85, button: '#e0e7ff', buttonText: '#0a0e1a', accent: '#818cf8', socialIcon: '#c7d2fe' },
    fontFamily: 'lexend',
    shape: 'rounded',
    hover: 'glow',
    isDark: true,
    border: 'rgba(255,255,255,0.14)',
    shadow: '0 10px 28px rgba(0,0,0,0.5)',
    shadowHover: '0 0 0 1px rgba(129,140,248,0.4), 0 14px 34px rgba(99,102,241,0.3)',
    cardBlur: '6px',
  }),
]

export const DEFAULT_THEME_ID = 'mesh'

// Presentation order + labels for the admin theme picker.
export const THEME_CATEGORIES: { id: ThemeCategory; label: string }[] = [
  { id: 'minimal', label: 'Minimal' },
  { id: 'artistic', label: 'Artistic' },
  { id: 'dark', label: 'Dark' },
  { id: 'vibrant', label: 'Vibrant' },
]

// Legacy color_palette values no longer exist as themes; map each to a surviving preset.
export const LEGACY_PALETTE_MAP: Record<string, string> = {
  ocean: 'aurora',
  sunset: 'ember',
  forest: 'agate',
  berry: 'bloom',
  midnight: 'nebula',
  candy: 'opal',
  golden: 'ember',
  monochrome: 'grid',
}

export const THEME_MAP: Record<string, ProfileTheme> = THEMES.reduce(
  (acc, t) => ({ ...acc, [t.id]: t }),
  {}
)

export function getThemeById(id: string | undefined | null): ProfileTheme | undefined {
  if (!id) return undefined
  return THEME_MAP[id] ?? THEME_MAP[LEGACY_PALETTE_MAP[id]]
}
