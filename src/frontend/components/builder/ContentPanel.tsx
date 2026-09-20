import { useState } from 'react'
import { AlertTriangle, Upload, X } from 'lucide-react'
import { api } from '../../services/api'
import { useAuth } from '../../hooks/useAuth'
import type { ProfileDraft } from '../../hooks/useProfileDraft'
import type { StoredThemeConfig } from '../../themes'
import SocialsEditor from '../profile/SocialsEditor'
import type { SocialDraft } from '../profile/socialMeta'
import { Disclosure, Field } from './controls'
import type { BuilderLink } from './types'

type Props = {
  draft: ProfileDraft
  patch: (values: Partial<ProfileDraft>) => void
  setThemeConfig: (p: Partial<StoredThemeConfig>) => void
  socialErrors: Record<string, string>
  setSocials: (items: SocialDraft[]) => void
  links: BuilderLink[]
  onManageLinks: () => void
}

/* Username is a separate account-level field with its own endpoint, so it keeps
   its own small form rather than living in the draft state. */
function UsernameField() {
  const { user } = useAuth()
  const [username, setUsername] = useState(user?.username ?? '')
  const [msg, setMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null)
  const [saving, setSaving] = useState(false)

  const save = async () => {
    const clean = username.trim().toLowerCase()
    if (!/^[a-z0-9_]{3,30}$/.test(clean)) {
      setMsg({ type: 'error', text: '3-30 lowercase letters, numbers, underscore' })
      return
    }
    if (clean === user?.username) {
      setMsg({ type: 'error', text: 'Username unchanged' })
      return
    }
    if (!confirm(`Change username to @${clean}? Your public URL will change.`)) return
    setSaving(true)
    setMsg(null)
    try {
      const res = (await api.meUpdate({ username: clean })) as {
        data: { username: string }
      }
      setMsg({ type: 'success', text: `Username changed to @${res.data.username}` })
      setTimeout(() => window.location.reload(), 1200)
    } catch (err: unknown) {
      setMsg({ type: 'error', text: err instanceof Error ? err.message : 'Failed to change' })
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="space-y-1.5">
      <label htmlFor="builder-username" className="block text-xs font-semibold">
        Username (public URL)
      </label>
      <div className="flex gap-2">
        <span className="inline-flex items-center rounded-l-lg border border-r-0 bg-muted px-2 text-xs text-muted-foreground">
          /@
        </span>
        <input
          id="builder-username"
          value={username}
          onChange={(e) => setUsername(e.target.value.toLowerCase().replace(/[^a-z0-9_]/g, ''))}
          maxLength={30}
          className="input h-9 rounded-l-none flex-1"
        />
        <button
          type="button"
          onClick={save}
          disabled={saving || username.trim().toLowerCase() === user?.username}
          className="rounded-lg bg-primary px-3 py-2 text-xs font-medium text-primary-foreground hover:bg-primary/90 disabled:opacity-50"
        >
          {saving ? 'Saving…' : 'Change'}
        </button>
      </div>
      {username.trim().toLowerCase() !== user?.username && (
        <p className="flex items-center gap-1 text-[11px] text-amber-600">
          <AlertTriangle className="h-3 w-3" /> Changes from /@{user?.username} to /@
          {username.trim().toLowerCase()}
        </p>
      )}
      {msg && (
        <p className={`text-[11px] ${msg.type === 'error' ? 'text-red-600' : 'text-green-600'}`}>
          {msg.text}
        </p>
      )}
    </div>
  )
}

export default function ContentPanel({
  draft,
  patch,
  setThemeConfig,
  socialErrors,
  setSocials,
  links,
  onManageLinks,
}: Props) {
  const [uploading, setUploading] = useState<'logoUrl' | 'bannerUrl' | null>(null)
  const [uploadError, setUploadError] = useState('')
  const featuredCandidates = links.filter((l) => l.enabled && l.thumbnail)

  const upload = async (
    e: React.ChangeEvent<HTMLInputElement>,
    field: 'logoUrl' | 'bannerUrl'
  ) => {
    const file = e.target.files?.[0]
    if (!file) return
    setUploadError('')
    setUploading(field)
    try {
      const res = (await api.uploadImage(file)) as { data?: { url?: string } }
      if (res.data?.url) patch({ [field]: res.data.url } as Partial<ProfileDraft>)
    } catch (err: unknown) {
      setUploadError(err instanceof Error ? err.message : 'Upload failed')
    } finally {
      setUploading(null)
      e.target.value = ''
    }
  }

  return (
    <div className="space-y-4">
      <Disclosure title="Identity" defaultOpen>
        <Field label="Display name" htmlFor="builder-name">
          <input
            id="builder-name"
            value={draft.displayName}
            onChange={(e) => patch({ displayName: e.target.value })}
            className="input h-9"
          />
        </Field>
        <Field label="Bio" htmlFor="builder-bio">
          <textarea
            id="builder-bio"
            value={draft.bio}
            onChange={(e) => patch({ bio: e.target.value })}
            maxLength={500}
            rows={3}
            className="input h-auto py-2"
          />
        </Field>
        <Field label="Logo / avatar" hint="Used as the profile picture.">
          <div className="space-y-2">
            <div className="flex flex-wrap gap-2">
              <input
                value={draft.logoUrl ?? ''}
                onChange={(e) => patch({ logoUrl: e.target.value || null })}
                placeholder="https://... or upload"
                className="input h-9 min-w-[140px] flex-1"
              />
              <label
                className={`inline-flex cursor-pointer items-center gap-1.5 rounded-lg border px-3 text-xs ${
                  uploading === 'logoUrl' ? 'opacity-50' : 'hover:bg-accent'
                }`}
              >
                <Upload className="h-3.5 w-3.5" />
                {uploading === 'logoUrl' ? 'Uploading…' : 'Upload'}
                <input
                  type="file"
                  accept="image/png,image/jpeg,image/webp,image/gif"
                  className="hidden"
                  disabled={uploading !== null}
                  onChange={(e) => upload(e, 'logoUrl')}
                />
              </label>
            </div>
            {draft.logoUrl && (
              <div className="flex items-center gap-3 rounded-lg border bg-muted/30 p-2">
                <img src={draft.logoUrl} alt="Logo preview" className="h-10 w-10 object-contain" />
                <div className="flex-1">
                  <p className="text-[11px] font-medium">Logo shape</p>
                  <div className="mt-1 flex gap-1.5">
                    {(['circle', 'plain'] as const).map((s) => (
                      <button
                        key={s}
                        type="button"
                        onClick={() => setThemeConfig({ logoShape: s })}
                        aria-pressed={(draft.themeConfig.logoShape ?? 'circle') === s}
                        className={`rounded-md border px-2 py-1 text-[10px] ${
                          (draft.themeConfig.logoShape ?? 'circle') === s
                            ? 'border-primary bg-primary/10 text-primary'
                            : 'hover:bg-accent'
                        }`}
                      >
                        {s === 'plain' ? 'Plain (PNG)' : 'Circle'}
                      </button>
                    ))}
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => patch({ logoUrl: null })}
                  aria-label="Remove logo"
                  className="rounded-lg p-1.5 text-muted-foreground hover:bg-accent hover:text-red-600"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
            )}
          </div>
        </Field>

        {(draft.headerStyle === 'hero' || draft.headerStyle === 'banner') && (
          <Field label="Banner image">
            <div className="flex flex-wrap gap-2">
              <input
                value={draft.bannerUrl ?? ''}
                onChange={(e) => patch({ bannerUrl: e.target.value || null })}
                placeholder="https://... or upload"
                className="input h-9 min-w-[140px] flex-1"
              />
              <label
                className={`inline-flex cursor-pointer items-center gap-1.5 rounded-lg border px-3 text-xs ${
                  uploading === 'bannerUrl' ? 'opacity-50' : 'hover:bg-accent'
                }`}
              >
                <Upload className="h-3.5 w-3.5" />
                {uploading === 'bannerUrl' ? 'Uploading…' : 'Upload'}
                <input
                  type="file"
                  accept="image/png,image/jpeg,image/webp,image/gif"
                  className="hidden"
                  disabled={uploading !== null}
                  onChange={(e) => upload(e, 'bannerUrl')}
                />
              </label>
              {draft.bannerUrl && (
                <button
                  type="button"
                  onClick={() => patch({ bannerUrl: null })}
                  className="rounded-lg border px-3 text-xs text-red-600 hover:bg-accent"
                >
                  Remove
                </button>
              )}
            </div>
          </Field>
        )}
        {uploadError && <p className="text-[11px] text-red-600">{uploadError}</p>}

        <UsernameField />

        <label className="flex items-center gap-2 text-xs">
          <input
            type="checkbox"
            checked={draft.published}
            onChange={(e) => patch({ published: e.target.checked })}
          />
          Published (visible on your public page)
        </label>
      </Disclosure>

      <Disclosure title="Links" defaultOpen badge={
        <span className="text-[10px] font-medium text-muted-foreground">{links.length}</span>
      }>
        <p className="text-[11px] leading-snug text-muted-foreground">
          Add, edit, reorder and organize links — including sections — in the full-width Links
          workspace.
        </p>
        <button
          type="button"
          onClick={onManageLinks}
          className="inline-flex w-full items-center justify-center gap-1.5 rounded-lg bg-primary px-3 py-2 text-xs font-medium text-primary-foreground hover:bg-primary/90"
        >
          Manage links
        </button>
        <Field
          label="Featured link"
          hint="Promotes one link with a thumbnail into a large tile at the top."
          htmlFor="builder-featured"
        >
          <select
            id="builder-featured"
            value={draft.themeConfig.featuredLinkId ?? ''}
            onChange={(e) => setThemeConfig({ featuredLinkId: e.target.value || null })}
            className="input h-9"
            disabled={featuredCandidates.length === 0}
          >
            <option value="">None</option>
            {featuredCandidates.map((l) => (
              <option key={l.id} value={l.id}>
                {l.title}
              </option>
            ))}
          </select>
        </Field>
      </Disclosure>

      <Disclosure title="Social & contact" badge={
        <span className="text-[10px] font-medium text-muted-foreground">{draft.socials.length}</span>
      }>
        <SocialsEditor items={draft.socials} errors={socialErrors} onChange={setSocials} />
      </Disclosure>

      <Disclosure title="Share block">
        <label className="flex items-center gap-2 text-xs">
          <input
            type="checkbox"
            checked={draft.themeConfig.showShare !== false}
            onChange={(e) => setThemeConfig({ showShare: e.target.checked })}
          />
          Show the Share section (QR &amp; copy link)
        </label>
      </Disclosure>
    </div>
  )
}
