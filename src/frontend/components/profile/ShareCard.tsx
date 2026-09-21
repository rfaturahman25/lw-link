import { useId, useState } from 'react'
import { QRCodeSVG } from 'qrcode.react'
import { Copy, Check, Download, Share2, ChevronDown } from 'lucide-react'

type Props = {
  profileUrl: string
  embedded?: boolean
}

// Compact, collapsible share block. On mobile it stays collapsed so the link
// column is not dominated; on desktop it expands inline. QR + copy behavior is
// unchanged and fires no analytics.
//
// The reveal is animated with a grid-template-rows 0fr → 1fr transition (the
// only reliable way to animate to an intrinsic height) plus a fade/slide on the
// content, so opening the QR feels fluid instead of snapping. Motion is dropped
// entirely under prefers-reduced-motion.
export default function ShareCard({ profileUrl, embedded = false }: Props) {
  const [open, setOpen] = useState(false)
  const [copied, setCopied] = useState(false)
  const panelId = useId()

  const copyProfileLink = async () => {
    try {
      if (navigator.clipboard?.writeText) {
        await navigator.clipboard.writeText(profileUrl)
      } else {
        const ta = document.createElement('textarea')
        ta.value = profileUrl
        ta.setAttribute('readonly', '')
        ta.style.position = 'absolute'
        ta.style.left = '-9999px'
        document.body.appendChild(ta)
        ta.select()
        document.execCommand('copy')
        document.body.removeChild(ta)
      }
      setCopied(true)
      window.setTimeout(() => setCopied(false), 2000)
    } catch {
      // clipboard unavailable — no-op
    }
  }

  const ease = 'ease-[cubic-bezier(0.22,1,0.36,1)]'

  return (
    <div className="pp-card pp-share pp-share-in overflow-hidden">
      <button
        type="button"
        aria-expanded={open}
        aria-controls={panelId}
        onClick={() => setOpen((v) => !v)}
        className="flex w-full cursor-pointer list-none items-center justify-center gap-2 px-4 py-3 text-[13px] font-medium transition-colors duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-[color:var(--pp-accent)]"
      >
        <Share2 className="h-4 w-4" aria-hidden="true" />
        <span style={{ color: 'var(--pp-text)' }}>Share profile</span>
        <ChevronDown
          className={`h-3.5 w-3.5 transition-transform duration-[380ms] ${ease} motion-reduce:transition-none ${
            open ? 'rotate-180' : ''
          }`}
          style={{ color: 'var(--pp-text-secondary)' }}
          aria-hidden="true"
        />
      </button>

      <div
        id={panelId}
        className={`grid transition-[grid-template-rows] duration-[420ms] ${ease} motion-reduce:transition-none ${
          open ? 'grid-rows-[1fr]' : 'grid-rows-[0fr]'
        }`}
      >
        <div className="overflow-hidden">
          <div
            className={`space-y-3 px-4 pb-4 transition-[opacity,transform] duration-[420ms] ${ease} motion-reduce:transition-none ${
              open ? 'translate-y-0 opacity-100' : '-translate-y-2 opacity-0'
            }`}
          >
            <div
              className={`flex justify-center rounded-xl bg-white p-3 transition-transform duration-[520ms] ${ease} motion-reduce:transition-none ${
                open ? 'scale-100' : 'scale-90'
              }`}
            >
              <QRCodeSVG value={profileUrl} size={embedded ? 110 : 130} />
            </div>
            <div className="grid grid-cols-2 gap-2.5">
              <button
                type="button"
                onClick={copyProfileLink}
                className={`pp-ghost pp-interactive inline-flex items-center justify-center gap-2 px-3 py-3 text-[13px] font-medium ${copied ? 'text-[color:var(--pp-accent)]' : ''}`}
              >
                {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                <span className="truncate" aria-live="polite">
                  {copied ? 'Copied' : 'Copy link'}
                </span>
              </button>
              <a
                href={`https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=${encodeURIComponent(profileUrl)}`}
                target="_blank"
                rel="noreferrer"
                className="pp-ghost pp-interactive inline-flex items-center justify-center gap-2 px-3 py-3 text-[13px] font-medium"
              >
                <Download className="h-4 w-4" />
                <span className="truncate">QR code</span>
              </a>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
