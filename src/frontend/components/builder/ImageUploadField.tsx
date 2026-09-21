import { useState } from 'react'
import type { ReactNode } from 'react'
import { Upload } from 'lucide-react'
import { api } from '../../services/api'

type Props = {
  /** Existing image URL, or null. */
  value: string | null
  onChange: (url: string | null) => void
  /** Button label when no image is set yet. */
  uploadLabel?: string
  hint?: string
  previewClassName?: string
  /** Extra controls rendered under the preview (e.g. logo shape). */
  children?: ReactNode
}

// Upload-only image field. External URLs are intentionally not accepted here —
// every image is stored through the existing `/api/uploads` flow.
export default function ImageUploadField({
  value,
  onChange,
  uploadLabel = 'Upload image',
  hint = 'Supported formats: JPG, PNG, WebP.',
  previewClassName = 'h-10 w-10 object-contain',
  children,
}: Props) {
  const [uploading, setUploading] = useState(false)
  const [error, setError] = useState('')

  const upload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    setError('')
    setUploading(true)
    try {
      const res = (await api.uploadImage(file)) as { data?: { url?: string } }
      if (res.data?.url) onChange(res.data.url)
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Upload failed')
    } finally {
      setUploading(false)
      e.target.value = ''
    }
  }

  return (
    <div className="space-y-2">
      <div className="flex flex-wrap gap-2">
        <label
          className={`inline-flex cursor-pointer items-center gap-1.5 rounded-lg border px-3 py-2 text-xs ${
            uploading ? 'opacity-50' : 'hover:bg-accent'
          }`}
        >
          <Upload className="h-3.5 w-3.5" />
          {uploading ? 'Uploading…' : value ? 'Replace image' : uploadLabel}
          <input
            type="file"
            accept="image/png,image/jpeg,image/webp,image/gif"
            className="hidden"
            disabled={uploading}
            onChange={upload}
          />
        </label>
        {value && (
          <button
            type="button"
            onClick={() => onChange(null)}
            className="rounded-lg border px-3 py-2 text-xs text-red-600 hover:bg-accent"
          >
            Remove
          </button>
        )}
      </div>
      {hint && <p className="text-[11px] text-muted-foreground">{hint}</p>}
      {value && (
        <div className="flex items-center gap-3 rounded-lg border bg-muted/30 p-2">
          <img src={value} alt="" className={previewClassName} />
          <div className="min-w-0 flex-1">{children}</div>
        </div>
      )}
      {error && <p className="text-[11px] text-red-600">{error}</p>}
    </div>
  )
}
