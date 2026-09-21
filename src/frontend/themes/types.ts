export type ProfileFont =
  | 'inter'
  | 'dm-sans'
  | 'poppins'
  | 'manrope'
  | 'plus-jakarta-sans'
  | 'space-grotesk'
  | 'playfair-display'
  | 'outfit'
  | 'sora'
  | 'lexend'
  | 'figtree'
  | 'urbanist'
  | 'bricolage-grotesque'
  | 'jetbrains-mono'
  | 'space-mono'
  | 'silkscreen'
  | 'press-start-2p'
  | 'vt323'

export type ThemeButtonShape = 'square' | 'rounded' | 'pill' | 'outlined' | 'elevated'

export type ThemeHoverEffect = 'lift' | 'glow' | 'scale' | 'none'

// Presentation grouping used by the admin theme picker.
export type ThemeCategory = 'minimal' | 'artistic' | 'dark' | 'vibrant'

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
  category: ThemeCategory
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
  backgroundColor?: string
  fontFamily?: ProfileFont
  buttonShape?: ThemeButtonShape
}

// Persisted shape inside profiles.theme_config (JSON text). No schema change required.
// showShare controls whether the public profile renders the share/QR block.
export type SocialStyle = 'circle' | 'plain'
export type LogoShape = 'plain' | 'circle'

// Public profile header composition. Stored on profiles.headerStyle.
export type ProfileHeaderStyle = 'classic' | 'hero' | 'banner' | 'shape'

// Layout / identity options. These are additive, optional, and stored inside
// theme_config so older configs keep working untouched.
export type AvatarShape = 'circle' | 'rounded' | 'squircle' | 'square' | 'hex'
export type NameTreatment = 'solid' | 'gradient'
export type SocialIconStyle = 'surface' | 'tinted' | 'plain'
export type ContentWidth = 'compact' | 'cozy' | 'wide'
export type ContentDensity = 'compact' | 'comfortable' | 'spacious'
export type ProfileAlign = 'center' | 'left'
export type AvatarSize = 'sm' | 'md' | 'lg'

// Builder-only, additive layout options. Every field is optional so configs
// written before the visual builder keep resolving unchanged.
export type LayoutOptions = {
  avatarShape?: AvatarShape
  nameTreatment?: NameTreatment
  socialIconStyle?: SocialIconStyle
  contentWidth?: ContentWidth
  density?: ContentDensity
  profileAlign?: ProfileAlign
  featuredLinkId?: string | null
  // Global type multiplier applied on top of every resolved font size (0.9–1.15).
  typeScale?: number
  avatarSize?: AvatarSize
  avatarRing?: boolean
}

// Optional SEO overrides. Stored inside theme_config so no schema change is needed.
export type SeoOptions = {
  seoTitle?: string
  seoDescription?: string
}

export type StoredThemeConfig = {
  themeId: string
  overrides?: ThemeOverrides | null
  showShare?: boolean
  socialStyle?: SocialStyle
  logoShape?: LogoShape
} & LayoutOptions &
  SeoOptions

// Resolved layout consumed by the renderer + CSS variable builder. Every field
// has a concrete value so components never branch on "undefined".
export type ResolvedLayout = {
  avatarShape: AvatarShape
  nameTreatment: NameTreatment
  socialIconStyle: SocialIconStyle
  contentWidth: ContentWidth
  density: ContentDensity
  align: ProfileAlign
  featuredLinkId: string | null
  typeScale: number
  avatarSize: AvatarSize
  avatarRing: boolean
}

// Resolved SEO values. Both may be empty strings when the owner has not set them;
// the public page then falls back to the display name + bio.
export type ResolvedSeo = {
  title: string
  description: string
}

// A preset theme plus the resolved layout. The renderer only ever needs this.
// `overrides` and `baseColors` are carried along so the CSS-variable builder can
// branch on a user override without duplicating the resolution logic, and so
// surfaces that must stay stable (avatar container, social buttons) can read the
// untouched preset colours instead of the overridden ones.
export type ResolvedTheme = ProfileTheme & {
  layout: ResolvedLayout
  overrides: ThemeOverrides
  baseColors: ThemeColors
}
