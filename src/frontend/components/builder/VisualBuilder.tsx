import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { ArrowLeft, Monitor, Smartphone } from 'lucide-react'
import { useProfileDraft } from '../../hooks/useProfileDraft'
import { useMediaQuery } from '../../hooks/useMediaQuery'
import { loadFont } from '../../themes'
import type { ProfileHeaderStyle } from '../../themes'
import BuilderCanvas from './BuilderCanvas'
import type { BuilderDevice } from './BuilderCanvas'
import BuilderSettingsPanel from './BuilderSettingsPanel'
import type { BuilderTab } from './BuilderSettingsPanel'
import BuilderToolbar from './BuilderToolbar'
import type { BuilderLink, BuilderMode, BuilderSection } from './types'
import LinksManager from '../links/LinksManager'

type SocialLike = { platform: string; value: string; enabled: boolean; position: number }

type Props = {
  profile: Parameters<typeof useProfileDraft>[0]['profile']
  user: Parameters<typeof useProfileDraft>[0]['user']
  links: BuilderLink[]
  sections: BuilderSection[]
  socials: SocialLike[]
  reload: () => Promise<void>
  initialMode?: BuilderMode
}

export default function VisualBuilder({
  profile,
  user,
  links,
  sections,
  socials,
  reload,
  initialMode = 'design',
}: Props) {
  const {
    form,
    patch,
    setSocials,
    socialErrors,
    draftTheme,
    dirty,
    saving,
    saveMsg,
    save,
    reset,
  } = useProfileDraft({ profile, user, socials, reload })

  const isDesktop = useMediaQuery('(min-width: 1024px)')
  const [panelOpen, setPanelOpen] = useState(isDesktop)
  const [tab, setTab] = useState<BuilderTab>('theme')
  const [device, setDevice] = useState<BuilderDevice>('mobile')
  const [mode, setMode] = useState<BuilderMode>(initialMode)

  const switchMode = (next: BuilderMode) => {
    setMode(next)
    // The links workspace is full-width; the settings panel belongs to design.
    setPanelOpen(next === 'design' ? isDesktop : false)
  }

  // Desktop opens the floating panel; mobile starts on the canvas and opens the
  // sheet only when the user asks for it.
  useEffect(() => {
    setPanelOpen(isDesktop)
  }, [isDesktop])

  // Fetch only the active theme font, regardless of which tab is open, so the
  // canvas always renders in the real typeface.
  useEffect(() => {
    loadFont(draftTheme.typography.fontFamily)
  }, [draftTheme.typography.fontFamily])

  // Lock background scroll while the full-screen builder is mounted.
  useEffect(() => {
    const previous = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => {
      document.body.style.overflow = previous
    }
  }, [])

  // Escape closes the settings sheet/panel (mobile especially).
  useEffect(() => {
    if (!panelOpen || isDesktop) return
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setPanelOpen(false)
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [panelOpen, isDesktop])

  const profileUrl = user?.username ? `${window.location.origin}/@${user.username}` : ''

  const enabledLinks = useMemo(() => links.filter((l) => l.enabled), [links])
  const enabledSocials = useMemo(
    () =>
      form.socials
        .filter((s) => s.enabled && s.value.trim())
        .map((s) => ({ platform: s.platform, value: s.value })),
    [form.socials]
  )

  const openTab = (next: BuilderTab) => {
    setTab(next)
    setPanelOpen(true)
  }

  const handleReset = () => {
    if (!dirty) return
    if (confirm('Discard all unsaved changes?')) reset()
  }

  return (
    <div className="builder-root fixed inset-0 z-[60] flex flex-col text-foreground">
      <header className="flex h-14 shrink-0 items-center justify-between gap-2 border-b border-border/60 bg-card/70 px-3 backdrop-blur sm:px-4">
        <div className="flex min-w-0 items-center gap-2">
          <Link
            to="/dashboard"
            className="inline-flex h-9 items-center gap-1.5 rounded-lg px-2 text-xs font-medium text-muted-foreground hover:bg-accent hover:text-foreground"
          >
            <ArrowLeft className="h-4 w-4" />
            <span className="hidden sm:inline">Dashboard</span>
          </Link>
          <span className="h-5 w-px bg-border" aria-hidden="true" />
          <p className="hidden truncate text-sm font-semibold tracking-tight sm:block">
            Profile Builder
          </p>
          {dirty && (
            <span className="inline-flex shrink-0 items-center gap-1 rounded-full bg-amber-100 px-2 py-0.5 text-[10px] font-semibold text-amber-700">
              <span className="h-1.5 w-1.5 rounded-full bg-amber-500" />
              Unsaved
            </span>
          )}
        </div>

        <div className="flex items-center gap-2">
          <div
            className="flex items-center gap-0.5 rounded-full border bg-muted/40 p-0.5"
            role="group"
            aria-label="Builder mode"
          >
            {(['design', 'links'] as const).map((m) => (
              <button
                key={m}
                type="button"
                aria-pressed={mode === m}
                onClick={() => switchMode(m)}
                className={`inline-flex h-8 items-center rounded-full px-3 text-xs font-medium capitalize transition-colors ${
                  mode === m
                    ? 'bg-card text-foreground shadow-sm'
                    : 'text-muted-foreground hover:text-foreground'
                }`}
              >
                {m}
              </button>
            ))}
          </div>
          {saveMsg && (
            <span
              className={`hidden max-w-[200px] truncate text-xs sm:inline ${
                saveMsg.type === 'error' ? 'text-red-600' : 'text-green-600'
              }`}
              role="status"
              aria-live="polite"
            >
              {saveMsg.text}
            </span>
          )}
          <span
            className={`hidden rounded-full px-2 py-0.5 text-[10px] font-semibold sm:inline ${
              form.published ? 'bg-green-100 text-green-700' : 'bg-muted text-muted-foreground'
            }`}
          >
            {form.published ? 'Published' : 'Draft'}
          </span>
          {mode === 'design' && (
            <div
              className="flex items-center gap-0.5 rounded-full border bg-muted/40 p-0.5"
              role="group"
              aria-label="Preview device"
            >
              <button
                type="button"
                aria-pressed={device === 'mobile'}
                aria-label="Mobile preview"
                title="Mobile preview"
                onClick={() => setDevice('mobile')}
                className={`inline-flex h-8 w-8 items-center justify-center rounded-full transition-colors ${
                  device === 'mobile'
                    ? 'bg-card text-foreground shadow-sm'
                    : 'text-muted-foreground hover:text-foreground'
                }`}
              >
                <Smartphone className="h-4 w-4" />
              </button>
              <button
                type="button"
                aria-pressed={device === 'desktop'}
                aria-label="Desktop preview"
                title="Desktop preview"
                onClick={() => setDevice('desktop')}
                className={`inline-flex h-8 w-8 items-center justify-center rounded-full transition-colors ${
                  device === 'desktop'
                    ? 'bg-card text-foreground shadow-sm'
                    : 'text-muted-foreground hover:text-foreground'
                }`}
              >
                <Monitor className="h-4 w-4" />
              </button>
            </div>
          )}
        </div>
      </header>

      <div className="relative flex min-h-0 flex-1">
        <div
          className={`min-w-0 flex-1 transition-[padding] duration-200 ${
            mode === 'design' && panelOpen && isDesktop ? 'lg:pr-[404px]' : ''
          }`}
        >
          {mode === 'design' ? (
            <BuilderCanvas
              theme={draftTheme}
              device={device}
              displayName={form.displayName}
              avatarUrl={profile?.user?.avatarUrl ?? user?.avatarUrl ?? null}
              bio={form.bio}
              logoUrl={form.logoUrl}
              links={enabledLinks}
              sections={sections}
              socials={enabledSocials}
              profileUrl={profileUrl}
              showShare={form.themeConfig.showShare !== false}
              socialStyle={form.themeConfig.socialStyle === 'plain' ? 'plain' : 'circle'}
              headerStyle={form.headerStyle}
              bannerUrl={form.bannerUrl}
              logoShape={form.themeConfig.logoShape ?? 'circle'}
              featuredLinkId={form.themeConfig.featuredLinkId ?? null}
            />
          ) : (
            <div className="builder-scroll h-full w-full overflow-y-auto overscroll-contain">
              <div className="mx-auto w-full max-w-3xl px-4 pb-32 pt-6 sm:px-6">
                <LinksManager embedded />
              </div>
            </div>
          )}
        </div>

        {mode === 'design' && (
          <BuilderSettingsPanel
            open={panelOpen}
            onClose={() => setPanelOpen(false)}
            tab={tab}
            onTabChange={setTab}
            isDesktop={isDesktop}
            config={form.themeConfig}
            onConfigChange={(c) => patch({ themeConfig: c })}
            headerStyle={form.headerStyle as ProfileHeaderStyle}
            onHeaderStyleChange={(h) => patch({ headerStyle: h })}
            draft={form}
            patch={patch}
            socialErrors={socialErrors}
            setSocials={setSocials}
            links={links}
            onManageLinks={() => switchMode('links')}
            displayName={form.displayName}
            profileUrl={profileUrl}
          />
        )}

        <BuilderToolbar
          mode={mode}
          tab={tab}
          panelOpen={panelOpen}
          onOpenTab={openTab}
          onReset={handleReset}
          profileUrl={profileUrl}
          saving={saving}
          dirty={dirty}
          onSave={() => {
            void save()
          }}
        />
      </div>
    </div>
  )
}
