import type { CSSProperties } from 'react'
import { fontStack } from './fonts'
import { DEFAULT_THEME_ID, THEME_MAP, getThemeById } from './presets'
import type {
  LogoShape,
  ProfileFont,
  ProfileTheme,
  ResolvedTheme,
  SocialStyle,
  StoredThemeConfig,
  ThemeButtonShape,
  ThemeOverrides,
} from './types'

const FONTS: ProfileFont[] = [
  'inter',
  'dm-sans',
  'poppins',
  'manrope',
  'plus-jakarta-sans',
  'space-grotesk',
  'playfair-display',
]
const SHAPES: ThemeButtonShape[] = ['square', 'rounded', 'pill', 'outlined', 'elevated']

export function isProfileFont(v: unknown): v is ProfileFont {
  return typeof v === 'string' && (FONTS as string[]).includes(v)
}
export function isButtonShape(v: unknown): v is ThemeButtonShape {
  return typeof v === 'string' && (SHAPES as string[]).includes(v)
}

function hexToRgba(hex: string, alpha: number): string {
  if (!/^#[0-9a-fA-F]{6}$/.test(hex)) return hex
  const r = parseInt(hex.slice(1, 3), 16)
  const g = parseInt(hex.slice(3, 5), 16)
  const b = parseInt(hex.slice(5, 7), 16)
  return `rgba(${r}, ${g}, ${b}, ${alpha})`
}

export function parseStoredThemeConfig(raw: unknown): StoredThemeConfig | null {
  if (!raw) return null
  let value: unknown = raw
  if (typeof raw === 'string') {
    try {
      value = JSON.parse(raw)
    } catch {
      return null
    }
  }
  if (!value || typeof value !== 'object') return null
  const cfg = value as StoredThemeConfig
  if (typeof cfg.themeId !== 'string' || !THEME_MAP[cfg.themeId]) return null
  const overrides = cfg.overrides && typeof cfg.overrides === 'object' ? cfg.overrides : null
  const showShare = typeof cfg.showShare === 'boolean' ? cfg.showShare : undefined
  const socialStyle = cfg.socialStyle === 'plain' || cfg.socialStyle === 'circle' ? cfg.socialStyle : undefined
  const logoShape = cfg.logoShape === 'plain' || cfg.logoShape === 'circle' ? cfg.logoShape : undefined
  return {
    themeId: cfg.themeId,
    overrides,
    ...(showShare !== undefined ? { showShare } : {}),
    ...(socialStyle !== undefined ? { socialStyle } : {}),
    ...(logoShape !== undefined ? { logoShape } : {}),
  }
}

// Whether the public profile shows the share/QR block (defaults to true).
export function resolveShowShare(
  profile: { themeConfig?: unknown } | null | undefined
): boolean {
  const cfg = parseStoredThemeConfig(profile?.themeConfig)
  return cfg?.showShare !== false
}

// Social icon presentation: filled circle (default) or icon-only.
export function resolveSocialStyle(
  profile: { themeConfig?: unknown } | null | undefined
): SocialStyle {
  const cfg = parseStoredThemeConfig(profile?.themeConfig)
  return cfg?.socialStyle === 'plain' ? 'plain' : 'circle'
}

// Logo presentation: transparent PNG as-is (default) or clipped into a circle.
export function resolveLogoShape(
  profile: { themeConfig?: unknown } | null | undefined
): LogoShape {
  const cfg = parseStoredThemeConfig(profile?.themeConfig)
  return cfg?.logoShape === 'plain' ? 'plain' : 'circle'
}

function applyOverrides(theme: ProfileTheme, o: ThemeOverrides): ResolvedTheme {
  return {
    ...theme,
    colors: {
      ...theme.colors,
      ...(o.buttonColor ? { button: o.buttonColor } : {}),
      ...(o.buttonTextColor ? { buttonText: o.buttonTextColor } : {}),
      ...(o.accentColor ? { accent: o.accentColor } : {}),
      ...(o.textColor ? { text: o.textColor } : {}),
      ...(o.textSecondaryColor ? { textSecondary: o.textSecondaryColor } : {}),
      ...(o.cardColor ? { card: o.cardColor } : {}),
      ...(o.socialIconColor ? { socialIcon: o.socialIconColor } : {}),
    },
    typography: { fontFamily: o.fontFamily || theme.typography.fontFamily },
    button: { shape: o.buttonShape || theme.button.shape },
  }
}

export type LegacyProfileThemeInput = {
  colorPalette?: string | null | undefined
  buttonStyle?: string | null | undefined
  fontFamily?: string | null | undefined
}

// Legacy profiles have no theme_config; derive a theme from color_palette and the
// older style fields. backgroundColor/textColor are ignored because their DB defaults
// (#ffffff/#000000) were never user-chosen and would override theme colors.
function legacyOverrides(legacy?: LegacyProfileThemeInput): ThemeOverrides {
  const o: ThemeOverrides = {}
  if (isButtonShape(legacy?.buttonStyle)) o.buttonShape = legacy!.buttonStyle as ThemeButtonShape
  if (isProfileFont(legacy?.fontFamily)) o.fontFamily = legacy!.fontFamily as ProfileFont
  return o
}

export function resolveTheme(
  config: StoredThemeConfig | null,
  legacy?: LegacyProfileThemeInput
): ResolvedTheme {
  const base =
    (config && getThemeById(config.themeId)) ||
    getThemeById(legacy?.colorPalette) ||
    THEME_MAP[DEFAULT_THEME_ID]
  const overrides = config ? config.overrides || {} : legacyOverrides(legacy)
  return applyOverrides(base, overrides)
}

export function resolveProfileTheme(
  profile:
    | {
        themeConfig?: unknown
        colorPalette?: string | null
        buttonStyle?: string | null
        fontFamily?: string | null
      }
    | null
    | undefined
): ResolvedTheme {
  return resolveTheme(parseStoredThemeConfig(profile?.themeConfig), {
    colorPalette: profile?.colorPalette,
    buttonStyle: profile?.buttonStyle,
    fontFamily: profile?.fontFamily,
  })
}

// Build the editable draft (themeId + overrides) from a saved profile.
export function toDraftConfig(
  profile:
    | {
        themeConfig?: unknown
        colorPalette?: string | null
        buttonStyle?: string | null
        fontFamily?: string | null
      }
    | null
    | undefined
): StoredThemeConfig {
  const parsed = parseStoredThemeConfig(profile?.themeConfig)
  if (parsed) {
    return {
      themeId: parsed.themeId,
      overrides: parsed.overrides || {},
      ...(parsed.showShare !== undefined ? { showShare: parsed.showShare } : {}),
      ...(parsed.socialStyle !== undefined ? { socialStyle: parsed.socialStyle } : {}),
      ...(parsed.logoShape !== undefined ? { logoShape: parsed.logoShape } : {}),
    }
  }
  const legacyId = getThemeById(profile?.colorPalette)?.id || DEFAULT_THEME_ID
  return { themeId: legacyId, overrides: legacyOverrides(profile ?? undefined) }
}

export function resolveDraftConfig(config: StoredThemeConfig): ResolvedTheme {
  return resolveTheme(config)
}

type ButtonVars = {
  bg: string
  text: string
  border: string
  borderWidth: string
  radius: string
  shadow: string
}

function buttonVars(theme: ResolvedTheme): ButtonVars {
  const c = theme.colors
  switch (theme.button.shape) {
    case 'square':
      return { bg: c.button, text: c.buttonText, border: 'transparent', borderWidth: '0px', radius: '0px', shadow: 'none' }
    case 'pill':
      return { bg: c.button, text: c.buttonText, border: 'transparent', borderWidth: '0px', radius: '9999px', shadow: 'none' }
    case 'outlined':
      return { bg: 'transparent', text: c.accent, border: c.accent, borderWidth: '1.5px', radius: '0.75rem', shadow: 'none' }
    case 'elevated':
      return { bg: c.button, text: c.buttonText, border: 'transparent', borderWidth: '0px', radius: '0.75rem', shadow: '0 8px 20px rgba(0,0,0,0.18)' }
    case 'rounded':
    default:
      return { bg: c.button, text: c.buttonText, border: 'transparent', borderWidth: '0px', radius: '0.75rem', shadow: 'none' }
  }
}

function hoverVars(theme: ResolvedTheme): { lift: string; scale: string; shadow: string } {
  const s = theme.effects.shadowHover
  switch (theme.effects.hover) {
    case 'glow':
      return { lift: '-2px', scale: '1.01', shadow: s }
    case 'scale':
      return { lift: '0px', scale: '1.03', shadow: s }
    case 'none':
      return { lift: '0px', scale: '1', shadow: theme.effects.shadow }
    case 'lift':
    default:
      return { lift: '-3px', scale: '1', shadow: s }
  }
}

// Single source of truth for theme -> CSS variables. Both the public profile and the
// admin preview render through these variables, so they can never drift apart.
export function themeToCssVars(theme: ResolvedTheme): CSSProperties {
  const c = theme.colors
  const btn = buttonVars(theme)
  const hover = hoverVars(theme)
  const outlined = theme.button.shape === 'outlined'
  const elevated = theme.button.shape === 'elevated'
  const card = hexToRgba(c.card, c.cardOpacity)
  // Link cards are the primary "buttons" on a link-in-bio, so the button shape
  // (radius / outlined / elevated) must be reflected on them too.
  const link = {
    bg: outlined ? 'transparent' : c.button,
    text: outlined ? c.accent : c.buttonText,
    secondary: outlined ? c.textSecondary : hexToRgba(c.buttonText, 0.72),
    border: outlined ? c.accent : theme.effects.border,
    borderWidth: outlined ? '1.5px' : '1px',
    radius: btn.radius,
    shadow: elevated ? btn.shadow : outlined ? 'none' : theme.effects.shadow,
    iconBg: outlined ? hexToRgba(c.accent, 0.14) : hexToRgba(c.buttonText, 0.16),
    iconColor: outlined ? c.accent : c.buttonText,
  }
  const hoverBorder = outlined
    ? c.accent
    : theme.isDark
      ? 'rgba(255,255,255,0.32)'
      : 'rgba(15,23,42,0.16)'
  return {
    '--pp-bg-color': theme.background.color,
    '--pp-bg-image': theme.background.image || 'none',
    '--pp-bg-overlay': theme.background.overlay || 'none',
    '--pp-bg-position': theme.background.position || 'center',
    '--pp-bg-size': theme.background.size || 'cover',
    '--pp-bg-repeat': theme.background.repeat || 'no-repeat',
    '--pp-text': c.text,
    '--pp-text-secondary': c.textSecondary,
    '--pp-card': card,
    '--pp-border': theme.effects.border,
    '--pp-border-hover': theme.isDark ? 'rgba(255,255,255,0.32)' : 'rgba(15,23,42,0.16)',
    '--pp-accent': c.accent,
    '--pp-accent-soft': hexToRgba(c.accent, 0.14),
    '--pp-social': c.socialIcon,
    '--pp-font': fontStack(theme.typography.fontFamily),
    '--pp-shadow': theme.effects.shadow,
    '--pp-shadow-hover': theme.effects.shadowHover,
    '--pp-card-radius': theme.effects.cardRadius || '1rem',
    '--pp-card-blur': theme.effects.cardBlur || '0px',
    '--pp-btn-bg': btn.bg,
    '--pp-btn-text': btn.text,
    '--pp-btn-border': btn.border,
    '--pp-btn-border-width': btn.borderWidth,
    '--pp-btn-radius': btn.radius,
    '--pp-btn-shadow': btn.shadow,
    '--pp-link-bg': link.bg,
    '--pp-link-text': link.text,
    '--pp-link-secondary': link.secondary,
    '--pp-link-border': link.border,
    '--pp-link-border-width': link.borderWidth,
    '--pp-link-radius': link.radius,
    '--pp-link-shadow': link.shadow,
    '--pp-link-icon-bg': link.iconBg,
    '--pp-link-icon-color': link.iconColor,
    '--pp-hover-lift': hover.lift,
    '--pp-hover-scale': hover.scale,
    '--pp-hover-shadow': hover.shadow,
    '--pp-hover-border': hoverBorder,
  } as CSSProperties
}
