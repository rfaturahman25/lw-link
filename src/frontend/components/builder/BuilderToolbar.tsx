import { useState } from 'react'
import {
  Check,
  Copy,
  ExternalLink,
  Palette,
  RotateCcw,
  Save,
  Search,
  Pencil,
} from 'lucide-react'
import type { BuilderTab } from './BuilderSettingsPanel'
import type { BuilderMode } from './types'

type Props = {
  mode: BuilderMode
  tab: BuilderTab
  panelOpen: boolean
  onOpenTab: (tab: BuilderTab) => void
  onReset: () => void
  profileUrl: string
  saving: boolean
  dirty: boolean
  onSave: () => void
}

const TABS: { id: BuilderTab; label: string; Icon: typeof Palette }[] = [
  { id: 'theme', label: 'Theme', Icon: Palette },
  { id: 'content', label: 'Content', Icon: Pencil },
  { id: 'seo', label: 'SEO', Icon: Search },
]

function ToolButton({
  active,
  onClick,
  label,
  Icon,
  showLabel,
}: {
  active?: boolean
  onClick: () => void
  label: string
  Icon: typeof Palette
  showLabel?: boolean
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={active}
      aria-label={label}
      title={label}
      className={`inline-flex h-9 items-center gap-1.5 rounded-full px-2.5 text-xs font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary ${
        active
          ? 'bg-primary text-primary-foreground'
          : 'text-muted-foreground hover:bg-accent hover:text-foreground'
      }`}
    >
      <Icon className="h-4 w-4" />
      {showLabel && <span className="hidden sm:inline">{label}</span>}
    </button>
  )
}

export default function BuilderToolbar({
  mode,
  tab,
  panelOpen,
  onOpenTab,
  onReset,
  profileUrl,
  saving,
  dirty,
  onSave,
}: Props) {
  const [copied, setCopied] = useState(false)

  const copy = async () => {
    try {
      if (navigator.clipboard?.writeText) {
        await navigator.clipboard.writeText(profileUrl)
      } else {
        const ta = document.createElement('textarea')
        ta.value = profileUrl
        ta.style.position = 'absolute'
        ta.style.left = '-9999px'
        document.body.appendChild(ta)
        ta.select()
        document.execCommand('copy')
        document.body.removeChild(ta)
      }
      setCopied(true)
      window.setTimeout(() => setCopied(false), 1800)
    } catch {
      /* clipboard unavailable */
    }
  }

  return (
    <div
      className="pointer-events-none absolute inset-x-0 bottom-0 z-40 flex justify-center px-3"
      style={{ paddingBottom: 'calc(0.75rem + env(safe-area-inset-bottom, 0px))' }}
    >
      <div className="builder-toolbar pointer-events-auto flex max-w-full items-center gap-0.5 overflow-x-auto rounded-full p-1">
        {mode === 'design' && (
          <>
            {TABS.map(({ id, label, Icon }) => (
              <ToolButton
                key={id}
                label={label}
                Icon={Icon}
                active={panelOpen && tab === id}
                onClick={() => onOpenTab(id)}
                showLabel
              />
            ))}

            <span className="mx-1 h-6 w-px shrink-0 bg-border" aria-hidden="true" />

            <ToolButton label="Reset changes" Icon={RotateCcw} onClick={onReset} />
          </>
        )}

        <ToolButton
          label={copied ? 'Copied' : 'Copy link'}
          Icon={copied ? Check : Copy}
          onClick={copy}
        />
        <a
          href={profileUrl}
          target="_blank"
          rel="noreferrer"
          aria-label="Open public page"
          title="Open public page"
          className="inline-flex h-9 items-center gap-1.5 rounded-full px-2.5 text-xs font-medium text-muted-foreground transition-colors hover:bg-accent hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
        >
          <ExternalLink className="h-4 w-4" />
          <span className="hidden sm:inline">View</span>
        </a>

        <span className="mx-1 h-6 w-px shrink-0 bg-border" aria-hidden="true" />

        <button
          type="button"
          onClick={onSave}
          disabled={saving}
          className="relative inline-flex h-9 shrink-0 items-center gap-1.5 rounded-full bg-primary px-3.5 text-xs font-semibold text-primary-foreground transition-colors hover:bg-primary/90 disabled:opacity-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
        >
          <Save className="h-4 w-4" />
          {saving ? 'Saving…' : 'Save'}
          {dirty && !saving && (
            <span
              className="absolute -right-0.5 -top-0.5 h-2.5 w-2.5 rounded-full bg-amber-400 ring-2 ring-card"
              aria-hidden="true"
            />
          )}
        </button>
      </div>
    </div>
  )
}
