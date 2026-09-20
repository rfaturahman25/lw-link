import { Palette, Search, Pencil, X } from 'lucide-react'
import type { ProfileDraft } from '../../hooks/useProfileDraft'
import type { ProfileHeaderStyle, StoredThemeConfig } from '../../themes'
import type { SocialDraft } from '../profile/socialMeta'
import type { BuilderLink } from './types'
import ThemePanel from './ThemePanel'
import ContentPanel from './ContentPanel'
import SeoPanel from './SeoPanel'

export type BuilderTab = 'theme' | 'content' | 'seo'

const TABS: { id: BuilderTab; label: string; Icon: typeof Palette }[] = [
  { id: 'theme', label: 'Theme', Icon: Palette },
  { id: 'content', label: 'Content', Icon: Pencil },
  { id: 'seo', label: 'SEO', Icon: Search },
]

type Props = {
  open: boolean
  onClose: () => void
  tab: BuilderTab
  tabDir: 1 | -1
  onTabChange: (tab: BuilderTab) => void
  isDesktop: boolean
  config: StoredThemeConfig
  onConfigChange: (config: StoredThemeConfig) => void
  headerStyle: ProfileHeaderStyle
  onHeaderStyleChange: (h: ProfileHeaderStyle) => void
  draft: ProfileDraft
  patch: (values: Partial<ProfileDraft>) => void
  socialErrors: Record<string, string>
  setSocials: (items: SocialDraft[]) => void
  links: BuilderLink[]
  onManageLinks: () => void
  displayName: string
  profileUrl: string
}

export default function BuilderSettingsPanel({
  open,
  onClose,
  tab,
  tabDir,
  onTabChange,
  isDesktop,
  config,
  onConfigChange,
  headerStyle,
  onHeaderStyleChange,
  draft,
  patch,
  socialErrors,
  setSocials,
  links,
  onManageLinks,
  displayName,
  profileUrl,
}: Props) {
  if (!open) return null

  const body = (
    <>
      <div className="flex items-center justify-between gap-2 px-4 pt-3">
        <p className="text-sm font-semibold tracking-tight">Page settings</p>
        <button
          type="button"
          onClick={onClose}
          aria-label="Close settings"
          className="inline-flex h-8 w-8 items-center justify-center rounded-lg text-muted-foreground hover:bg-accent hover:text-foreground"
        >
          <X className="h-4 w-4" />
        </button>
      </div>

      <div
        role="tablist"
        aria-label="Settings sections"
        className="mx-4 mt-3 flex gap-1 rounded-xl border bg-muted/40 p-1"
      >
        {TABS.map(({ id, label, Icon }) => {
          const active = tab === id
          return (
            <button
              key={id}
              type="button"
              role="tab"
              aria-selected={active}
              aria-controls={`builder-tabpanel-${id}`}
              id={`builder-tab-${id}`}
              onClick={() => onTabChange(id)}
              className={`flex flex-1 items-center justify-center gap-1.5 rounded-lg px-2 py-2 text-xs font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary ${
                active
                  ? 'bg-card text-foreground shadow-sm'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              <Icon className="h-3.5 w-3.5" />
              {label}
            </button>
          )
        })}
      </div>

      <div
        id={`builder-tabpanel-${tab}`}
        role="tabpanel"
        aria-labelledby={`builder-tab-${tab}`}
        className="thin-scroll min-h-0 flex-1 overflow-y-auto px-4 py-4"
      >
        <div key={tab} className={tabDir === -1 ? 'anim-tab-backward' : 'anim-tab-forward'}>
          {tab === 'theme' && (
            <ThemePanel
              config={config}
              onChange={onConfigChange}
              headerStyle={headerStyle}
              onHeaderStyleChange={onHeaderStyleChange}
            />
          )}
          {tab === 'content' && (
            <ContentPanel
              draft={draft}
              patch={patch}
              setThemeConfig={(p) => onConfigChange({ ...config, ...p })}
              socialErrors={socialErrors}
              setSocials={setSocials}
              links={links}
              onManageLinks={onManageLinks}
            />
          )}
          {tab === 'seo' && (
            <SeoPanel
              config={config}
              onChange={onConfigChange}
              displayName={displayName}
              profileUrl={profileUrl}
            />
          )}
        </div>
      </div>
    </>
  )

  if (!isDesktop) {
    return (
      <>
        <div
          className="fixed inset-0 z-40 bg-slate-950/40 lg:hidden"
          onClick={onClose}
          aria-hidden="true"
        />
        <div
          role="dialog"
          aria-modal="true"
          aria-label="Page settings"
          className="builder-surface sheet-in fixed inset-x-0 bottom-0 z-50 flex max-h-[80dvh] flex-col rounded-t-3xl lg:hidden"
        >
          <div className="mx-auto mt-2 h-1 w-10 rounded-full bg-border" aria-hidden="true" />
          {body}
        </div>
      </>
    )
  }

  return (
    <div
      role="dialog"
      aria-label="Page settings"
      className="builder-surface anim-panel-in absolute right-4 top-4 z-30 hidden w-[380px] flex-col overflow-hidden rounded-2xl lg:flex"
      style={{ height: 'calc(100% - 6.5rem)' }}
    >
      {body}
    </div>
  )
}
