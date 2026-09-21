import { useEffect, useMemo, useState } from 'react'
import { Loader2, MapPin } from 'lucide-react'
import { ICON_OPTIONS } from '../profile/linkIcons'
import { isMapsUrl } from '../profile/smartLink'
import type { LinkFormErrors, LinkFormValues, ResolvedLocation } from './linkFormModel'

type Props = {
  formId: string
  values: LinkFormValues
  errors: LinkFormErrors
  sections: { id: string; title: string }[]
  uploadingThumb: boolean
  onChange: (patch: Partial<LinkFormValues>) => void
  onUploadThumbnail: (e: React.ChangeEvent<HTMLInputElement>) => void
  onSubmit: (e: React.FormEvent) => void
  /** Resolves Maps metadata server-side so the location can be previewed before saving. */
  resolveLocation?: ((url: string) => Promise<ResolvedLocation>) | undefined
}

type LocationPreview =
  | { status: 'idle' }
  | { status: 'loading' }
  | { status: 'ready'; placeName?: string | undefined; address?: string | undefined }
  | { status: 'none' }

// One form for both Add and Edit. The parent owns the values/errors/submitting
// state so the modal can reuse it without duplicating the fields.
export default function LinkForm({
  formId,
  values,
  errors,
  sections,
  uploadingThumb,
  onChange,
  onUploadThumbnail,
  onSubmit,
  resolveLocation,
}: Props) {
  const [location, setLocation] = useState<LocationPreview>({ status: 'idle' })
  const url = values.url.trim()
  const isMaps = isMapsUrl(url)

  // Debounced Smart Link preview: the owner pastes a Maps URL and sees the
  // resolved place/address (or a clear "not readable" state) without saving.
  useEffect(() => {
    if (!isMaps || !resolveLocation) {
      setLocation({ status: 'idle' })
      return
    }
    let cancelled = false
    setLocation({ status: 'loading' })
    const timer = window.setTimeout(() => {
      resolveLocation(url)
        .then((res) => {
          if (cancelled) return
          if (res.type === 'location' && res.metadata) {
            setLocation({
              status: 'ready',
              placeName: res.metadata.placeName,
              address: res.metadata.address,
            })
          } else {
            setLocation({ status: 'none' })
          }
        })
        .catch(() => {
          if (!cancelled) setLocation({ status: 'none' })
        })
    }, 700)
    return () => {
      cancelled = true
      window.clearTimeout(timer)
    }
  }, [isMaps, url, resolveLocation])

  const iconButtons = useMemo(
    () =>
      ICON_OPTIONS.map((opt) => {
        const Icon = opt.icon
        const selected = values.icon === opt.value
        return (
          <button
            key={opt.value}
            type="button"
            onClick={() => onChange({ icon: opt.value })}
            aria-pressed={selected}
            title={opt.label}
            aria-label={opt.label}
            className={`flex min-h-[44px] flex-col items-center gap-1 rounded-lg border p-2 text-xs transition-colors hover:bg-accent ${
              selected ? 'border-primary bg-primary text-primary-foreground shadow' : 'bg-background'
            }`}
          >
            <Icon className="h-5 w-5" />
            <span className="w-full truncate text-center text-[10px] leading-none">{opt.label}</span>
          </button>
        )
      }),
    [values.icon, onChange]
  )

  return (
    <form id={formId} onSubmit={onSubmit} className="space-y-5">
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        <div>
          <label htmlFor={`${formId}-title`} className="mb-1 block text-xs font-semibold">
            Title
          </label>
          <input
            id={`${formId}-title`}
            data-autofocus
            value={values.title}
            onChange={(e) => onChange({ title: e.target.value })}
            placeholder="e.g. WhatsApp"
            className={`input ${errors.title ? 'border-red-400' : ''}`}
            aria-invalid={!!errors.title}
          />
          {errors.title && <p className="mt-1 text-xs text-red-600">{errors.title}</p>}
        </div>
        <div>
          <label htmlFor={`${formId}-url`} className="mb-1 block text-xs font-semibold">
            URL
          </label>
          <input
            id={`${formId}-url`}
            value={values.url}
            onChange={(e) => onChange({ url: e.target.value })}
            placeholder="https://..."
            className={`input ${errors.url ? 'border-red-400' : ''}`}
            aria-invalid={!!errors.url}
          />
          {errors.url && <p className="mt-1 text-xs text-red-600">{errors.url}</p>}
          {isMaps ? (
            <div className="mt-2 space-y-2 rounded-lg border border-primary/30 bg-primary/5 p-2.5">
              <p className="flex items-center gap-1.5 text-xs font-medium text-primary">
                <MapPin className="h-3.5 w-3.5 shrink-0" /> Google Maps location detected — this
                will be a Location Smart Link.
              </p>

              {location.status === 'loading' && (
                <p className="flex items-center gap-1.5 text-[11px] text-muted-foreground">
                  <Loader2 className="h-3.5 w-3.5 animate-spin" aria-hidden="true" />
                  Resolving location…
                </p>
              )}

              {location.status === 'ready' && (
                <div className="rounded-md border border-primary/20 bg-background/70 p-2">
                  {location.placeName && (
                    <p className="text-xs font-semibold">{location.placeName}</p>
                  )}
                  {location.address && (
                    <p className="mt-0.5 flex items-start gap-1 text-[11px] leading-snug text-muted-foreground">
                      <MapPin className="mt-0.5 h-3 w-3 shrink-0" aria-hidden="true" />
                      <span>{location.address}</span>
                    </p>
                  )}
                </div>
              )}

              {location.status === 'none' && (
                <p className="text-[11px] leading-snug text-muted-foreground">
                  No place or address could be read from this URL. The link still works as a normal
                  link.
                </p>
              )}

              <label className="flex items-center gap-2 text-xs">
                <input
                  type="checkbox"
                  checked={values.showLocation}
                  onChange={(e) => onChange({ showLocation: e.target.checked })}
                />
                Show location info on the public profile
              </label>
            </div>
          ) : (
            <p className="mt-1 text-[11px] text-muted-foreground">
              Tip: paste a Google Maps URL to create a Location Smart Link.
            </p>
          )}
        </div>
      </div>

      <label className="flex items-center gap-2 text-sm">
        <input
          type="checkbox"
          checked={values.showUrl}
          onChange={(e) => onChange({ showUrl: e.target.checked })}
        />
        Show URL on the profile
      </label>

      <div className="space-y-2">
        <label htmlFor={`${formId}-thumb`} className="text-sm font-medium">
          Thumbnail (optional)
        </label>
        <div className="flex flex-wrap gap-2">
          <input
            id={`${formId}-thumb`}
            value={values.thumbnail}
            onChange={(e) => onChange({ thumbnail: e.target.value })}
            placeholder="https://... or upload"
            className="input min-w-[180px] flex-1"
          />
          <label
            className={`inline-flex cursor-pointer items-center gap-2 rounded-md border px-4 py-2 text-sm ${
              uploadingThumb ? 'opacity-50' : 'hover:bg-accent'
            }`}
          >
            {uploadingThumb ? 'Uploading…' : 'Upload'}
            <input
              type="file"
              accept="image/png,image/jpeg,image/webp,image/gif"
              className="hidden"
              disabled={uploadingThumb}
              onChange={onUploadThumbnail}
            />
          </label>
          {values.thumbnail && (
            <button
              type="button"
              onClick={() => onChange({ thumbnail: '' })}
              className="rounded-md border px-3 py-2 text-sm text-red-600 hover:bg-accent"
            >
              Remove
            </button>
          )}
        </div>
        {values.thumbnail && (
          <img
            src={values.thumbnail}
            alt="Thumbnail preview"
            className="h-24 w-full rounded-lg object-cover"
          />
        )}
        <p className="text-[11px] text-muted-foreground">
          A thumbnail lets this link become the optional featured tile.
        </p>
      </div>

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        <div className="space-y-2">
          <span className="text-sm font-medium">Text alignment</span>
          <div className="flex gap-2" role="group" aria-label="Text alignment">
            {(['left', 'center', 'right'] as const).map((a) => (
              <button
                key={a}
                type="button"
                onClick={() => onChange({ align: a })}
                aria-pressed={values.align === a}
                className={`flex-1 rounded-md border px-3 py-2 text-xs capitalize ${
                  values.align === a ? 'border-primary bg-primary/10 text-primary' : 'hover:bg-accent'
                }`}
              >
                {a}
              </button>
            ))}
          </div>
        </div>
        <div className="space-y-2">
          <label htmlFor={`${formId}-section`} className="text-sm font-medium">
            Section
          </label>
          <select
            id={`${formId}-section`}
            value={values.sectionId}
            onChange={(e) => onChange({ sectionId: e.target.value })}
            className="input"
          >
            <option value="">No Section</option>
            {sections.map((s) => (
              <option key={s.id} value={s.id}>
                {s.title}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div className="space-y-2">
        <span className="text-sm font-medium">Icon</span>
        <div className="grid grid-cols-4 gap-2 sm:grid-cols-6 md:grid-cols-9">{iconButtons}</div>
        <p className="text-xs text-muted-foreground">
          Choose the icon that appears next to your link. Saved as{' '}
          <code className="rounded bg-muted px-1">{values.icon}</code>
        </p>
      </div>
    </form>
  )
}
