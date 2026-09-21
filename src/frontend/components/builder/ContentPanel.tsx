import { useState } from 'react'
import { AlertTriangle } from 'lucide-react'
import { api } from '../../services/api'
import { useAuth } from '../../hooks/useAuth'
import type { ProfileDraft } from '../../hooks/useProfileDraft'
import type { StoredThemeConfig } from '../../themes'
import SocialsEditor from '../profile/SocialsEditor'
import type { SocialDraft } from '../profile/socialMeta'
import { Disclosure, Field } from './controls'
import ImageUploadField from './ImageUploadField'
import type { BuilderLink } from './types'

type Props = {
  draft: ProfileDraft
  patch: (values: Partial<ProfileDraft>) => void
  setThemeConfig: (p: Partial<StoredThemeConfig>) => void
  socialErrors: Record<string, string>
  setSocials: (items: SocialDraft[]) => void
  links: BuilderLink[]
  onManageLinks: () => void
  /** Expand the Social & contact section on mount (used by the Theme tab CTA). */
  openSocial?: boolean
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
  openSocial = false,
}: Props) {
  const featuredCandidates = links.filter((l) => l.enabled && l.thumbnail)

  const togglePublished = () => {
    if (
      draft.published &&
      !confirm(
        'Unpublish your profile? It will be hidden from the public until you publish again.'
      )
    ) {
      return
    }
    patch({ published: !draft.published })
  }

  return (
    <div className="space-y-4">
      {/* Publishing is the single most consequential control, so it gets its own
          prominent status card instead of an ordinary checkbox. */}
      <div
        className={`rounded-xl border p-3 ${
          draft.published ? 'border-green-500/40 bg-green-500/5' : 'border-amber-500/40 bg-amber-500/5'
        }`}
      >
        <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-muted-foreground">
          Public page
        </p>
        <div className="mt-2 flex items-start justify-between gap-3">
          <div className="min-w-0">
            <p className="flex items-center gap-1.5 text-sm font-semibold">
              <span
                className={`h-2 w-2 shrink-0 rounded-full ${
                  draft.published ? 'bg-green-500' : 'bg-amber-500'
                }`}
                aria-hidden="true"
              />
              {draft.published ? 'Published' : 'Unpublished'}
            </p>
            <p className="mt-0.5 text-[11px] leading-snug text-muted-foreground">
              {draft.published
                ? 'Your profile is visible on your public page.'
                : 'Your profile is currently hidden from the public.'}
            </p>
          </div>
          <button
            type="button"
            role="switch"
            aria-checked={draft.published}
            aria-label={draft.published ? 'Unpublish profile' : 'Publish profile'}
            onClick={togglePublished}
            className={`relative inline-flex h-6 w-11 shrink-0 items-center rounded-full transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary ${
              draft.published ? 'bg-green-500' : 'bg-muted-foreground/40'
            }`}
          >
            <span
              className={`inline-block h-5 w-5 transform rounded-full bg-white shadow transition-transform ${
                draft.published ? 'translate-x-5' : 'translate-x-0.5'
              }`}
            />
          </button>
        </div>
      </div>

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
        <Field label="Profile image" hint="Upload a JPG, PNG or WebP. Used as the profile picture.">
          <ImageUploadField
            value={draft.logoUrl}
            onChange={(url) => patch({ logoUrl: url })}
            uploadLabel="Upload image"
            hint="Supported formats: JPG, PNG, WebP."
            previewClassName="h-10 w-10 object-contain"
          >
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
            {(draft.themeConfig.logoShape ?? 'circle') === 'plain' && (
              <p className="mt-1 text-[10px] leading-snug text-muted-foreground">
                Plain renders the logo without a container and ignores the Avatar shape.
              </p>
            )}
          </ImageUploadField>
        </Field>

        <p className="text-[11px] leading-snug text-muted-foreground">
          The hero / banner image is uploaded from the Theme tab, next to Header style.
        </p>

        <UsernameField />
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
          hint="Promotes one link with a thumbnail into a large tile at the top. You can also star a link in the Links workspace."
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
        {featuredCandidates.length === 0 && (
          <p className="text-[11px] leading-snug text-muted-foreground">
            No link has a thumbnail yet. Add a thumbnail to a link to make it featureable.
          </p>
        )}
      </Disclosure>

      <Disclosure
        title="Social & contact"
        defaultOpen={openSocial}
        badge={
          <span className="text-[10px] font-medium text-muted-foreground">
            {draft.socials.length}
          </span>
        }
      >
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
