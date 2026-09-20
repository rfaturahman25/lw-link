import { useMemo, useState } from 'react'
import { useDashboardContext } from '../../pages/dashboard/DashboardLayout'
import { api } from '../../services/api'
import { isMapsUrl, parseSmartMetadata } from '../profile/smartLink'
import {
  DndContext,
  closestCenter,
  PointerSensor,
  useSensor,
  useSensors,
  KeyboardSensor,
  useDroppable,
  DragEndEvent,
} from '@dnd-kit/core'
import {
  SortableContext,
  verticalListSortingStrategy,
  arrayMove,
  useSortable,
  sortableKeyboardCoordinates,
} from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import {
  GripVertical,
  Link as LinkIcon,
  Plus,
  Edit2,
  Trash2,
  Folder,
  MapPin,
} from 'lucide-react'
import { ICON_OPTIONS, renderLinkIcon } from '../profile/linkIcons'

// Drop target for a section (or the unsectioned group) so links can be dragged across sections.
function Droppable({
  id,
  sectionId,
  children,
}: {
  id: string
  sectionId: string | null
  children: React.ReactNode
}) {
  const { setNodeRef } = useDroppable({ id, data: { type: 'container', sectionId } })
  return (
    <div ref={setNodeRef} className="min-h-[8px]">
      {children}
    </div>
  )
}

function SortableLinkItem({
  link,
  onEdit,
  onToggle,
  onDelete,
}: {
  link: {
    id: string
    title: string
    url: string
    icon: string | null
    type?: string | null
    metadata?: string | null
    enabled: boolean
    sectionId: string | null
  }
  onEdit: () => void
  onToggle: () => void
  onDelete: () => void
}) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: link.id,
    data: { type: 'link', sectionId: link.sectionId ?? null },
  })
  const locMeta = link.type === 'location' ? parseSmartMetadata(link) : null
  const subtitle = locMeta
    ? [locMeta.placeName, locMeta.address].filter(Boolean).join(' · ') || link.url
    : link.url
  const style: React.CSSProperties = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.6 : 1,
  }
  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`card p-3 flex items-center gap-2 ${isDragging ? 'shadow-lg ring-2 ring-primary/20' : ''}`}
    >
      <button
        {...attributes}
        {...listeners}
        className="inline-flex h-9 w-9 shrink-0 touch-none items-center justify-center rounded text-muted-foreground hover:bg-accent active:cursor-grabbing cursor-grab"
        aria-label="Drag to reorder"
      >
        <GripVertical className="h-4 w-4" />
      </button>
      {link.icon !== 'none' && (
        <div className="h-9 w-9 rounded-lg bg-primary/10 flex items-center justify-center text-primary shrink-0">
          {renderLinkIcon(link.icon)}
        </div>
      )}
      <div className="flex-1 min-w-0">
        <p className="flex items-center gap-1.5 text-sm font-medium">
          {link.type === 'location' && (
            <MapPin className="h-3.5 w-3.5 shrink-0 text-primary" aria-hidden="true" />
          )}
          <span className="truncate">
            {link.title} {link.enabled ? '' : '(disabled)'}
          </span>
          {link.type === 'location' && (
            <span className="shrink-0 rounded bg-primary/10 px-1.5 py-0.5 text-[10px] font-semibold text-primary">
              {locMeta?.showLocation === false ? 'LOCATION HIDDEN' : 'LOCATION'}
            </span>
          )}
        </p>
        <p className="text-xs text-muted-foreground truncate">{subtitle}</p>
      </div>
      <div className="flex items-center gap-1.5 shrink-0">
        <button
          onClick={onEdit}
          className="rounded border px-2.5 py-1.5 text-xs hover:bg-accent"
        >
          Edit
        </button>
        <button
          onClick={onToggle}
          className={`rounded px-2.5 py-1.5 text-xs font-medium ${link.enabled ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700'}`}
        >
          {link.enabled ? 'ON' : 'OFF'}
        </button>
        <button
          onClick={onDelete}
          className="rounded bg-red-50 px-2.5 py-1.5 text-xs text-red-700 hover:bg-red-100"
        >
          Delete
        </button>
      </div>
    </div>
  )
}

function SortableSection({
  section,
  children,
  onEdit,
  onDelete,
}: {
  section: { id: string; title: string }
  children: React.ReactNode
  onEdit: (id: string, title: string) => void
  onDelete: (id: string) => void
}) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: section.id,
    data: { type: 'section' },
  })
  const style: React.CSSProperties = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.6 : 1,
  }
  const [editing, setEditing] = useState(false)
  const [title, setTitle] = useState(section.title)

  const handleSave = () => {
    if (title.trim() && title !== section.title) onEdit(section.id, title.trim())
    setEditing(false)
  }

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`card p-4 space-y-3 ${isDragging ? 'shadow-lg ring-2 ring-primary/20' : ''}`}
    >
      <div className="flex items-center gap-2">
        <button
          {...attributes}
          {...listeners}
          className="inline-flex h-9 w-9 shrink-0 cursor-grab items-center justify-center rounded text-muted-foreground hover:bg-accent active:cursor-grabbing"
          aria-label="Drag to reorder section"
        >
          <GripVertical className="h-4 w-4" />
        </button>
        <Folder className="h-4 w-4 text-primary" />
        {editing ? (
          <input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleSave()}
            onBlur={handleSave}
            autoFocus
            className="input h-7 text-sm font-semibold flex-1"
          />
        ) : (
          <h3 className="font-semibold flex-1">{section.title}</h3>
        )}
        <div className="flex items-center gap-1">
          {!editing && (
            <button
              onClick={() => setEditing(true)}
              aria-label="Rename section"
              className="inline-flex h-9 w-9 items-center justify-center rounded text-muted-foreground hover:bg-accent"
            >
              <Edit2 className="h-4 w-4" />
            </button>
          )}
          <button
            onClick={() => onDelete(section.id)}
            aria-label="Delete section"
            className="inline-flex h-9 w-9 items-center justify-center rounded text-muted-foreground hover:bg-accent"
          >
            <Trash2 className="h-4 w-4" />
          </button>
        </div>
      </div>
      <div className="space-y-2">{children}</div>
    </div>
  )
}

export default function LinksManager({ embedded = false }: { embedded?: boolean }) {
  const { links, sections, reload, setLinks, setSections } = useDashboardContext() as unknown as {
    links: Array<{
      id: string
      title: string
      url: string
      icon: string | null
      align?: string | null
      type?: string | null
      metadata?: string | null
      showUrl?: boolean | null
      thumbnail?: string | null
      enabled: boolean
      sectionId: string | null
      position: number
    }>
    sections: Array<{ id: string; title: string; position: number }>
    reload: () => Promise<void>
    setLinks: React.Dispatch<React.SetStateAction<any[]>>
    setSections: React.Dispatch<React.SetStateAction<Array<{ id: string; title: string; position: number }>>>
  }

  const [linkForm, setLinkForm] = useState({
    title: '',
    url: '',
    icon: 'link',
    align: 'left' as 'left' | 'center' | 'right',
    sectionId: '' as string,
    showLocation: true,
    showUrl: true,
    thumbnail: '' as string,
  })
  const [editingId, setEditingId] = useState<string | null>(null)
  const [newSectionTitle, setNewSectionTitle] = useState('')
  const [showAddSection, setShowAddSection] = useState(false)
  const [sectionError, setSectionError] = useState('')
  const [linkErrors, setLinkErrors] = useState<{ title?: string; url?: string }>({})
  const [submitting, setSubmitting] = useState(false)
  const [uploadingThumb, setUploadingThumb] = useState(false)

  // Memoised so unrelated form edits don't re-render all icon buttons (perceived lag).
  const iconButtons = useMemo(
    () =>
      ICON_OPTIONS.map((opt) => {
        const Icon = opt.icon
        const selected = linkForm.icon === opt.value
        return (
          <button
            key={opt.value}
            type="button"
            onClick={() => setLinkForm((f) => ({ ...f, icon: opt.value }))}
            aria-pressed={selected}
            title={opt.label}
            className={`flex min-h-[44px] flex-col items-center gap-1 rounded-lg border p-2 text-xs transition-colors hover:bg-accent ${selected ? 'bg-primary text-primary-foreground border-primary shadow' : 'bg-background'}`}
          >
            <Icon className="h-5 w-5" />
            <span className="truncate w-full text-center text-[10px] leading-none">{opt.label}</span>
          </button>
        )
      }),
    [linkForm.icon]
  )

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 6 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  )

  const handleAddSection = async (e: React.FormEvent) => {
    e.preventDefault()
    const title = newSectionTitle.trim()
    if (!title) {
      setSectionError('Section name is required.')
      return
    }
    try {
      await api.sectionCreate(title)
      setNewSectionTitle('')
      setSectionError('')
      setShowAddSection(false)
      await reload()
    } catch (err: unknown) {
      setSectionError(err instanceof Error ? err.message : 'Failed to create section.')
    }
  }

  const handleEditSection = async (id: string, title: string) => {
    await api.sectionUpdate(id, title)
    await reload()
  }

  const handleDeleteSection = async (id: string) => {
    const sec = sections.find((s) => s.id === id)
    const count = links.filter((l) => l.sectionId === id).length
    const msg =
      count > 0
        ? `Delete "${sec?.title}"?\n\nThis section contains ${count} link${count > 1 ? 's' : ''}.\n\nWhat should happen to these links?\n\n[OK] = Move links to No Section\n[Cancel] = Cancel`
        : `Delete "${sec?.title}"?`
    if (!confirm(msg)) return
    await api.sectionDelete(id)
    await reload()
  }

  const validateLink = () => {
    const errs: { title?: string; url?: string } = {}
    if (!linkForm.title.trim()) errs.title = 'Title is required.'
    const url = linkForm.url.trim()
    if (!url) errs.url = 'URL is required.'
    else if (!/^(https?:\/\/|mailto:|tel:|sms:).+/i.test(url))
      errs.url = 'URL must start with http://, https://, mailto:, tel: or sms:'
    setLinkErrors(errs)
    return Object.keys(errs).length === 0
  }

  const addLink = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!validateLink()) return
    setSubmitting(true)
    const payload: Record<string, unknown> = {
      title: linkForm.title.trim(),
      url: linkForm.url.trim(),
      icon: linkForm.icon || null,
      sectionId: linkForm.sectionId || null,
      thumbnail: linkForm.thumbnail.trim() || null,
    }
    if (isMapsUrl(linkForm.url)) payload.showLocation = linkForm.showLocation
    payload.showUrl = linkForm.showUrl
    payload.align = linkForm.align
    try {
      if (editingId) {
        await api.linkUpdate(editingId, payload)
        setEditingId(null)
      } else {
        await api.linkCreate(payload)
      }
      setLinkForm({ title: '', url: '', icon: 'link', align: 'left', sectionId: '', showLocation: true, showUrl: true, thumbnail: '' })
      setLinkErrors({})
      await reload()
    } catch (err: unknown) {
      setLinkErrors({ url: err instanceof Error ? err.message : 'Failed to save link.' })
    } finally {
      setSubmitting(false)
    }
  }

  const uploadThumbnail = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    setUploadingThumb(true)
    try {
      const res = (await api.uploadImage(file)) as { data?: { url?: string } }
      const url = res.data?.url
      if (url) setLinkForm((f) => ({ ...f, thumbnail: url }))
    } catch (err: unknown) {
      setLinkErrors({ url: err instanceof Error ? err.message : 'Upload failed' })
    } finally {
      setUploadingThumb(false)
      e.target.value = ''
    }
  }

  const toggleLink = async (id: string) => {
    const prev = links
    // Optimistic: update the list + preview instantly, no full dashboard reload.
    setLinks((cur) => cur.map((l) => (l.id === id ? { ...l, enabled: !l.enabled } : l)))
    try {
      await api.linkToggle(id)
    } catch {
      setLinks(prev)
    }
  }
  const deleteLink = async (id: string) => {
    if (!confirm('Delete link? This cannot be undone.')) return
    await api.linkDelete(id)
    await reload()
  }

  const groupOf = (key: string | null) =>
    links
      .filter((l) => (l.sectionId ?? null) === key)
      .sort((a, b) => a.position - b.position)

  // Build the full ordered id list from per-container overrides (key = sectionId | '__none__').
  const buildOrderedIds = (overrides: Map<string, string[]>) => {
    const ids: string[] = []
    for (const sec of [...sections].sort((a, b) => a.position - b.position)) {
      ids.push(...(overrides.get(sec.id) ?? groupOf(sec.id).map((l) => l.id)))
    }
    ids.push(...(overrides.get('__none__') ?? groupOf(null).map((l) => l.id)))
    for (const l of links) if (!ids.includes(l.id)) ids.push(l.id)
    return ids
  }

  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event
    if (!over) return
    const activeData = active.data.current as
      | { type?: string; sectionId?: string | null }
      | undefined
    const overData = over.data.current as
      | { type?: string; sectionId?: string | null }
      | undefined

    // --- Section reorder ---
    if (activeData?.type === 'section') {
      if (String(active.id) === String(over.id)) return
      const targetId =
        overData?.type === 'section'
          ? String(over.id)
          : overData?.type === 'link' || overData?.type === 'container'
            ? (overData.sectionId ?? null)
            : null
      if (!targetId) return
      const oldIndex = sections.findIndex((s) => s.id === active.id)
      const newIndex = sections.findIndex((s) => s.id === targetId)
      if (oldIndex === -1 || newIndex === -1) return
      const newOrder = arrayMove(sections, oldIndex, newIndex)
      setSections(newOrder)
      try {
        await api.sectionReorder(newOrder.map((s) => s.id))
      } catch {
        await reload()
      }
      return
    }

    // --- Link reorder (within or across sections) ---
    const linkId = String(active.id)
    const sourceSection = activeData?.sectionId ?? null
    let targetSection: string | null = sourceSection
    if (overData?.type === 'link' || overData?.type === 'container') {
      targetSection = overData.sectionId ?? null
    } else if (overData?.type === 'section') {
      targetSection = String(over.id)
    }
    if (String(active.id) === String(over.id) && targetSection === sourceSection) return

    const source = groupOf(sourceSection)
    const oldIndex = source.findIndex((l) => l.id === linkId)
    if (oldIndex === -1) return

    const keyOf = (k: string | null) => k ?? '__none__'
    const overrides = new Map<string, string[]>()
    let sectionChanged = false

    if (targetSection === sourceSection) {
      const newIndex =
        overData?.type === 'link' ? source.findIndex((l) => l.id === over.id) : source.length - 1
      if (newIndex === -1 || newIndex === oldIndex) return
      overrides.set(keyOf(sourceSection), arrayMove(source, oldIndex, newIndex).map((l) => l.id))
    } else {
      const target = groupOf(targetSection)
      const insertAt =
        overData?.type === 'link'
          ? Math.max(0, target.findIndex((l) => l.id === over.id))
          : target.length
      const moved = source[oldIndex]
      const newTarget = [...target]
      newTarget.splice(insertAt, 0, moved)
      overrides.set(keyOf(sourceSection), source.filter((l) => l.id !== linkId).map((l) => l.id))
      overrides.set(keyOf(targetSection), newTarget.map((l) => l.id))
      sectionChanged = true
    }

    const orderedIds = buildOrderedIds(overrides)
    const posById = new Map(orderedIds.map((id, i) => [id, i + 1]))
    const prev = links
    setLinks((cur) =>
      cur.map((l) => ({
        ...l,
        position: posById.get(l.id) ?? l.position,
        ...(l.id === linkId && sectionChanged ? { sectionId: targetSection } : {}),
      }))
    )
    try {
      if (sectionChanged) await api.linkUpdate(linkId, { sectionId: targetSection })
      await api.linkReorder(orderedIds)
    } catch {
      setLinks(prev)
    }
  }

  const noSectionLinks = links.filter((l) => !l.sectionId).sort((a, b) => a.position - b.position)
  const hasSections = sections.length > 0
  const hasLinks = links.length > 0

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          {embedded ? (
            <p className="text-sm font-semibold">
              Links &amp; sections{' '}
              <span className="font-normal text-muted-foreground">({links.length})</span>
            </p>
          ) : (
            <>
              <p className="text-xs font-semibold uppercase tracking-[0.16em] text-primary">
                Profile content
              </p>
              <h2 className="mt-1 text-3xl font-bold tracking-tight">Links</h2>
              <p className="mt-1 text-sm text-muted-foreground">
                Add, organize, and prioritize the places you want to share.
              </p>
            </>
          )}
        </div>
        <button
          onClick={() => setShowAddSection((v) => !v)}
          className="inline-flex items-center gap-2 rounded-xl bg-primary px-4 py-2.5 text-sm font-medium text-primary-foreground hover:bg-primary/90"
        >
          <Plus className="h-4 w-4" /> Add Section
        </button>
      </div>

      <div className="min-w-0 space-y-6">
      {showAddSection && (
        <form onSubmit={handleAddSection} className="card space-y-2 rounded-2xl p-4">
          <div className="flex gap-2">
            <input
              value={newSectionTitle}
              onChange={(e) => {
                setNewSectionTitle(e.target.value)
                if (sectionError) setSectionError('')
              }}
              placeholder="Section title (e.g. Social Media)"
              className={`input flex-1 ${sectionError ? 'border-red-400' : ''}`}
              aria-invalid={!!sectionError}
              autoFocus
            />
            <button
              type="submit"
              className="rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground"
            >
              Create
            </button>
            <button
              type="button"
              onClick={() => {
                setShowAddSection(false)
                setSectionError('')
              }}
              className="rounded-md border px-4 py-2 text-sm"
            >
              Cancel
            </button>
          </div>
          {sectionError && <p className="text-xs text-red-600">{sectionError}</p>}
        </form>
      )}

      {!hasSections && !hasLinks && (
        <div className="card p-8 text-center space-y-3">
          <Folder className="h-10 w-10 mx-auto text-muted-foreground" />
          <h3 className="font-semibold">Organize your links into sections</h3>
          <p className="text-sm text-muted-foreground">
            Create sections to make your profile easier to navigate.
          </p>
          <button
            onClick={() => setShowAddSection(true)}
            className="inline-flex items-center gap-2 rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground"
          >
            <Plus className="h-4 w-4" /> Create Section
          </button>
        </div>
      )}

      <form onSubmit={addLink} className="card space-y-4 rounded-2xl p-5 sm:p-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <div>
            <input
              value={linkForm.title}
              onChange={(e) => {
                setLinkForm({ ...linkForm, title: e.target.value })
                if (linkErrors.title) setLinkErrors((p) => ({ ...p, title: '' }))
              }}
              placeholder="Title (e.g. WhatsApp)"
              className={`input ${linkErrors.title ? 'border-red-400' : ''}`}
              aria-invalid={!!linkErrors.title}
            />
            {linkErrors.title && <p className="mt-1 text-xs text-red-600">{linkErrors.title}</p>}
          </div>
          <div>
            <input
              value={linkForm.url}
              onChange={(e) => {
                setLinkForm({ ...linkForm, url: e.target.value })
                if (linkErrors.url) setLinkErrors((p) => ({ ...p, url: '' }))
              }}
              placeholder="https://..."
              className={`input ${linkErrors.url ? 'border-red-400' : ''}`}
              aria-invalid={!!linkErrors.url}
            />
            {linkErrors.url && <p className="mt-1 text-xs text-red-600">{linkErrors.url}</p>}
            {isMapsUrl(linkForm.url) ? (
              <div className="mt-2 space-y-1.5 rounded-lg border border-primary/30 bg-primary/5 p-2.5">
                <p className="flex items-center gap-1.5 text-xs font-medium text-primary">
                  <MapPin className="h-3.5 w-3.5 shrink-0" /> Google Maps location detected — this
                  will be a Location Smart Link.
                </p>
                <label className="flex items-center gap-2 text-xs">
                  <input
                    type="checkbox"
                    checked={linkForm.showLocation}
                    onChange={(e) => setLinkForm({ ...linkForm, showLocation: e.target.checked })}
                  />
                  Show location info on the public profile
                </label>
                <p className="text-[11px] text-muted-foreground">
                  Name &amp; address are extracted from the URL when you save.
                </p>
              </div>
            ) : (
              <p className="mt-1 text-[11px] text-muted-foreground">
                Tip: paste a Google Maps URL to create a Location Smart Link.
              </p>
            )}
          </div>
        </div>
        <label className="flex items-center gap-2 text-sm">
          <input
            type="checkbox"
            checked={linkForm.showUrl}
            onChange={(e) => setLinkForm({ ...linkForm, showUrl: e.target.checked })}
          />
          Show URL on the profile
        </label>

        <div className="space-y-2">
          <label className="text-sm font-medium">Thumbnail (optional)</label>
          <div className="flex flex-wrap gap-2">
            <input
              value={linkForm.thumbnail}
              onChange={(e) => setLinkForm({ ...linkForm, thumbnail: e.target.value })}
              placeholder="https://... or upload"
              className="input min-w-[180px] flex-1"
            />
            <label
              className={`inline-flex cursor-pointer items-center gap-2 rounded-md border px-4 py-2 text-sm ${
                uploadingThumb ? 'opacity-50' : 'hover:bg-accent'
              }`}
            >
              {uploadingThumb ? 'Uploading…' : 'Upload'}
              <input
                type="file"
                accept="image/png,image/jpeg,image/webp,image/gif"
                className="hidden"
                disabled={uploadingThumb}
                onChange={uploadThumbnail}
              />
            </label>
            {linkForm.thumbnail && (
              <button
                type="button"
                onClick={() => setLinkForm({ ...linkForm, thumbnail: '' })}
                className="rounded-md border px-3 py-2 text-sm text-red-600 hover:bg-accent"
              >
                Remove
              </button>
            )}
          </div>
          {linkForm.thumbnail && (
            <img
              src={linkForm.thumbnail}
              alt="Thumbnail preview"
              className="h-24 w-full rounded-lg object-cover"
            />
          )}
          <p className="text-[11px] text-muted-foreground">
            A thumbnail lets this link become the optional featured tile — promote it in Profile →
            Layout &amp; details.
          </p>
        </div>

        <div className="space-y-2">
          <label className="text-sm font-medium">Text alignment</label>
          <div className="flex gap-2">
            {(['left', 'center', 'right'] as const).map((a) => (
              <button
                key={a}
                type="button"
                onClick={() => setLinkForm({ ...linkForm, align: a })}
                aria-pressed={linkForm.align === a}
                className={`flex-1 rounded-md border px-3 py-2 text-xs capitalize ${
                  linkForm.align === a
                    ? 'border-primary bg-primary/10 text-primary'
                    : 'hover:bg-accent'
                }`}
              >
                {a}
              </button>
            ))}
          </div>
        </div>

        <div className="space-y-2">
          <label className="text-sm font-medium">Section</label>
          <select
            value={linkForm.sectionId}
            onChange={(e) => setLinkForm({ ...linkForm, sectionId: e.target.value })}
            className="input"
          >
            <option value="">No Section</option>
            {sections.map((s) => (
              <option key={s.id} value={s.id}>
                {s.title}
              </option>
            ))}
          </select>
        </div>
        <div className="space-y-2">
          <label className="text-sm font-medium">Icon</label>
          <div className="grid grid-cols-4 sm:grid-cols-6 md:grid-cols-9 gap-2">
            {iconButtons}
          </div>
          <p className="text-xs text-muted-foreground">
            Choose the icon that appears next to your link (WhatsApp, Instagram, Google Sheet,
            etc.). Saved as <code className="bg-muted px-1 rounded">{linkForm.icon}</code>
          </p>
        </div>
        <div className="flex gap-2">
          <button
            type="submit"
            disabled={submitting}
            className="inline-flex items-center justify-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 shadow disabled:opacity-50"
          >
            {submitting ? 'Saving...' : editingId ? 'Update link' : '+ Add link'}
          </button>
          {editingId && (
            <button
              type="button"
              onClick={() => {
                setEditingId(null)
                setLinkForm({ title: '', url: '', icon: 'link', align: 'left', sectionId: '', showLocation: true, showUrl: true, thumbnail: '' })
                setLinkErrors({})
              }}
              className="rounded-md border px-4 py-2 text-sm hover:bg-accent"
            >
              Cancel
            </button>
          )}
        </div>
        <p className="text-xs text-muted-foreground">
          Drag the handle on the left of each link to reorder. Use ON/OFF to hide without deleting.
        </p>
      </form>

      <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
      {/* Sections */}
      {hasSections && (
        <SortableContext items={sections.map((s) => s.id)} strategy={verticalListSortingStrategy}>
          <div className="space-y-4">
            {sections.map((sec) => {
              const secLinks = links
                .filter((l) => l.sectionId === sec.id)
                .sort((a, b) => a.position - b.position)
              return (
                <SortableSection
                  key={sec.id}
                  section={sec}
                  onEdit={handleEditSection}
                  onDelete={handleDeleteSection}
                >
                  <Droppable id={`container:${sec.id}`} sectionId={sec.id}>
                    <SortableContext
                      items={secLinks.map((l) => l.id)}
                      strategy={verticalListSortingStrategy}
                    >
                      {secLinks.length === 0 ? (
                        <div className="text-center py-4 space-y-2 border-2 border-dashed rounded-lg">
                          <p className="text-sm text-muted-foreground">
                            Drop links here, or add one above with this section.
                          </p>
                        </div>
                      ) : (
                        <div className="space-y-2">
                          {secLinks.map((l) => (
                            <SortableLinkItem
                              key={l.id}
                              link={l as never}
                              onEdit={() => {
                                setEditingId(l.id)
                                setLinkForm({
                                  title: l.title,
                                  url: l.url,
                                  icon: l.icon || 'link',
                                  align: (l.align as 'left' | 'center' | 'right') || 'left',
                                  sectionId: l.sectionId || '',
                                  showLocation: parseSmartMetadata(l)?.showLocation ?? true,
                                  showUrl: l.showUrl !== false,
                                  thumbnail: l.thumbnail || '',
                                })
                                window.scrollTo({ top: 0, behavior: 'smooth' })
                              }}
                              onToggle={() => toggleLink(l.id)}
                              onDelete={() => deleteLink(l.id)}
                            />
                          ))}
                        </div>
                      )}
                    </SortableContext>
                  </Droppable>
                  {secLinks.length > 0 && (
                    <p className="text-xs text-muted-foreground">
                      {secLinks.length} link{secLinks.length !== 1 ? 's' : ''} • Drag to reorder or
                      move across sections
                    </p>
                  )}
                </SortableSection>
              )
            })}
          </div>
        </SortableContext>
      )}

      {/* No Section links */}
      <div className="space-y-2">
        <h3 className="font-semibold flex items-center gap-2">
          <LinkIcon className="h-4 w-4" /> {hasSections ? 'No Section' : 'Your Links'}{' '}
          <span className="text-xs font-normal text-muted-foreground">
            ({noSectionLinks.length})
          </span>
        </h3>
        <Droppable id="container:__none__" sectionId={null}>
          <SortableContext
            items={noSectionLinks.map((l) => l.id)}
            strategy={verticalListSortingStrategy}
          >
            {noSectionLinks.length === 0 ? (
              <p className="text-sm text-muted-foreground card p-4 text-center">
                {hasSections
                  ? 'No unsectioned links. Drag a link here to remove it from a section.'
                  : 'No links yet. Add your first link above.'}
              </p>
            ) : (
              <div className="space-y-2">
                {noSectionLinks.map((l) => (
                  <SortableLinkItem
                    key={l.id}
                    link={l as never}
                    onEdit={() => {
                      setEditingId(l.id)
                      setLinkForm({
                        title: l.title,
                        url: l.url,
                        icon: l.icon || 'link',
                        align: (l.align as 'left' | 'center' | 'right') || 'left',
                        sectionId: l.sectionId || '',
                        showLocation: parseSmartMetadata(l)?.showLocation ?? true,
                        showUrl: l.showUrl !== false,
                        thumbnail: l.thumbnail || '',
                      })
                      window.scrollTo({ top: 0, behavior: 'smooth' })
                    }}
                    onToggle={() => toggleLink(l.id)}
                    onDelete={() => deleteLink(l.id)}
                  />
                ))}
              </div>
            )}
          </SortableContext>
        </Droppable>
      </div>
      </DndContext>
      </div>
    </div>
  )
}
