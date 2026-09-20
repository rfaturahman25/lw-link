import { useState } from 'react'
import { QRCodeSVG } from 'qrcode.react'
import { Copy, Check, Download, Share2 } from 'lucide-react'

type Props = {
  profileUrl: string
  embedded?: boolean
}

// Compact, collapsible share block. On mobile it stays collapsed so the link
// column is not dominated; on desktop it expands inline. QR + copy behavior is
// unchanged and fires no analytics.
export default function ShareCard({ profileUrl, embedded = false }: Props) {
  const [copied, setCopied] = useState(false)

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

  return (
    <details className="pp-card pp-share group overflow-hidden">
      <summary className="flex cursor-pointer list-none items-center justify-center gap-2 px-4 py-3 text-[13px] font-medium [&::-webkit-details-marker]:hidden">
        <Share2 className="h-4 w-4" aria-hidden="true" />
        <span style={{ color: 'var(--pp-text)' }}>Share profile</span>
      </summary>
      <div className="space-y-3 px-4 pb-4">
        <div className="flex justify-center rounded-xl bg-white p-3">
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
    </details>
  )
}
