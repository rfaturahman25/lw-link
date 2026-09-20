import { useEffect } from 'react'
import { Check, Palette, RotateCcw } from 'lucide-react'
import {
  FONT_OPTIONS,
  THEMES,
  getThemeById,
  loadAllFonts,
  resolveTheme,
  themeToCssVars,
} from '../../themes'
import type { ProfileFont, StoredThemeConfig, ThemeButtonShape, ThemeOverrides } from '../../themes'

const BUTTON_SHAPES: { value: ThemeButtonShape; label: string }[] = [
  { value: 'square', label: 'Square' },
  { value: 'rounded', label: 'Rounded' },
  { value: 'pill', label: 'Pill' },
  { value: 'outlined', label: 'Outlined' },
  { value: 'elevated', label: 'Elevated' },
]

const COLOR_FIELDS = [
  { key: 'accentColor', label: 'Accent', base: 'accent' },
  { key: 'buttonColor', label: 'Button', base: 'button' },
  { key: 'textColor', label: 'Text', base: 'text' },
  { key: 'socialIconColor', label: 'Social icon', base: 'socialIcon' },
] as const

type Props = {
  config: StoredThemeConfig
  onChange: (config: StoredThemeConfig) => void
}

export default function ThemePicker({ config, onChange }: Props) {
  // Theme cards preview their real font; this runs in the admin only.
  useEffect(() => {
    loadAllFonts()
  }, [])

  const base = getThemeById(config.themeId) ?? THEMES[0]
  const overrides: ThemeOverrides = config.overrides || {}

  const setOverride = (patch: ThemeOverrides) => {
    const next: ThemeOverrides = { ...overrides, ...patch }
    ;(Object.keys(next) as (keyof ThemeOverrides)[]).forEach((k) => {
      if (next[k] === undefined || next[k] === '') delete next[k]
    })
    onChange({ ...config, overrides: next })
  }

  const reset = () => onChange({ ...config, overrides: {} })

  return (
    <div className="space-y-5">
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
        {THEMES.map((t) => {
          const selected = t.id === config.themeId
          const preview = resolveTheme({ themeId: t.id, overrides: selected ? overrides : {} })
          return (
            <button
              key={t.id}
              type="button"
              onClick={() => onChange({ ...config, themeId: t.id, overrides })}
              aria-pressed={selected}
              className={`relative overflow-hidden rounded-xl border text-left transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary ${
                selected
                  ? 'border-primary ring-2 ring-primary/40'
                  : 'border-border hover:border-muted-foreground/40 hover:shadow-sm'
              }`}
            >
              <div className="pp-root h-24 w-full p-3" style={themeToCssVars(preview)}>
                <div className="pp-card px-2 py-1">
                  <p className="truncate text-[11px] font-semibold" style={{ color: 'var(--pp-text)' }}>
                    {t.name}
                  </p>
                </div>
                <div className="pp-btn mt-2 inline-flex px-3 py-1 text-[10px] font-medium">Button</div>
              </div>
              <div className="flex items-center justify-between px-3 py-2">
                <span className="text-xs font-medium">{t.name}</span>
                {selected && <Check className="h-3.5 w-3.5 text-primary" />}
              </div>
            </button>
          )
        })}
      </div>

      <div className="space-y-4 rounded-xl border bg-muted/20 p-4">
        <div className="flex items-center justify-between gap-3">
          <p className="flex items-center gap-2 text-sm font-medium">
            <Palette className="h-4 w-4" /> Customize “{base.name}”
          </p>
          <button
            type="button"
            onClick={reset}
            className="inline-flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground"
          >
            <RotateCcw className="h-3 w-3" /> Reset
          </button>
        </div>
        <div className="grid gap-3 sm:grid-cols-2">
          <label className="space-y-1 text-xs">
            <span className="font-medium">Font</span>
            <select
              value={overrides.fontFamily || base.typography.fontFamily}
              onChange={(e) => setOverride({ fontFamily: e.target.value as ProfileFont })}
              className="input h-10"
            >
              {FONT_OPTIONS.map((f) => (
                <option key={f.value} value={f.value}>
                  {f.label}
                </option>
              ))}
            </select>
          </label>
          <label className="space-y-1 text-xs">
            <span className="font-medium">Button style</span>
            <select
              value={overrides.buttonShape || base.button.shape}
              onChange={(e) => setOverride({ buttonShape: e.target.value as ThemeButtonShape })}
              className="input h-10"
            >
              {BUTTON_SHAPES.map((s) => (
                <option key={s.value} value={s.value}>
                  {s.label}
                </option>
              ))}
            </select>
          </label>
        </div>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          {COLOR_FIELDS.map(({ key, label, base: baseKey }) => {
            const fallback = base.colors[baseKey]
            const value = overrides[key] || fallback
            return (
              <label key={key} className="space-y-1 text-xs">
                <span className="font-medium">{label}</span>
                <div className="flex items-center gap-2">
                  <input
                    type="color"
                    value={value}
                    onChange={(e) => setOverride({ [key]: e.target.value } as ThemeOverrides)}
                    className="h-10 w-12 cursor-pointer rounded border bg-background p-0.5"
                  />
                  <span className="font-mono text-[10px] text-muted-foreground">{value}</span>
                </div>
              </label>
            )
          })}
        </div>
      </div>
    </div>
  )
}
