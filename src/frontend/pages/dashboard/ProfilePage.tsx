import { useState, useEffect } from 'react'
import { useAuth } from '../../hooks/useAuth'
import { useDashboardContext } from './DashboardLayout'
import { api } from '../../services/api'
import { AlertTriangle, Upload } from 'lucide-react'
import ThemePicker from '../../components/profile/ThemePicker'
import ProfilePreview from '../../components/profile/ProfilePreview'
import SocialsEditor from '../../components/profile/SocialsEditor'
import { newSocialDraft, validateSocialValue } from '../../components/profile/socialMeta'
import type { SocialDraft } from '../../components/profile/socialMeta'
import { resolveDraftConfig, toDraftConfig } from '../../themes'
import type { StoredThemeConfig } from '../../themes'

type HeaderStyle = 'classic' | 'hero' | 'banner' | 'shape'

const HEADER_STYLES: { value: HeaderStyle; label: string; desc: string }[] = [
  { value: 'classic', label: 'Classic', desc: 'Logo + round avatar' },
  { value: 'hero', label: 'Hero', desc: 'Banner behind avatar' },
  { value: 'banner', label: 'Banner', desc: 'Banner above avatar' },
  { value: 'shape', label: 'Shape', desc: 'Avatar in a shape' },
]

export default function ProfilePage() {
  const { user } = useAuth()
  const { profile, links, sections, socials, reload } = useDashboardContext()
  const [form, setForm] = useState<{
    displayName: string
    bio: string
    theme: string
    published: boolean
    colorPalette: string | null
    logoUrl: string | null
    headerStyle: 'classic' | 'hero' | 'banner' | 'shape'
    bannerUrl: string | null
    themeConfig: StoredThemeConfig
    socials: SocialDraft[]
  }>({
    displayName: '',
    bio: '',
    theme: 'default',
    published: false,
    colorPalette: null,
    logoUrl: null,
    headerStyle: 'classic',
    bannerUrl: null,
    themeConfig: { themeId: 'minimal', overrides: {} },
    socials: [],
  })
  const [username, setUsername] = useState('')
  const [usernameMsg, setUsernameMsg] = useState<{
    type: 'success' | 'error'
    text: string
  } | null>(null)
  const [savingUsername, setSavingUsername] = useState(false)
  const [logoInput, setLogoInput] = useState('')
  const [saving, setSaving] = useState(false)
  const [saveMsg, setSaveMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null)
  const [socialErrors, setSocialErrors] = useState<Record<string, string>>({})
  const [uploadingLogo, setUploadingLogo] = useState(false)
  const [uploadingBanner, setUploadingBanner] = useState(false)
  const [uploadError, setUploadError] = useState('')

  useEffect(() => {
    if (profile) {
      const p = profile as unknown as {
        user?: { displayName: string }
        colorPalette?: string | null
        logoUrl?: string | null
        headerStyle?: string | null
        bannerUrl?: string | null
        themeConfig?: unknown
        buttonStyle?: string | null
        fontFamily?: string | null
        bio?: string | null
        theme?: string
        published?: boolean
      }
      setForm((f) => ({
        ...f,
        displayName: p.user?.displayName || user?.displayName || '',
        bio: profile.bio || '',
        theme: profile.theme || 'default',
        published: !!profile.published,
        colorPalette: p.colorPalette || null,
        logoUrl: p.logoUrl || null,
        headerStyle: (p.headerStyle as 'classic' | 'hero' | 'banner' | 'shape') || 'classic',
        bannerUrl: p.bannerUrl || null,
        themeConfig: toDraftConfig(p),
      }))
    } else if (user) {
      setForm((f) => ({ ...f, displayName: user.displayName || '' }))
    }
    if (user) setUsername(user.username)
  }, [profile, user])

  // Socials live in a separate endpoint; load them into the same draft form.
  useEffect(() => {
    setForm((f) => ({
      ...f,
      socials: socials.map((s) => ({
        ...newSocialDraft(s.platform as SocialDraft['platform']),
        value: s.value,
        enabled: s.enabled,
      })),
    }))
  }, [socials])

  const saveProfile = async () => {
    if (!form.displayName.trim()) {
      setSaveMsg({ type: 'error', text: 'Display name is required' })
      return
    }
    const socialErr: Record<string, string> = {}
    for (const s of form.socials) {
      const e = validateSocialValue(s.platform, s.value)
      if (e) socialErr[s.id] = e
    }
    setSocialErrors(socialErr)
    if (Object.keys(socialErr).length > 0) {
      setSaveMsg({ type: 'error', text: 'Please check the Social / Contact section.' })
      return
    }
    // normalize '' -> null for nullable enum (prevents CHECK / Zod enum failure)
    const normalizedPalette = form.colorPalette === '' ? null : form.colorPalette
    setSaving(true)
    setSaveMsg(null)
    try {
      await api.profilePut({
        bio: form.bio || null,
        theme: form.theme,
        displayName: form.displayName.trim(),
        colorPalette: normalizedPalette,
        logoUrl: form.logoUrl || null,
        headerStyle: form.headerStyle,
        bannerUrl: form.bannerUrl || null,
        themeConfig: form.themeConfig,
      })
      await api.profileSocialsPut(
        form.socials.map((s, i) => ({
          platform: s.platform,
          value: s.value.trim(),
          enabled: s.enabled,
          position: i,
        }))
      )
      await api.profilePublish(form.published)
      await reload()
      setSaveMsg({ type: 'success', text: 'Profile saved' })
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to save profile'
      setSaveMsg({ type: 'error', text: msg })
    } finally {
      setSaving(false)
    }
  }

  const handleLogoSave = () => {
    if (logoInput.trim()) {
      setForm({ ...form, logoUrl: logoInput.trim() })
      setLogoInput('')
    }
  }

  const handleImageUpload = async (
    e: React.ChangeEvent<HTMLInputElement>,
    field: 'logoUrl' | 'bannerUrl'
  ) => {
    const file = e.target.files?.[0]
    if (!file) return
    setUploadError('')
    const setBusy = field === 'logoUrl' ? setUploadingLogo : setUploadingBanner
    setBusy(true)
    try {
      const res = (await api.uploadImage(file)) as { data?: { url?: string } }
      const url = res.data?.url
      if (url) {
        setForm((f) => (field === 'logoUrl' ? { ...f, logoUrl: url } : { ...f, bannerUrl: url }))
      }
    } catch (err: unknown) {
      setUploadError(err instanceof Error ? err.message : 'Upload failed')
    } finally {
      setBusy(false)
      e.target.value = ''
    }
  }

  const saveUsername = async () => {
    const clean = username.trim().toLowerCase()
    if (!/^[a-z0-9_]{3,30}$/.test(clean)) {
      setUsernameMsg({
        type: 'error',
        text: 'Username must be 3-30 lowercase letters, numbers, underscore',
      })
      return
    }
    if (clean === user?.username) {
      setUsernameMsg({ type: 'error', text: 'Username unchanged' })
      return
    }
    if (
      !confirm(
        `Change username from @${user?.username} to @${clean}?\n\nPublic URL will change to https://links.lensawaktu.id/@${clean}`
      )
    )
      return
    setSavingUsername(true)
    setUsernameMsg(null)
    try {
      const res = (await api.meUpdate({ username: clean })) as {
        success: boolean
        data: { username: string }
      }
      setUsernameMsg({
        type: 'success',
        text: `Username changed to @${res.data.username}. New URL: /@${res.data.username}`,
      })
      // reload to reflect new username in auth and dashboard
      setTimeout(() => window.location.reload(), 1200)
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to change username'
      setUsernameMsg({ type: 'error', text: msg })
    } finally {
      setSavingUsername(false)
    }
  }

  const draftTheme = resolveDraftConfig(form.themeConfig)
  const profileUrl = user ? `${window.location.origin}/@${user.username}` : ''

  return (
    <div className="space-y-6">
      <div>
        <p className="text-xs font-semibold uppercase tracking-[0.16em] text-primary">
          Public identity
        </p>
        <h2 className="mt-1 text-3xl font-bold tracking-tight">Profile</h2>
        <p className="mt-1 text-sm text-muted-foreground">
          Set the information and appearance visitors see on your public page.
        </p>
      </div>

      <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_340px]">
        <div className="card min-w-0 space-y-5 rounded-2xl p-5 sm:p-6">
          <div className="space-y-2 rounded-xl border bg-muted/20 p-4">
            <label className="text-sm font-medium">Username (public URL)</label>
            <div className="flex gap-2">
              <span className="inline-flex items-center rounded-l-md border border-r-0 bg-muted px-3 text-sm text-muted-foreground">
                /@
              </span>
              <input
                value={username}
                onChange={(e) =>
                  setUsername(e.target.value.toLowerCase().replace(/[^a-z0-9_]/g, ''))
                }
                placeholder="lensawaktu"
                className="input rounded-l-none flex-1"
                maxLength={30}
              />
              <button
                onClick={saveUsername}
                disabled={savingUsername || username.trim().toLowerCase() === user?.username}
                className="rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 disabled:opacity-50 whitespace-nowrap"
              >
                {savingUsername ? 'Saving...' : 'Change'}
              </button>
            </div>
            <p className="text-xs text-muted-foreground">
              Public URL:{' '}
              <span className="font-mono">
                https://links.lensawaktu.id/@{username || user?.username}
              </span>
            </p>
            {username.trim().toLowerCase() !== user?.username && (
              <p className="text-xs text-amber-600 flex items-center gap-1">
                <AlertTriangle className="h-3 w-3" /> Will change from /@{user?.username} to /@
                {username.trim().toLowerCase()}
              </p>
            )}
            {usernameMsg && (
              <p
                className={`text-xs ${usernameMsg.type === 'error' ? 'text-red-600' : 'text-green-600'}`}
              >
                {usernameMsg.text}
              </p>
            )}
            <p className="text-xs text-muted-foreground">
              3-30 lowercase, numbers, underscore. Must be unique.
            </p>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium flex items-center gap-2">
              <Upload className="h-4 w-4" /> Logo (optional)
            </label>
            <div className="flex flex-wrap gap-2">
              <input
                value={logoInput}
                onChange={(e) => setLogoInput(e.target.value)}
                placeholder="https://example.com/logo.png"
                className="input min-w-[180px] flex-1"
              />
              <button
                type="button"
                onClick={handleLogoSave}
                disabled={!logoInput.trim()}
                className="rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 disabled:opacity-50"
              >
                Set
              </button>
              <label
                className={`inline-flex cursor-pointer items-center gap-2 rounded-md border px-4 py-2 text-sm ${
                  uploadingLogo ? 'opacity-50' : 'hover:bg-accent'
                }`}
              >
                {uploadingLogo ? 'Uploading…' : 'Upload'}
                <input
                  type="file"
                  accept="image/png,image/jpeg,image/webp,image/gif"
                  className="hidden"
                  disabled={uploadingLogo}
                  onChange={(e) => handleImageUpload(e, 'logoUrl')}
                />
              </label>
            </div>
            {uploadError && <p className="text-xs text-red-600">{uploadError}</p>}
            {form.logoUrl && (
              <div className="flex flex-wrap items-center gap-3 rounded-xl border bg-muted/30 p-3">
                <img
                  src={form.logoUrl}
                  alt="Logo preview"
                  className="h-14 w-14 object-contain"
                  onError={(e) => (e.currentTarget.style.display = 'none')}
                />
                <div className="min-w-0 flex-1">
                  <p className="text-xs font-medium">Logo shape</p>
                  <div className="mt-1 flex gap-2">
                    <button
                      type="button"
                      onClick={() =>
                        setForm((f) => ({
                          ...f,
                          themeConfig: { ...f.themeConfig, logoShape: 'plain' },
                        }))
                      }
                      aria-pressed={(form.themeConfig.logoShape ?? 'circle') === 'plain'}
                      className={`rounded-md border px-3 py-1.5 text-xs ${
                        (form.themeConfig.logoShape ?? 'circle') === 'plain'
                          ? 'border-primary bg-primary/10 text-primary'
                          : 'hover:bg-accent'
                      }`}
                    >
                      Plain (PNG)
                    </button>
                    <button
                      type="button"
                      onClick={() =>
                        setForm((f) => ({
                          ...f,
                          themeConfig: { ...f.themeConfig, logoShape: 'circle' },
                        }))
                      }
                      aria-pressed={(form.themeConfig.logoShape ?? 'circle') === 'circle'}
                      className={`rounded-md border px-3 py-1.5 text-xs ${
                        (form.themeConfig.logoShape ?? 'circle') === 'circle'
                          ? 'border-primary bg-primary/10 text-primary'
                          : 'hover:bg-accent'
                      }`}
                    >
                      Circle
                    </button>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setForm({ ...form, logoUrl: null })}
                  className="text-xs text-red-600 hover:underline"
                >
                  Remove
                </button>
              </div>
            )}
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className="text-sm font-medium">Display name</label>
              <input
                value={form.displayName}
                onChange={(e) => setForm({ ...form, displayName: e.target.value })}
                className="input mt-1"
              />
            </div>
            <div className="flex items-end pb-0.5">
              <label className="flex items-center gap-2 text-sm">
                <input
                  type="checkbox"
                  checked={form.published}
                  onChange={(e) => setForm({ ...form, published: e.target.checked })}
                />{' '}
                Published (visible at /@{user?.username})
              </label>
            </div>
          </div>

          <div>
            <label className="text-sm font-medium">Bio</label>
            <textarea
              value={form.bio}
              onChange={(e) => setForm({ ...form, bio: e.target.value })}
              className="input mt-1 min-h-[80px]"
              maxLength={500}
            />
          </div>

          <div className="space-y-3">
            <div>
              <label className="text-sm font-medium">Header style</label>
              <p className="text-xs text-muted-foreground">
                How the top of your public profile looks. Saved with Save profile.
              </p>
            </div>
            <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
              {HEADER_STYLES.map((h) => (
                <button
                  key={h.value}
                  type="button"
                  onClick={() => setForm((f) => ({ ...f, headerStyle: h.value }))}
                  aria-pressed={form.headerStyle === h.value}
                  className={`rounded-xl border p-3 text-left transition-colors ${
                    form.headerStyle === h.value
                      ? 'border-primary ring-2 ring-primary/30'
                      : 'hover:border-muted-foreground/40'
                  }`}
                >
                  <span className="block text-sm font-medium">{h.label}</span>
                  <span className="mt-0.5 block text-[11px] text-muted-foreground">{h.desc}</span>
                </button>
              ))}
            </div>
            {(form.headerStyle === 'hero' || form.headerStyle === 'banner') && (
              <div className="space-y-2">
                <label className="text-sm font-medium">Banner image</label>
                <div className="flex flex-wrap gap-2">
                  <input
                    value={form.bannerUrl ?? ''}
                    onChange={(e) => setForm({ ...form, bannerUrl: e.target.value || null })}
                    placeholder="https://... or upload"
                    className="input min-w-[180px] flex-1"
                  />
                  <label
                    className={`inline-flex cursor-pointer items-center gap-2 rounded-md border px-4 py-2 text-sm ${
                      uploadingBanner ? 'opacity-50' : 'hover:bg-accent'
                    }`}
                  >
                    {uploadingBanner ? 'Uploading…' : 'Upload'}
                    <input
                      type="file"
                      accept="image/png,image/jpeg,image/webp,image/gif"
                      className="hidden"
                      disabled={uploadingBanner}
                      onChange={(e) => handleImageUpload(e, 'bannerUrl')}
                    />
                  </label>
                  {form.bannerUrl && (
                    <button
                      type="button"
                      onClick={() => setForm({ ...form, bannerUrl: null })}
                      className="rounded-md border px-3 py-2 text-sm text-red-600 hover:bg-accent"
                    >
                      Remove
                    </button>
                  )}
                </div>
                {form.bannerUrl && (
                  <img
                    src={form.bannerUrl}
                    alt="Banner preview"
                    className="h-20 w-full rounded-xl object-cover"
                  />
                )}
              </div>
            )}
          </div>

          <div className="space-y-3">
            <div>
              <label className="text-sm font-medium">Theme</label>
              <p className="text-xs text-muted-foreground">
                Pick a complete visual preset, then fine-tune it. Changes preview instantly and are
                only saved when you click Save profile.
              </p>
            </div>
            <ThemePicker
              config={form.themeConfig}
              onChange={(themeConfig) => setForm((f) => ({ ...f, themeConfig }))}
            />
            <label className="flex items-center gap-2 text-sm">
              <input
                type="checkbox"
                checked={form.themeConfig.showShare !== false}
                onChange={(e) =>
                  setForm((f) => ({
                    ...f,
                    themeConfig: { ...f.themeConfig, showShare: e.target.checked },
                  }))
                }
              />
              Show the Share section (QR &amp; copy link) on the public profile
            </label>
          </div>

          <div className="space-y-3">
            <div>
              <label className="text-sm font-medium">Social / Contact</label>
              <p className="text-xs text-muted-foreground">
                Shown as small icons, separate from your links. Changes are saved only when you
                click Save profile.
              </p>
            </div>
            <div className="flex flex-wrap items-center gap-3">
              <label className="text-xs font-medium" htmlFor="social-style">
                Icon style
              </label>
              <select
                id="social-style"
                value={form.themeConfig.socialStyle ?? 'circle'}
                onChange={(e) =>
                  setForm((f) => ({
                    ...f,
                    themeConfig: {
                      ...f.themeConfig,
                      socialStyle: e.target.value as 'circle' | 'plain',
                    },
                  }))
                }
                className="input h-9 w-auto"
              >
                <option value="circle">Circle (with background)</option>
                <option value="plain">Icon only (no background)</option>
              </select>
              <span className="text-xs text-muted-foreground">
                Icon color is set in Theme → Customize → “Social icon”.
              </span>
            </div>
            <SocialsEditor
              items={form.socials}
              errors={socialErrors}
              onChange={(items) => {
                setForm((f) => ({ ...f, socials: items }))
                setSocialErrors({})
              }}
            />
          </div>

          {saveMsg && (
            <p className={`text-sm ${saveMsg.type === 'error' ? 'text-red-600' : 'text-green-600'}`}>
              {saveMsg.text}
            </p>
          )}
          <button
            onClick={saveProfile}
            disabled={saving}
            className="inline-flex items-center justify-center rounded-md bg-primary px-5 py-2.5 text-sm font-medium text-primary-foreground hover:bg-primary/90 shadow disabled:opacity-50"
          >
            {saving ? 'Saving...' : 'Save profile'}
          </button>
          <p className="text-xs text-muted-foreground">
            Username: @{user?.username} — change via API /api/me if needed. Only published profiles
            are public.
          </p>
        </div>

        <aside className="w-full min-w-0 lg:sticky lg:top-6 lg:self-start">
          <p className="mb-3 text-xs font-semibold uppercase tracking-[0.16em] text-muted-foreground">
            Live preview
          </p>
          <ProfilePreview
            theme={draftTheme}
            displayName={form.displayName || user?.displayName || ''}
            avatarUrl={profile?.avatarUrl ?? user?.avatarUrl ?? null}
            bio={form.bio}
            logoUrl={form.logoUrl}
            links={links.filter((l) => l.enabled)}
            sections={sections}
            socials={form.socials
              .filter((s) => s.enabled && s.value.trim())
              .map((s) => ({ platform: s.platform, value: s.value }))}
            profileUrl={profileUrl}
            showShare={form.themeConfig.showShare !== false}
            socialStyle={form.themeConfig.socialStyle === 'plain' ? 'plain' : 'circle'}
            headerStyle={form.headerStyle}
            bannerUrl={form.bannerUrl}
            logoShape={form.themeConfig.logoShape ?? 'circle'}
          />
        </aside>
      </div>
    </div>
  )
}
