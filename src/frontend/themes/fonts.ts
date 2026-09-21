import type { ProfileFont } from './types'

export type FontOption = {
  value: ProfileFont
  label: string
  google: string
  stack: string
  weights: string
}

// Curated list — must stay in sync with the backend ProfileFont enum.
export const FONT_OPTIONS: FontOption[] = [
  { value: 'inter', label: 'Inter', google: 'Inter', stack: "'Inter', system-ui, -apple-system, sans-serif", weights: '400;500;600;700' },
  { value: 'dm-sans', label: 'DM Sans', google: 'DM+Sans', stack: "'DM Sans', system-ui, sans-serif", weights: '400;500;600;700' },
  { value: 'manrope', label: 'Manrope', google: 'Manrope', stack: "'Manrope', system-ui, sans-serif", weights: '400;500;600;700' },
  { value: 'plus-jakarta-sans', label: 'Plus Jakarta Sans', google: 'Plus+Jakarta+Sans', stack: "'Plus Jakarta Sans', system-ui, sans-serif", weights: '400;500;600;700' },
  { value: 'outfit', label: 'Outfit', google: 'Outfit', stack: "'Outfit', system-ui, sans-serif", weights: '400;500;600;700' },
  { value: 'sora', label: 'Sora', google: 'Sora', stack: "'Sora', system-ui, sans-serif", weights: '400;500;600;700' },
  { value: 'lexend', label: 'Lexend', google: 'Lexend', stack: "'Lexend', system-ui, sans-serif", weights: '400;500;600;700' },
  { value: 'figtree', label: 'Figtree', google: 'Figtree', stack: "'Figtree', system-ui, sans-serif", weights: '400;500;600;700' },
  { value: 'urbanist', label: 'Urbanist', google: 'Urbanist', stack: "'Urbanist', system-ui, sans-serif", weights: '400;500;600;700' },
  { value: 'bricolage-grotesque', label: 'Bricolage Grotesque', google: 'Bricolage+Grotesque', stack: "'Bricolage Grotesque', system-ui, sans-serif", weights: '400;500;600;700' },
  { value: 'space-grotesk', label: 'Space Grotesk', google: 'Space+Grotesk', stack: "'Space Grotesk', system-ui, sans-serif", weights: '400;500;600;700' },
  { value: 'poppins', label: 'Poppins', google: 'Poppins', stack: "'Poppins', system-ui, sans-serif", weights: '400;500;600;700' },
  { value: 'playfair-display', label: 'Playfair Display', google: 'Playfair+Display', stack: "'Playfair Display', Georgia, serif", weights: '400;500;600;700' },
  { value: 'jetbrains-mono', label: 'JetBrains Mono', google: 'JetBrains+Mono', stack: "'JetBrains Mono', ui-monospace, monospace", weights: '400;500;600;700' },
  { value: 'space-mono', label: 'Space Mono', google: 'Space+Mono', stack: "'Space Mono', ui-monospace, monospace", weights: '400;700' },
  { value: 'silkscreen', label: 'Silkscreen (pixel)', google: 'Silkscreen', stack: "'Silkscreen', ui-monospace, monospace", weights: '400;700' },
  { value: 'vt323', label: 'VT323 (pixel)', google: 'VT323', stack: "'VT323', ui-monospace, monospace", weights: '400' },
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
  link.href = `https://fonts.googleapis.com/css2?family=${font.google}:wght@${font.weights}&display=swap`
  link.setAttribute('data-pp-font', value)
  document.head.appendChild(link)
}

// Used by the theme picker (admin only) so every card previews its real font.
export function loadAllFonts(): void {
  FONT_OPTIONS.forEach((f) => loadFont(f.value))
}
