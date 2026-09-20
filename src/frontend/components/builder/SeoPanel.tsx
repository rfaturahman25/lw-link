import type { StoredThemeConfig } from '../../themes'
import { Field } from './controls'

type Props = {
  config: StoredThemeConfig
  onChange: (config: StoredThemeConfig) => void
  displayName: string
  profileUrl: string
}

// SEO controls live in their own tab so they never mix with visual editing.
// Values are stored inside theme_config (additive, no schema change) and applied
// by the public page as <title> / meta description / Open Graph tags.
export default function SeoPanel({ config, onChange, displayName, profileUrl }: Props) {
  const title = config.seoTitle ?? ''
  const description = config.seoDescription ?? ''
  const previewTitle = title || displayName || 'Your name'
  const previewDesc = description || 'Your bio becomes the meta description by default.'

  return (
    <div className="space-y-4">
      <div className="rounded-xl border border-border/70 bg-muted/30 p-3">
        <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-muted-foreground">
          Search preview
        </p>
        <p className="mt-2 truncate text-[13px] font-medium text-blue-700 dark:text-blue-400">
          {previewTitle}
        </p>
        <p className="truncate text-[11px] text-green-700 dark:text-green-500">{profileUrl}</p>
        <p className="mt-0.5 line-clamp-2 text-[11px] text-muted-foreground">{previewDesc}</p>
      </div>

      <Field
        label="Page title"
        hint={`${title.length}/120 — defaults to your display name.`}
        htmlFor="seo-title"
      >
        <input
          id="seo-title"
          value={title}
          maxLength={120}
          onChange={(e) => onChange({ ...config, seoTitle: e.target.value })}
          placeholder={displayName}
          className="input h-9"
        />
      </Field>

      <Field
        label="Meta description"
        hint={`${description.length}/300 — defaults to your bio.`}
        htmlFor="seo-desc"
      >
        <textarea
          id="seo-desc"
          value={description}
          maxLength={300}
          rows={4}
          onChange={(e) => onChange({ ...config, seoDescription: e.target.value })}
          placeholder="A short description shown in search results and link previews."
          className="input h-auto py-2"
        />
      </Field>

      <p className="text-[11px] leading-snug text-muted-foreground">
        These fields only affect how the public page is described to search engines and social
        platforms. They never change the visible profile.
      </p>
    </div>
  )
}
