import type { ProfileFont } from './types'

export type FontOption = {
  value: ProfileFont
  label: string
  google: string
  stack: string
}

// Curated list — matches the existing ProfileFont enum used by the API.
export const FONT_OPTIONS: FontOption[] = [
  { value: 'inter', label: 'Inter', google: 'Inter', stack: "'Inter', system-ui, -apple-system, sans-serif" },
  { value: 'dm-sans', label: 'DM Sans', google: 'DM+Sans', stack: "'DM Sans', system-ui, sans-serif" },
  { value: 'poppins', label: 'Poppins', google: 'Poppins', stack: "'Poppins', system-ui, sans-serif" },
  { value: 'manrope', label: 'Manrope', google: 'Manrope', stack: "'Manrope', system-ui, sans-serif" },
  { value: 'plus-jakarta-sans', label: 'Plus Jakarta Sans', google: 'Plus+Jakarta+Sans', stack: "'Plus Jakarta Sans', system-ui, sans-serif" },
  { value: 'space-grotesk', label: 'Space Grotesk', google: 'Space+Grotesk', stack: "'Space Grotesk', system-ui, sans-serif" },
  { value: 'playfair-display', label: 'Playfair Display', google: 'Playfair+Display', stack: "'Playfair Display', Georgia, serif" },
]

const FONT_MAP: Record<string, FontOption> = FONT_OPTIONS.reduce(
  (acc, f) => ({ ...acc, [f.value]: f }),
  {}
)

export function fontStack(value: string | undefined): string {
  return (value && FONT_MAP[value]?.stack) || FONT_MAP.inter.stack
}

// Fonts are loaded on demand so the public page only fetches the active theme's font.
const loaded = new Set<string>()

export function loadFont(value: string | undefined): void {
  if (!value || typeof document === 'undefined') return
  const font = FONT_MAP[value]
  if (!font || loaded.has(value)) return
  loaded.add(value)
  const link = document.createElement('link')
  link.rel = 'stylesheet'
  link.href = `https://fonts.googleapis.com/css2?family=${font.google}:wght@400;500;600;700&display=swap`
  link.setAttribute('data-pp-font', value)
  document.head.appendChild(link)
}

// Used by the theme picker (admin only) so every card previews its real font.
export function loadAllFonts(): void {
  FONT_OPTIONS.forEach((f) => loadFont(f.value))
}
