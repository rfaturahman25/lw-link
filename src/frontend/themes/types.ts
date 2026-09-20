export type ProfileFont =
  | 'inter'
  | 'dm-sans'
  | 'poppins'
  | 'manrope'
  | 'plus-jakarta-sans'
  | 'space-grotesk'
  | 'playfair-display'

export type ThemeButtonShape = 'square' | 'rounded' | 'pill' | 'outlined' | 'elevated'

export type ThemeHoverEffect = 'lift' | 'glow' | 'scale' | 'none'

export type ThemeBackground = {
  color: string
  image?: string
  position?: string
  size?: string
  repeat?: string
  overlay?: string
}

export type ThemeColors = {
  text: string
  textSecondary: string
  card: string
  cardOpacity: number
  button: string
  buttonText: string
  accent: string
  socialIcon: string
}

export type ProfileTheme = {
  id: string
  name: string
  background: ThemeBackground
  colors: ThemeColors
  typography: { fontFamily: ProfileFont }
  button: { shape: ThemeButtonShape }
  effects: {
    border: string
    shadow: string
    shadowHover: string
    hover: ThemeHoverEffect
    cardRadius?: string
    cardBlur?: string
  }
  isDark: boolean
}

// Optional per-user overrides layered on top of a preset theme.
export type ThemeOverrides = {
  buttonColor?: string
  buttonTextColor?: string
  accentColor?: string
  textColor?: string
  textSecondaryColor?: string
  cardColor?: string
  socialIconColor?: string
  fontFamily?: ProfileFont
  buttonShape?: ThemeButtonShape
}

// Persisted shape inside profiles.theme_config (JSON text). No schema change required.
// showShare controls whether the public profile renders the share/QR block.
export type SocialStyle = 'circle' | 'plain'

export type StoredThemeConfig = {
  themeId: string
  overrides?: ThemeOverrides | null
  showShare?: boolean
  socialStyle?: SocialStyle
}

export type ResolvedTheme = ProfileTheme
