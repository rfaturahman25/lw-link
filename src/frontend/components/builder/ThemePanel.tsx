import { useMemo, useState } from 'react'
import { Check, Palette, RotateCcw, Sparkles } from 'lucide-react'
import {
  FONT_OPTIONS,
  THEMES,
  THEME_CATEGORIES,
  getThemeById,
  resolveTheme,
  themeToCssVars,
} from '../../themes'
import type {
  AvatarShape,
  AvatarSize,
  ContentDensity,
  ContentWidth,
  NameTreatment,
  ProfileAlign,
  ProfileFont,
  ProfileHeaderStyle,
  ProfileTheme,
  SocialIconStyle,
  StoredThemeConfig,
  ThemeButtonShape,
  ThemeCategory,
  ThemeOverrides,
} from '../../themes'
import { ColorField, Disclosure, Field, OptionCards, Segmented, Slider } from './controls'

const HEADER_STYLES: { value: ProfileHeaderStyle; label: string; desc: string }[] = [
  { value: 'classic', label: 'Classic', desc: 'Avatar on top' },
  { value: 'hero', label: 'Hero', desc: 'Banner behind' },
  { value: 'banner', label: 'Banner', desc: 'Banner above' },
  { value: 'shape', label: 'Shape', desc: 'Framed avatar' },
]

const AVATAR_SHAPES: { value: AvatarShape; label: string }[] = [
  { value: 'circle', label: 'Circle' },
  { value: 'rounded', label: 'Rounded' },
  { value: 'squircle', label: 'Squircle' },
  { value: 'square', label: 'Square' },
  { value: 'hex', label: 'Hex' },
]

const AVATAR_SIZES: { value: AvatarSize; label: string }[] = [
  { value: 'sm', label: 'S' },
  { value: 'md', label: 'M' },
  { value: 'lg', label: 'L' },
]

const NAME_TREATMENTS: { value: NameTreatment; label: string }[] = [
  { value: 'solid', label: 'Solid' },
  { value: 'gradient', label: 'Gradient' },
]

const SOCIAL_ICON_STYLES: { value: SocialIconStyle; label: string }[] = [
  { value: 'surface', label: 'Surface' },
  { value: 'tinted', label: 'Tinted' },
  { value: 'plain', label: 'Plain' },
]

const CONTENT_WIDTHS: { value: ContentWidth; label: string }[] = [
  { value: 'compact', label: 'S' },
  { value: 'cozy', label: 'M' },
  { value: 'wide', label: 'L' },
]

const DENSITIES: { value: ContentDensity; label: string }[] = [
  { value: 'compact', label: 'Tight' },
  { value: 'comfortable', label: 'Normal' },
  { value: 'spacious', label: 'Airy' },
]

const ALIGNS: { value: ProfileAlign; label: string }[] = [
  { value: 'center', label: 'Center' },
  { value: 'left', label: 'Left' },
]

const BUTTON_SHAPES: { value: ThemeButtonShape; label: string; desc: string }[] = [
  { value: 'square', label: 'Square', desc: 'Sharp corners' },
  { value: 'rounded', label: 'Rounded', desc: 'Soft corners' },
  { value: 'pill', label: 'Pill', desc: 'Fully round' },
  { value: 'outlined', label: 'Outline', desc: 'Bordered' },
  { value: 'elevated', label: 'Elevated', desc: 'Lifted' },
]

type CategoryFilter = ThemeCategory | 'all'

// A miniature but faithful profile surface. It renders through the same CSS
// variables as the real page (no font fetches — presets use the fallback stack).
function PresetCard({
  theme,
  selected,
  onSelect,
}: {
  theme: ProfileTheme
  selected: boolean
  onSelect: () => void
}) {
  const preview = resolveTheme({ themeId: theme.id, overrides: {} })
  return (
    <button
      type="button"
      onClick={onSelect}
      aria-pressed={selected}
      aria-label={`${theme.name} theme`}
      className={`relative overflow-hidden rounded-xl border text-left transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary ${
        selected
          ? 'border-primary ring-2 ring-primary/40'
          : 'border-border hover:-translate-y-0.5 hover:border-muted-foreground/40 hover:shadow-md'
      }`}
    >
      <div
        className="pp-root flex h-24 w-full flex-col items-center justify-center gap-1.5 p-3"
        style={themeToCssVars(preview)}
      >
        <div
          style={{
            width: 22,
            height: 22,
            borderRadius: '9999px',
            background: 'var(--pp-card)',
            boxShadow: '0 0 0 2px var(--pp-avatar-ring)',
          }}
        />
        <div
          style={{
            width: 48,
            height: 5,
            borderRadius: 999,
            background: 'var(--pp-text)',
            opacity: 0.85,
          }}
        />
        <div
          style={{
            width: 88,
            height: 11,
            borderRadius: 'var(--pp-link-radius)',
            background: 'var(--pp-link-bg)',
            border: '1px solid var(--pp-link-border)',
          }}
        />
        <div
          style={{
            width: 88,
            height: 11,
            borderRadius: 'var(--pp-link-radius)',
            background: 'var(--pp-link-bg)',
            border: '1px solid var(--pp-link-border)',
          }}
        />
      </div>
      <div className="flex items-center justify-between gap-1 px-2.5 py-1.5">
        <span className="truncate text-[11px] font-semibold">{theme.name}</span>
        {selected ? (
          <Check className="h-3.5 w-3.5 shrink-0 text-primary" />
        ) : (
          <span
            className="h-2.5 w-2.5 shrink-0 rounded-full border"
            style={{ backgroundColor: theme.colors.accent }}
            aria-hidden="true"
          />
        )}
      </div>
    </button>
  )
}

type Props = {
  config: StoredThemeConfig
  onChange: (config: StoredThemeConfig) => void
  headerStyle: ProfileHeaderStyle
  onHeaderStyleChange: (h: ProfileHeaderStyle) => void
}

export default function ThemePanel({ config, onChange, headerStyle, onHeaderStyleChange }: Props) {
  const [category, setCategory] = useState<CategoryFilter>('all')

  const base = getThemeById(config.themeId) ?? THEMES[0]
  const overrides: ThemeOverrides = config.overrides || {}
  const resolvedFont = overrides.fontFamily || base.typography.fontFamily

  const visibleThemes = useMemo(
    () => (category === 'all' ? THEMES : THEMES.filter((t) => t.category === category)),
    [category]
  )

  const updateOverride = (patch: ThemeOverrides) => {
    const next: ThemeOverrides = { ...overrides, ...patch }
    ;(Object.keys(next) as (keyof ThemeOverrides)[]).forEach((k) => {
      if (next[k] === undefined || next[k] === '') delete next[k]
    })
    onChange({ ...config, overrides: next })
  }

  const setConfig = (patch: Partial<StoredThemeConfig>) => onChange({ ...config, ...patch })

  const clearOverride = (key: keyof ThemeOverrides) => {
    const next: ThemeOverrides = { ...overrides }
    delete next[key]
    onChange({ ...config, overrides: next })
  }

  const resetOverrides = () => onChange({ ...config, overrides: {} })

  const quickColors = [base.colors.accent, base.colors.button, base.colors.text]
  const hasOverrides = Object.keys(overrides).length > 0

  return (
    <div className="space-y-4">
      {/* Presets ------------------------------------------------------- */}
      <div className="space-y-2.5">
        <div className="flex items-center justify-between">
          <p className="flex items-center gap-1.5 text-xs font-semibold">
            <Sparkles className="h-3.5 w-3.5 text-primary" /> Theme presets
          </p>
          {hasOverrides && (
            <button
              type="button"
              onClick={resetOverrides}
              className="inline-flex items-center gap-1 text-[10px] font-medium text-muted-foreground hover:text-foreground"
            >
              <RotateCcw className="h-3 w-3" /> Reset tweaks
            </button>
          )}
        </div>
        <Segmented<CategoryFilter>
          ariaLabel="Theme category"
          size="sm"
          value={category}
          onChange={setCategory}
          options={[
            { value: 'all', label: 'All' },
            ...THEME_CATEGORIES.map((c) => ({ value: c.id as CategoryFilter, label: c.label })),
          ]}
        />
        <div className="grid grid-cols-2 gap-2.5">
          {visibleThemes.map((t) => (
            <PresetCard
              key={t.id}
              theme={t}
              selected={t.id === config.themeId}
              onSelect={() => onChange({ ...config, themeId: t.id, overrides })}
            />
          ))}
        </div>
      </div>

      <Disclosure title="Typography" defaultOpen badge={
        <span className="text-[10px] font-medium text-muted-foreground">
          {FONT_OPTIONS.find((f) => f.value === resolvedFont)?.label ?? 'Inter'}
        </span>
      }>
        <Field label="Font" htmlFor="builder-font">
          <select
            id="builder-font"
            value={resolvedFont}
            onChange={(e) => updateOverride({ fontFamily: e.target.value as ProfileFont })}
            className="input h-10"
          >
            {FONT_OPTIONS.map((f) => (
              <option key={f.value} value={f.value}>
                {f.label}
              </option>
            ))}
          </select>
        </Field>
        <Slider
          label="Type scale"
          value={config.typeScale ?? 1}
          min={0.9}
          max={1.15}
          step={0.01}
          onChange={(v) => setConfig({ typeScale: v })}
          format={(v) => `${Math.round(v * 100)}%`}
          ariaLabel="Type scale"
        />
      </Disclosure>

      <Disclosure title="Layout" badge={
        <span className="text-[10px] font-medium text-muted-foreground">
          {CONTENT_WIDTHS.find((w) => w.value === (config.contentWidth ?? 'cozy'))?.label ?? 'M'} ·{' '}
          {ALIGNS.find((a) => a.value === (config.profileAlign ?? 'center'))?.label}
        </span>
      }>
        <Field label="Content width">
          <Segmented<ContentWidth>
            ariaLabel="Content width"
            value={config.contentWidth ?? 'cozy'}
            onChange={(v) => setConfig({ contentWidth: v })}
            options={CONTENT_WIDTHS}
          />
        </Field>
        <Field label="Alignment">
          <Segmented<ProfileAlign>
            ariaLabel="Profile alignment"
            value={config.profileAlign ?? 'center'}
            onChange={(v) => setConfig({ profileAlign: v })}
            options={ALIGNS}
          />
        </Field>
        <Field label="Spacing">
          <Segmented<ContentDensity>
            ariaLabel="Spacing density"
            value={config.density ?? 'comfortable'}
            onChange={(v) => setConfig({ density: v })}
            options={DENSITIES}
          />
        </Field>
      </Disclosure>

      <Disclosure title="Cards & links" badge={
        <span className="text-[10px] font-medium text-muted-foreground">
          {BUTTON_SHAPES.find((s) => s.value === (overrides.buttonShape || base.button.shape))
            ?.label ?? 'Rounded'}
        </span>
      }>
        <Field label="Corner style">
          <OptionCards<ThemeButtonShape>
            ariaLabel="Link card corner style"
            columns={3}
            value={overrides.buttonShape || base.button.shape}
            onChange={(v) => updateOverride({ buttonShape: v })}
            options={BUTTON_SHAPES}
          />
        </Field>
        <ColorField
          label="Card colour"
          value={overrides.cardColor || base.colors.card}
          fallback={base.colors.card}
          onChange={(v) => updateOverride({ cardColor: v })}
          onReset={() => clearOverride('cardColor')}
        />
      </Disclosure>

      <Disclosure title="Colours" badge={
        <span
          className="h-3 w-3 rounded-full border"
          style={{ backgroundColor: overrides.accentColor || base.colors.accent }}
          aria-hidden="true"
        />
      }>
        <ColorField
          label="Accent"
          value={overrides.accentColor || base.colors.accent}
          fallback={base.colors.accent}
          onChange={(v) => updateOverride({ accentColor: v })}
          onReset={() => clearOverride('accentColor')}
          quick={quickColors}
        />
        <ColorField
          label="Text"
          value={overrides.textColor || base.colors.text}
          fallback={base.colors.text}
          onChange={(v) => updateOverride({ textColor: v })}
          onReset={() => clearOverride('textColor')}
        />
        <ColorField
          label="Muted text"
          value={overrides.textSecondaryColor || base.colors.textSecondary}
          fallback={base.colors.textSecondary}
          onChange={(v) => updateOverride({ textSecondaryColor: v })}
          onReset={() => clearOverride('textSecondaryColor')}
        />
        <ColorField
          label="Background"
          value={overrides.backgroundColor || base.background.color}
          fallback={base.background.color}
          onChange={(v) => updateOverride({ backgroundColor: v })}
          onReset={() => clearOverride('backgroundColor')}
        />
        <p className="flex items-center gap-1.5 text-[11px] text-muted-foreground">
          <Palette className="h-3 w-3" /> Background colour overrides the preset base; gradients and
          patterns stay on top.
        </p>
      </Disclosure>

      <Disclosure title="Profile">
        <Field label="Header style">
          <OptionCards<ProfileHeaderStyle>
            ariaLabel="Header style"
            columns={4}
            value={headerStyle}
            onChange={onHeaderStyleChange}
            options={HEADER_STYLES}
          />
        </Field>
        <Field label="Avatar shape">
          <Segmented<AvatarShape>
            ariaLabel="Avatar shape"
            size="sm"
            value={config.avatarShape ?? 'circle'}
            onChange={(v) => setConfig({ avatarShape: v })}
            options={AVATAR_SHAPES}
          />
        </Field>
        <div className="grid grid-cols-2 gap-3">
          <Field label="Avatar size">
            <Segmented<AvatarSize>
              ariaLabel="Avatar size"
              value={config.avatarSize ?? 'md'}
              onChange={(v) => setConfig({ avatarSize: v })}
              options={AVATAR_SIZES}
            />
          </Field>
          <Field label="Avatar ring">
            <Segmented<'on' | 'off'>
              ariaLabel="Avatar ring"
              value={config.avatarRing === false ? 'off' : 'on'}
              onChange={(v) => setConfig({ avatarRing: v === 'on' })}
              options={[
                { value: 'on', label: 'On' },
                { value: 'off', label: 'Off' },
              ]}
            />
          </Field>
        </div>
        <Field label="Name treatment">
          <Segmented<NameTreatment>
            ariaLabel="Name treatment"
            value={config.nameTreatment ?? 'solid'}
            onChange={(v) => setConfig({ nameTreatment: v })}
            options={NAME_TREATMENTS}
          />
        </Field>
      </Disclosure>

      <Disclosure title="Social icons">
        <Field label="Icon style">
          <Segmented<SocialIconStyle>
            ariaLabel="Social icon style"
            value={config.socialIconStyle ?? 'surface'}
            onChange={(v) =>
              setConfig({ socialIconStyle: v, socialStyle: v === 'plain' ? 'plain' : 'circle' })
            }
            options={SOCIAL_ICON_STYLES}
          />
        </Field>
      </Disclosure>
    </div>
  )
}
