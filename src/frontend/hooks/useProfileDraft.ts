import { useCallback, useEffect, useMemo, useState } from 'react'
import { api } from '../services/api'
import { newSocialDraft, validateSocialValue } from '../components/profile/socialMeta'
import type { SocialDraft } from '../components/profile/socialMeta'
import { resolveDraftConfig, toDraftConfig } from '../themes'
import type { StoredThemeConfig } from '../themes'

export type HeaderStyle = 'classic' | 'hero' | 'banner' | 'shape'

// Everything the builder edits, held in local draft state until Save.
export type ProfileDraft = {
  displayName: string
  bio: string
  theme: string
  published: boolean
  colorPalette: string | null
  logoUrl: string | null
  headerStyle: HeaderStyle
  bannerUrl: string | null
  themeConfig: StoredThemeConfig
  socials: SocialDraft[]
}

// The subset of the dashboard context this hook needs. Kept structural so the
// hook stays decoupled from the context implementation.
type ProfileLike = {
  bio?: string | null
  theme?: string
  published?: boolean
  colorPalette?: string | null
  logoUrl?: string | null
  headerStyle?: string | null
  bannerUrl?: string | null
  buttonStyle?: string | null
  fontFamily?: string | null
  themeConfig?: unknown
  user?: { displayName: string; avatarUrl?: string | null } | undefined
} | null

type UserLike = { displayName?: string; username?: string; avatarUrl?: string | null } | null

type SocialLike = { platform: string; value: string; enabled: boolean; position: number }

type Options = {
  profile: ProfileLike
  user: UserLike
  socials: SocialLike[]
  reload: () => Promise<void>
}

// `shape` (the retired "framed avatar" header style) is folded back into
// `classic` so old saved configs keep working without a duplicate avatar-shape
// control. The Avatar Shape setting is now the only source of truth.
function toHeaderStyle(v: string | null | undefined): HeaderStyle {
  return v === 'hero' || v === 'banner' ? v : 'classic'
}

function emptyDraft(): ProfileDraft {
  return {
    displayName: '',
    bio: '',
    theme: 'default',
    published: false,
    colorPalette: null,
    logoUrl: null,
    headerStyle: 'classic',
    bannerUrl: null,
    themeConfig: { themeId: 'mesh', overrides: {} },
    socials: [],
  }
}

function socialsFromContext(socials: SocialLike[]): SocialDraft[] {
  return socials.map((s) => ({
    ...newSocialDraft(s.platform as SocialDraft['platform']),
    value: s.value,
    enabled: s.enabled,
  }))
}

// Build the editable draft from the saved profile + context socials.
function buildDraft(
  profile: ProfileLike,
  user: UserLike,
  socials: SocialLike[]
): ProfileDraft {
  if (!profile) {
    return { ...emptyDraft(), displayName: user?.displayName || '' }
  }
  return {
    displayName: profile.user?.displayName || user?.displayName || '',
    bio: profile.bio || '',
    theme: profile.theme || 'default',
    published: !!profile.published,
    colorPalette: profile.colorPalette || null,
    logoUrl: profile.logoUrl || null,
    headerStyle: toHeaderStyle(profile.headerStyle),
    bannerUrl: profile.bannerUrl || null,
    themeConfig: toDraftConfig(profile),
    socials: socialsFromContext(socials),
  }
}

// Canonical, id-independent serialization used for dirty checking so a rebuild
// of draft ids never reads as a user change.
function serialize(draft: ProfileDraft): string {
  return JSON.stringify({
    displayName: draft.displayName.trim(),
    bio: draft.bio ?? '',
    theme: draft.theme,
    published: draft.published,
    colorPalette: draft.colorPalette ?? null,
    logoUrl: draft.logoUrl ?? null,
    headerStyle: draft.headerStyle,
    bannerUrl: draft.bannerUrl ?? null,
    themeConfig: draft.themeConfig,
    socials: draft.socials.map((s, i) => ({
      platform: s.platform,
      value: s.value.trim(),
      enabled: s.enabled,
      position: i,
    })),
  })
}

export function useProfileDraft({ profile, user, socials, reload }: Options) {
  // Lazy initializer avoids a one-frame flash of an empty draft on mount.
  const [form, setForm] = useState<ProfileDraft>(() => buildDraft(profile, user, socials))
  const [saving, setSaving] = useState(false)
  const [saveMsg, setSaveMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null)
  const [socialErrors, setSocialErrors] = useState<Record<string, string>>({})

  // Rebuild the draft whenever the saved profile (or its socials) reloads.
  useEffect(() => {
    setForm(buildDraft(profile, user, socials))
    // socials are intentionally re-read only when the context list identity changes
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [profile, user, socials])

  const savedSnapshot = useMemo(
    () => serialize(buildDraft(profile, user, socials)),
    [profile, user, socials]
  )

  const dirty = useMemo(() => serialize(form) !== savedSnapshot, [form, savedSnapshot])

  const setField = useCallback(<K extends keyof ProfileDraft>(key: K, value: ProfileDraft[K]) => {
    setForm((f) => ({ ...f, [key]: value }))
  }, [])

  const patch = useCallback((values: Partial<ProfileDraft>) => {
    setForm((f) => ({ ...f, ...values }))
  }, [])

  const setThemeConfig = useCallback((p: Partial<StoredThemeConfig>) => {
    setForm((f) => ({ ...f, themeConfig: { ...f.themeConfig, ...p } }))
  }, [])

  const setSocials = useCallback((items: SocialDraft[]) => {
    setForm((f) => ({ ...f, socials: items }))
    setSocialErrors({})
  }, [])

  const reset = useCallback(() => {
    setForm(buildDraft(profile, user, socials))
    setSaveMsg(null)
    setSocialErrors({})
  }, [profile, user, socials])

  const save = useCallback(async (): Promise<boolean> => {
    if (!form.displayName.trim()) {
      setSaveMsg({ type: 'error', text: 'Display name is required' })
      return false
    }
    const socialErr: Record<string, string> = {}
    for (const s of form.socials) {
      const e = validateSocialValue(s.platform, s.value)
      if (e) socialErr[s.id] = e
    }
    setSocialErrors(socialErr)
    if (Object.keys(socialErr).length > 0) {
      setSaveMsg({ type: 'error', text: 'Please check the Social / Contact section.' })
      return false
    }
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
      return true
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to save profile'
      setSaveMsg({ type: 'error', text: msg })
      return false
    } finally {
      setSaving(false)
    }
  }, [form, reload])

  const draftTheme = useMemo(() => resolveDraftConfig(form.themeConfig), [form.themeConfig])

  return {
    form,
    setForm,
    setField,
    patch,
    setThemeConfig,
    setSocials,
    socialErrors,
    draftTheme,
    dirty,
    saving,
    saveMsg,
    save,
    reset,
    setSaveMsg,
  }
}
