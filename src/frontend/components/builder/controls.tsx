import { useId, useState } from 'react'
import type { ReactNode } from 'react'
import { ChevronDown } from 'lucide-react'

/* -------------------------------------------------------------------------- */
/* Field — a labelled control block with optional hint.                       */
/* -------------------------------------------------------------------------- */

export function Field({
  label,
  hint,
  children,
  htmlFor,
}: {
  label: string
  hint?: string
  children: ReactNode
  htmlFor?: string
}) {
  return (
    <div className="space-y-1.5">
      <label htmlFor={htmlFor} className="block text-xs font-semibold text-foreground">
        {label}
      </label>
      {children}
      {hint && <p className="text-[11px] leading-snug text-muted-foreground">{hint}</p>}
    </div>
  )
}

/* -------------------------------------------------------------------------- */
/* Segmented — compact visual choice. Native buttons keep keyboard support.   */
/* -------------------------------------------------------------------------- */

export function Segmented<T extends string>({
  value,
  options,
  onChange,
  ariaLabel,
  size = 'md',
}: {
  value: T
  options: { value: T; label: string }[]
  onChange: (v: T) => void
  ariaLabel: string
  size?: 'sm' | 'md'
}) {
  return (
    <div
      role="group"
      aria-label={ariaLabel}
      className="inline-flex w-full flex-wrap gap-1 rounded-xl border bg-muted/40 p-1"
    >
      {options.map((o) => {
        const active = value === o.value
        return (
          <button
            key={o.value}
            type="button"
            aria-pressed={active}
            onClick={() => onChange(o.value)}
            className={`flex-1 rounded-lg text-center font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary ${
              size === 'sm' ? 'px-2 py-1 text-[11px]' : 'px-2.5 py-1.5 text-xs'
            } ${
              active
                ? 'bg-primary text-primary-foreground shadow-sm'
                : 'text-muted-foreground hover:bg-accent hover:text-foreground'
            }`}
          >
            {o.label}
          </button>
        )
      })}
    </div>
  )
}

/* -------------------------------------------------------------------------- */
/* OptionCards — larger visual options with an optional description.          */
/* -------------------------------------------------------------------------- */

export function OptionCards<T extends string>({
  value,
  options,
  onChange,
  ariaLabel,
  columns = 2,
}: {
  value: T
  options: { value: T; label: string; desc?: string }[]
  onChange: (v: T) => void
  ariaLabel: string
  columns?: 2 | 3 | 4
}) {
  const cols =
    columns === 4
      ? 'grid-cols-2 sm:grid-cols-4'
      : columns === 3
        ? 'grid-cols-3'
        : 'grid-cols-2'
  return (
    <div role="group" aria-label={ariaLabel} className={`grid ${cols} gap-2`}>
      {options.map((o) => {
        const active = value === o.value
        return (
          <button
            key={o.value}
            type="button"
            aria-pressed={active}
            onClick={() => onChange(o.value)}
            className={`rounded-xl border p-2.5 text-left transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary ${
              active
                ? 'border-primary bg-primary/10'
                : 'border-border hover:border-muted-foreground/40 hover:bg-accent'
            }`}
          >
            <span className="block text-xs font-semibold">{o.label}</span>
            {o.desc && (
              <span className="mt-0.5 block text-[10px] leading-snug text-muted-foreground">
                {o.desc}
              </span>
            )}
          </button>
        )
      })}
    </div>
  )
}

/* -------------------------------------------------------------------------- */
/* Slider — range with a live value readout.                                  */
/* -------------------------------------------------------------------------- */

export function Slider({
  label,
  value,
  min,
  max,
  step = 0.01,
  onChange,
  format,
  ariaLabel,
}: {
  label: string
  value: number
  min: number
  max: number
  step?: number
  onChange: (v: number) => void
  format?: (v: number) => string
  ariaLabel?: string
}) {
  const id = useId()
  return (
    <div className="space-y-1">
      <div className="flex items-center justify-between">
        <label htmlFor={id} className="text-xs font-semibold text-foreground">
          {label}
        </label>
        <span className="text-[11px] font-medium tabular-nums text-muted-foreground">
          {format ? format(value) : value.toFixed(2)}
        </span>
      </div>
      <input
        id={id}
        type="range"
        className="builder-range"
        min={min}
        max={max}
        step={step}
        value={value}
        aria-label={ariaLabel ?? label}
        aria-valuetext={format ? format(value) : String(value)}
        onChange={(e) => onChange(Number(e.target.value))}
      />
    </div>
  )
}

/* -------------------------------------------------------------------------- */
/* ColorField — swatch + native color input + reset to the preset value.      */
/* -------------------------------------------------------------------------- */

export function ColorField({
  label,
  value,
  fallback,
  onChange,
  onReset,
  quick,
}: {
  label: string
  value: string
  fallback: string
  onChange: (v: string) => void
  onReset: () => void
  quick?: string[]
}) {
  const id = useId()
  const overridden = value.toLowerCase() !== fallback.toLowerCase()
  return (
    <div className="space-y-1.5">
      <div className="flex items-center justify-between">
        <label htmlFor={id} className="text-xs font-semibold text-foreground">
          {label}
        </label>
        {overridden && (
          <button
            type="button"
            onClick={onReset}
            className="text-[10px] font-medium text-muted-foreground underline-offset-2 hover:text-foreground hover:underline"
          >
            Reset
          </button>
        )}
      </div>
      <div className="flex items-center gap-2">
        <input
          id={id}
          type="color"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          aria-label={`${label} colour`}
          className="h-9 w-10 shrink-0 cursor-pointer rounded-lg border bg-background p-0.5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
        />
        <span className="font-mono text-[10px] uppercase text-muted-foreground">{value}</span>
        {quick && quick.length > 0 && (
          <div className="ml-auto flex items-center gap-1">
            {quick.map((c) => (
              <button
                key={c}
                type="button"
                aria-label={`Use ${c}`}
                onClick={() => onChange(c)}
                className="h-5 w-5 rounded-full border shadow-sm transition-transform hover:scale-110 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
                style={{ backgroundColor: c }}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

/* -------------------------------------------------------------------------- */
/* Disclosure — progressive disclosure section inside the settings panel.     */
/* -------------------------------------------------------------------------- */

export function Disclosure({
  title,
  children,
  defaultOpen = false,
  badge,
}: {
  title: string
  children: ReactNode
  defaultOpen?: boolean
  badge?: ReactNode
}) {
  const [open, setOpen] = useState(defaultOpen)
  const id = useId()
  return (
    <div className="rounded-xl border border-border/70 bg-background/40">
      <button
        type="button"
        aria-expanded={open}
        aria-controls={id}
        onClick={() => setOpen((v) => !v)}
        className="flex w-full items-center justify-between gap-2 rounded-xl px-3 py-2.5 text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
      >
        <span className="flex items-center gap-2 text-xs font-semibold">{title}</span>
        <span className="flex items-center gap-2">
          {badge}
          <ChevronDown
            className={`h-4 w-4 shrink-0 text-muted-foreground transition-transform ${open ? 'rotate-180' : ''}`}
          />
        </span>
      </button>
      {open && (
        <div id={id} className="space-y-4 border-t border-border/60 px-3 py-3">
          {children}
        </div>
      )}
    </div>
  )
}
