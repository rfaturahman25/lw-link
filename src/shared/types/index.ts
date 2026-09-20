export type UserRole = 'user' | 'admin' | 'super_admin'
export type UserStatus = 'active' | 'disabled'
export type Theme = 'default' | 'light' | 'dark' | 'minimal' | 'gradient'
export type ButtonStyle = 'rounded' | 'square' | 'pill'
export type TextAlignment = 'left' | 'center' | 'right'
export type AvatarShape = 'circle' | 'square' | 'rounded'
export type EventType = 'profile_view' | 'link_click'
export type ColorPalette =
  'ocean' | 'sunset' | 'forest' | 'berry' | 'midnight' | 'candy' | 'golden' | 'monochrome'
export type ProfileFont = 'inter' | 'dm-sans' | 'poppins' | 'manrope' | 'plus-jakarta-sans' | 'space-grotesk' | 'playfair-display'
export type SocialPlatform = 'instagram' | 'tiktok' | 'threads' | 'youtube' | 'twitter' | 'facebook' | 'linkedin' | 'github' | 'email' | 'phone' | 'website'

export interface ThemeConfig {
  background: string
  surface: string
  button: string
  buttonText: string
  text: string
  secondaryText: string
  accent: string
}

export interface User {
  id: string
  email: string
  username: string
  displayName: string
  avatarUrl: string | null
  role: UserRole
  status: UserStatus
  createdAt: string
  updatedAt: string
}

export interface Profile {
  id: string
  userId: string
  bio: string | null
  theme: Theme
  backgroundColor: string
  textColor: string
  buttonStyle: ButtonStyle
  fontFamily: string
  textAlignment: TextAlignment
  avatarShape: AvatarShape
  colorPalette?: ColorPalette | null
  logoUrl?: string | null
  themeConfig?: ThemeConfig | null
  published: boolean
  createdAt: string
  updatedAt: string
}

export interface ProfileSocialLink {
  id: string
  userId: string
  platform: SocialPlatform
  value: string
  enabled: boolean
  position: number
}

export interface Link {
  id: string
  userId: string
  title: string
  url: string
  icon: string | null
  thumbnail: string | null
  position: number
  enabled: boolean
  createdAt: string
  updatedAt: string
}

export interface ApiResponse<T> {
  success: boolean
  data?: T
  error?: {
    code: string
    message: string
    details?: unknown
  }
}

export interface PaginatedResponse<T> {
  success: boolean
  data: T[]
  pagination: {
    page: number
    limit: number
    total: number
    totalPages: number
  }
}
