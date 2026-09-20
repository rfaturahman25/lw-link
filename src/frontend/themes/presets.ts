import type { ProfileTheme, ThemeButtonShape, ThemeHoverEffect, ProfileFont } from './types'

type ThemeInput = {
  id: string
  name: string
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

const LIGHT = {
  text: '#0f172a',
  textSecondary: '#334155',
  card: '#ffffff',
  cardOpacity: 1,
  buttonText: '#ffffff',
  socialIcon: '#475569',
}

const LIGHT_EFFECTS = {
  border: 'rgba(15,23,42,0.08)',
  shadow: '0 1px 2px rgba(15,23,42,0.04), 0 4px 12px rgba(15,23,42,0.06)',
  shadowHover: '0 10px 24px rgba(15,23,42,0.12), 0 2px 8px rgba(15,23,42,0.06)',
  cardRadius: '1rem',
}

function defineTheme(input: ThemeInput): ProfileTheme {
  return {
    id: input.id,
    name: input.name,
    background: input.background,
    colors: {
      text: input.colors.text ?? LIGHT.text,
      textSecondary: input.colors.textSecondary ?? LIGHT.textSecondary,
      card: input.colors.card ?? LIGHT.card,
      cardOpacity: input.colors.cardOpacity ?? LIGHT.cardOpacity,
      button: input.colors.button,
      buttonText: input.colors.buttonText ?? LIGHT.buttonText,
      accent: input.colors.accent,
      socialIcon: input.colors.socialIcon ?? LIGHT.socialIcon,
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

const gradient = (top: string, mid: string) =>
  `linear-gradient(180deg, ${top} 0%, ${mid} 42%, #ffffff 100%)`

// 12 presets. The first nine ids intentionally match the legacy color_palette values
// so existing profiles keep rendering the same family after this change.
export const THEMES: ProfileTheme[] = [
  defineTheme({
    id: 'minimal',
    name: 'Minimal',
    background: { color: '#ffffff', image: 'linear-gradient(180deg, #f8fafc 0%, #ffffff 100%)' },
    colors: { ...LIGHT, button: '#111827', accent: '#111827' },
    fontFamily: 'inter',
    shape: 'rounded',
    hover: 'lift',
  }),
  defineTheme({
    id: 'ocean',
    name: 'Ocean',
    background: { color: '#ffffff', image: gradient('#7dd3fc', '#dbeafe') },
    colors: { ...LIGHT, button: '#0369a1', accent: '#0369a1' },
    fontFamily: 'inter',
    shape: 'rounded',
    hover: 'lift',
  }),
  defineTheme({
    id: 'sunset',
    name: 'Sunset',
    background: { color: '#ffffff', image: gradient('#fdba74', '#ffedd5') },
    colors: { ...LIGHT, button: '#c2410c', accent: '#c2410c' },
    fontFamily: 'poppins',
    shape: 'pill',
    hover: 'lift',
  }),
  defineTheme({
    id: 'forest',
    name: 'Forest',
    background: { color: '#ffffff', image: gradient('#86efac', '#dcfce7') },
    colors: { ...LIGHT, button: '#15803d', accent: '#15803d' },
    fontFamily: 'manrope',
    shape: 'rounded',
    hover: 'lift',
  }),
  defineTheme({
    id: 'berry',
    name: 'Berry',
    background: { color: '#ffffff', image: gradient('#fda4af', '#ffe4e6') },
    colors: { ...LIGHT, button: '#be123c', accent: '#be123c' },
    fontFamily: 'poppins',
    shape: 'pill',
    hover: 'lift',
  }),
  defineTheme({
    id: 'midnight',
    name: 'Midnight',
    background: { color: '#ffffff', image: gradient('#a5b4fc', '#e0e7ff') },
    colors: { ...LIGHT, button: '#4338ca', accent: '#4338ca' },
    fontFamily: 'space-grotesk',
    shape: 'rounded',
    hover: 'lift',
  }),
  defineTheme({
    id: 'candy',
    name: 'Candy',
    background: { color: '#ffffff', image: gradient('#f9a8d4', '#fce7f3') },
    colors: { ...LIGHT, button: '#be185d', accent: '#be185d' },
    fontFamily: 'poppins',
    shape: 'pill',
    hover: 'lift',
  }),
  defineTheme({
    id: 'golden',
    name: 'Golden',
    background: { color: '#ffffff', image: gradient('#fcd34d', '#fef3c7') },
    colors: { ...LIGHT, button: '#b45309', accent: '#b45309' },
    fontFamily: 'playfair-display',
    shape: 'rounded',
    hover: 'lift',
  }),
  defineTheme({
    id: 'monochrome',
    name: 'Monochrome',
    background: { color: '#ffffff', image: gradient('#cbd5e1', '#f1f5f9') },
    colors: { ...LIGHT, button: '#0f172a', accent: '#0f172a' },
    fontFamily: 'space-grotesk',
    shape: 'square',
    hover: 'lift',
  }),
  defineTheme({
    id: 'aurora',
    name: 'Aurora',
    background: {
      color: '#fdf4ff',
      image:
        'radial-gradient(at 15% 0%, rgba(167,139,250,0.55) 0%, transparent 55%), radial-gradient(at 85% 5%, rgba(34,211,238,0.5) 0%, transparent 55%), radial-gradient(at 50% 30%, rgba(244,114,182,0.35) 0%, transparent 60%)',
      size: 'cover',
    },
    colors: { ...LIGHT, button: '#7c3aed', accent: '#7c3aed' },
    fontFamily: 'plus-jakarta-sans',
    shape: 'pill',
    hover: 'glow',
    shadowHover: '0 12px 28px rgba(124,58,237,0.22), 0 2px 8px rgba(124,58,237,0.16)',
  }),
  defineTheme({
    id: 'neon',
    name: 'Neon',
    background: {
      color: '#0b1020',
      image:
        "url(\"data:image/svg+xml,%3Csvg%20xmlns='http://www.w3.org/2000/svg'%20width='32'%20height='32'%3E%3Cpath%20d='M32%200H0v32'%20fill='none'%20stroke='%2322d3ee'%20stroke-opacity='0.14'/%3E%3C/svg%3E\")",
      size: 'cover, 32px 32px',
      position: 'center, top left',
      repeat: 'no-repeat, repeat',
      overlay: 'radial-gradient(at 50% 0%, rgba(34,211,238,0.18) 0%, transparent 60%)',
    },
    colors: {
      text: '#e2e8f0',
      textSecondary: '#94a3b8',
      card: '#131a2e',
      cardOpacity: 0.92,
      button: '#22d3ee',
      buttonText: '#04121a',
      accent: '#22d3ee',
      socialIcon: '#a5f3fc',
    },
    fontFamily: 'space-grotesk',
    shape: 'elevated',
    hover: 'glow',
    isDark: true,
    border: 'rgba(148,163,184,0.25)',
    shadow: '0 8px 24px rgba(0,0,0,0.45)',
    shadowHover: '0 0 0 1px rgba(34,211,238,0.4), 0 12px 32px rgba(34,211,238,0.25)',
  }),
  defineTheme({
    id: 'glass',
    name: 'Glass',
    background: {
      color: '#eef2ff',
      image: 'linear-gradient(160deg, #dbeafe 0%, #fae8ff 45%, #e0f2fe 100%)',
    },
    colors: {
      text: '#0f172a',
      textSecondary: '#334155',
      card: '#ffffff',
      cardOpacity: 0.55,
      button: '#7c3aed',
      buttonText: '#ffffff',
      accent: '#7c3aed',
      socialIcon: '#4c1d95',
    },
    fontFamily: 'dm-sans',
    shape: 'outlined',
    hover: 'lift',
    border: 'rgba(255,255,255,0.65)',
    shadow: '0 8px 32px rgba(31,41,55,0.12)',
    shadowHover: '0 14px 40px rgba(31,41,55,0.18)',
    cardRadius: '1.25rem',
    cardBlur: '14px',
  }),
]

export const DEFAULT_THEME_ID = 'minimal'

export const THEME_MAP: Record<string, ProfileTheme> = THEMES.reduce(
  (acc, t) => ({ ...acc, [t.id]: t }),
  {}
)

export function getThemeById(id: string | undefined | null): ProfileTheme | undefined {
  return id ? THEME_MAP[id] : undefined
}
