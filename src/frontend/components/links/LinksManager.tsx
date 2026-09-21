import { useCallback, useMemo, useState } from 'react'
import { useDashboardContext } from '../../pages/dashboard/DashboardLayout'
import { api } from '../../services/api'
import { UNSECTIONED_GROUP } from '../../themes'
import { isMapsUrl, parseSmartMetadata } from '../profile/smartLink'
import {
  DndContext,
  DragOverlay,
  MouseSensor,
  TouchSensor,
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
  Star,
} from 'lucide-react'
import { renderLinkIcon } from '../profile/linkIcons'
import Modal from '../ui/Modal'
import LinkForm from './LinkForm'
import {
  LINK_FORM_ID,
  emptyLinkForm,
  linkFormFromLink,
  validateLinkForm,
} from './linkFormModel'
import type { LinkFormErrors, LinkFormLink, LinkFormValues, ResolvedLocation } from './linkFormModel'
import { linksCollisionDetection, resolveTargetSection } from './dndCollision'

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
  featured,
  showFeatured,
  onToggleFeatured,
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
    thumbnail?: string | null
  }
  onEdit: () => void
  onToggle: () => void
  onDelete: () => void
  featured?: boolean
  showFeatured?: boolean
  onToggleFeatured?: () => void
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
        className="inline-flex h-10 w-10 shrink-0 touch-none cursor-grab items-center justify-center rounded text-muted-foreground hover:bg-accent active:cursor-grabbing"
        aria-label="Drag to reorder"
      >
        <GripVertical className="h-4 w-4" />
      </button>
      {/* The whole icon + text area is a drag surface so touch users are not
          forced to hit the small handle; `touch-pan-y` keeps scrolling intact. */}
      <div
        {...listeners}
        className="flex min-w-0 flex-1 touch-pan-y select-none items-center gap-2"
      >
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
      </div>
      <div className="flex items-center gap-1.5 shrink-0">
        {showFeatured && (
          <button
            type="button"
            onClick={onToggleFeatured}
            aria-pressed={!!featured}
            aria-label={featured ? 'Remove from featured' : 'Make featured'}
            title={
              featured
                ? 'Featured link — shown as the large tile. Click to remove.'
                : 'Make featured (shown as a large tile on the profile)'
            }
            className={`inline-flex h-8 w-8 items-center justify-center rounded border transition-colors ${
              featured
                ? 'border-primary bg-primary/10 text-primary'
                : 'text-muted-foreground hover:bg-accent'
            }`}
          >
            <Star className={`h-3.5 w-3.5 ${featured ? 'fill-current' : ''}`} />
          </button>
        )}
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
  isOver,
}: {
  section: { id: string; title: string }
  children: React.ReactNode
  onEdit: (id: string, title: string) => void
  onDelete: (id: string) => void
  isOver?: boolean
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
      className={`card p-4 space-y-3 transition-shadow ${
        isDragging
          ? 'shadow-lg ring-2 ring-primary/20'
          : isOver
            ? 'ring-2 ring-primary/50 ring-offset-2 ring-offset-background'
            : ''
      }`}
    >
      <div className="flex items-center gap-2">
        <button
          {...attributes}
          {...listeners}
          className="inline-flex h-10 w-10 shrink-0 touch-none cursor-grab items-center justify-center rounded text-muted-foreground hover:bg-accent active:cursor-grabbing"
          aria-label="Drag to reorder section"
        >
          <GripVertical className="h-4 w-4" />
        </button>
        {/* Folder + title is a second drag surface for touch; the rename input
            stays fully interactive because listeners are dropped while editing. */}
        <div
          {...(editing ? {} : listeners)}
          className={`flex min-w-0 flex-1 items-center gap-2 touch-pan-y ${
            editing ? '' : 'select-none'
          }`}
        >
          <Folder className="h-4 w-4 shrink-0 text-primary" />
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
            <h3 className="truncate font-semibold">{section.title}</h3>
          )}
        </div>
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

// The unsectioned links group is a first-class, sortable container so it can sit
// anywhere among the sections — not just at the bottom.
function SortableUnsectioned({
  count,
  canReorder,
  isOver,
  title,
  children,
}: {
  count: number
  canReorder: boolean
  isOver?: boolean
  title: string
  children: React.ReactNode
}) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: UNSECTIONED_GROUP,
    data: { type: 'section' },
  })
  const style: React.CSSProperties = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.6 : 1,
  }

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`card p-4 space-y-3 transition-shadow ${
        isDragging
          ? 'shadow-lg ring-2 ring-primary/20'
          : isOver
            ? 'ring-2 ring-primary/50 ring-offset-2 ring-offset-background'
            : ''
      }`}
    >
      <div className="flex items-center gap-2">
        {canReorder ? (
          <button
            {...attributes}
            {...listeners}
            className="inline-flex h-10 w-10 shrink-0 touch-none cursor-grab items-center justify-center rounded text-muted-foreground hover:bg-accent active:cursor-grabbing"
            aria-label="Drag to reorder this group"
          >
            <GripVertical className="h-4 w-4" />
          </button>
        ) : (
          <span
            className="inline-flex h-10 w-10 shrink-0 items-center justify-center text-muted-foreground"
            aria-hidden="true"
          >
            <LinkIcon className="h-4 w-4" />
          </span>
        )}
        <div
          {...(canReorder ? listeners : {})}
          className={`flex min-w-0 flex-1 items-center gap-2 touch-pan-y ${
            canReorder ? 'select-none' : ''
          }`}
        >
          <h3 className="truncate font-semibold">{title}</h3>
          <span className="text-xs font-normal text-muted-foreground">({count})</span>
        </div>
      </div>
      <Droppable id={`container:${UNSECTIONED_GROUP}`} sectionId={null}>
        {children}
      </Droppable>
    </div>
  )
}

export default function LinksManager({
  embedded = false,
  featuredLinkId = null,
  onSetFeatured,
  sectionOrder = null,
  onSectionOrderChange,
}: {
  embedded?: boolean
  /** The link currently promoted to the featured tile, if any. */
  featuredLinkId?: string | null
  /** Promote/demote a link (pass null to clear). Owned by the builder draft. */
  onSetFeatured?: (id: string | null) => void
  /** Explicit group order (section ids + `UNSECTIONED_GROUP`), or null for default. */
  sectionOrder?: string[] | null
  /** Persist a new group order. Owned by the builder draft. */
  onSectionOrderChange?: (order: string[]) => void
}) {
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

  const [linkForm, setLinkForm] = useState<LinkFormValues>(emptyLinkForm)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [modalOpen, setModalOpen] = useState(false)
  const [newSectionTitle, setNewSectionTitle] = useState('')
  const [showAddSection, setShowAddSection] = useState(false)
  const [sectionError, setSectionError] = useState('')
  const [linkErrors, setLinkErrors] = useState<LinkFormErrors>({})
  const [submitting, setSubmitting] = useState(false)
  const [uploadingThumb, setUploadingThumb] = useState(false)
  // Live drag state, used for the drop-target highlight and the drag overlay.
  const [activeDrag, setActiveDrag] = useState<{ type: 'link' | 'section'; id: string } | null>(null)
  const [overGroup, setOverGroup] = useState<string | null>(null)

  // Mouse drags start after a small movement; touch drags require a short
  // long-press so a finger swipe still scrolls the list. Both drag surfaces also
  // use `touch-pan-y`, so vertical scrolling is never blocked.
  const sensors = useSensors(
    useSensor(MouseSensor, { activationConstraint: { distance: 6 } }),
    useSensor(TouchSensor, { activationConstraint: { delay: 160, tolerance: 8 } }),
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

  const openCreateLink = () => {
    setEditingId(null)
    setLinkForm(emptyLinkForm())
    setLinkErrors({})
    setModalOpen(true)
  }

  const openEditLink = (link: LinkFormLink) => {
    setEditingId(link.id)
    setLinkForm(linkFormFromLink(link))
    setLinkErrors({})
    setModalOpen(true)
  }

  const closeLinkModal = () => {
    setModalOpen(false)
    setEditingId(null)
    setLinkForm(emptyLinkForm())
    setLinkErrors({})
  }

  // Server-side Smart Link preview for the Add/Edit form (never persists).
  const resolveLocation = useCallback(async (url: string): Promise<ResolvedLocation> => {
    const res = (await api.linkResolve(url)) as { data?: ResolvedLocation }
    return res.data ?? { type: 'link', metadata: null }
  }, [])

  const updateLinkForm = (patch: Partial<LinkFormValues>) => {    setLinkForm((f) => ({ ...f, ...patch }))
    if (patch.title !== undefined && linkErrors.title) setLinkErrors((p) => ({ ...p, title: '' }))
    if (patch.url !== undefined && linkErrors.url) setLinkErrors((p) => ({ ...p, url: '' }))
  }

  const submitLink = async (e: React.FormEvent) => {
    e.preventDefault()
    const errs = validateLinkForm(linkForm)
    setLinkErrors(errs)
    if (Object.keys(errs).length > 0) return
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
      if (editingId) await api.linkUpdate(editingId, payload)
      else await api.linkCreate(payload)
      await reload()
      closeLinkModal()
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

  // Ordered group keys: sections plus the unsectioned block. An explicit
  // `sectionOrder` (from the builder draft) wins; otherwise sections keep their
  // position order and the unsectioned block is last.
  const containerKeys = useMemo(() => {
    const sectionIds = [...sections].sort((a, b) => a.position - b.position).map((s) => s.id)
    const base = sectionOrder && sectionOrder.length > 0 ? sectionOrder : sectionIds
    const keys = base.filter((k) => k === UNSECTIONED_GROUP || sectionIds.includes(k))
    for (const id of sectionIds) if (!keys.includes(id)) keys.push(id)
    if (!keys.includes(UNSECTIONED_GROUP)) keys.push(UNSECTIONED_GROUP)
    return keys
  }, [sections, sectionOrder])

  const handleDragEnd = async (event: DragEndEvent) => {
    setActiveDrag(null)
    setOverGroup(null)
    const { active, over } = event
    if (!over) return
    const activeData = active.data.current as
      | { type?: string; sectionId?: string | null }
      | undefined
    const overData = over.data.current as
      | { type?: string; sectionId?: string | null }
      | undefined

    // --- Group (section or the unsectioned block) reorder ---
    if (activeData?.type === 'section') {
      if (String(active.id) === String(over.id)) return
      // Only groups are valid targets for a group drag (see collision detection).
      const targetKey = overData?.type === 'section' ? String(over.id) : null
      if (!targetKey || targetKey === String(active.id)) return
      const oldIndex = containerKeys.indexOf(String(active.id))
      const newIndex = containerKeys.indexOf(targetKey)
      if (oldIndex === -1 || newIndex === -1) return
      const nextKeys = arrayMove(containerKeys, oldIndex, newIndex)
      onSectionOrderChange?.(nextKeys)
      // Keep section positions in sync with the new visual order so later
      // link-order calculations (which sort by position) stay correct.
      const sectionIds = nextKeys.filter((k) => k !== UNSECTIONED_GROUP)
      const posById = new Map(sectionIds.map((id, i) => [id, i + 1]))
      const reordered = [...sections]
        .sort((a, b) => a.position - b.position)
        .map((s) => ({ ...s, position: posById.get(s.id) ?? s.position }))
      setSections(reordered)
      try {
        await api.sectionReorder(sectionIds)
      } catch {
        await reload()
      }
      return
    }

    // --- Link reorder (within or across sections) ---
    const linkId = String(active.id)
    const sourceSection = activeData?.sectionId ?? null
    const targetSection = resolveTargetSection(overData, over.id, sourceSection)
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
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setShowAddSection((v) => !v)}
            className="inline-flex items-center gap-2 rounded-xl border px-4 py-2.5 text-sm font-medium hover:bg-accent"
          >
            <Folder className="h-4 w-4" /> Add Section
          </button>
          <button
            type="button"
            onClick={openCreateLink}
            className="inline-flex items-center gap-2 rounded-xl bg-primary px-4 py-2.5 text-sm font-medium text-primary-foreground hover:bg-primary/90"
          >
            <Plus className="h-4 w-4" /> Add Link
          </button>
        </div>
      </div>

      <div className="min-w-0 space-y-6">
      {showAddSection && (
        <form onSubmit={handleAddSection} className="form-reveal card space-y-2 rounded-2xl p-4">
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

      <p className="text-xs text-muted-foreground">
        Drag the handle — or press and hold a row — to reorder. Use ON/OFF to hide without
        deleting.
      </p>

      <DndContext
        sensors={sensors}
        collisionDetection={linksCollisionDetection}
        onDragStart={({ active }) =>
          setActiveDrag({
            type: (active.data.current as { type?: string } | undefined)?.type === 'section'
              ? 'section'
              : 'link',
            id: String(active.id),
          })
        }
        onDragOver={({ over }) => {
          const data = over?.data.current as
            | { type?: string; sectionId?: string | null }
            | undefined
          if (!over || !data) {
            setOverGroup(null)
            return
          }
          if (data.type === 'section') setOverGroup(String(over.id))
          else if (data.type === 'link' || data.type === 'container') {
            setOverGroup(data.sectionId ?? UNSECTIONED_GROUP)
          } else {
            setOverGroup(null)
          }
        }}
        onDragCancel={() => {
          setActiveDrag(null)
          setOverGroup(null)
        }}
        onDragEnd={handleDragEnd}
      >
        <SortableContext items={containerKeys} strategy={verticalListSortingStrategy}>
          <div className="space-y-4">
            {containerKeys.map((key) => {
              const activeKey = activeDrag?.type === 'section' ? activeDrag.id : null
              const isOver = overGroup === key && activeKey !== key

              if (key === UNSECTIONED_GROUP) {
                return (
                  <SortableUnsectioned
                    key={key}
                    count={noSectionLinks.length}
                    canReorder={hasSections && !!onSectionOrderChange}
                    isOver={isOver}
                    title={hasSections ? 'No Section' : 'Your Links'}
                  >
                    <SortableContext
                      items={noSectionLinks.map((l) => l.id)}
                      strategy={verticalListSortingStrategy}
                    >
                      {noSectionLinks.length === 0 ? (
                        <p className="text-sm text-muted-foreground text-center py-3">
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
                              onEdit={() => openEditLink(l as LinkFormLink)}
                              onToggle={() => toggleLink(l.id)}
                              onDelete={() => deleteLink(l.id)}
                              showFeatured={!!l.thumbnail && !!onSetFeatured}
                              featured={featuredLinkId === l.id}
                              onToggleFeatured={() =>
                                onSetFeatured?.(featuredLinkId === l.id ? null : l.id)
                              }
                            />
                          ))}
                        </div>
                      )}
                    </SortableContext>
                  </SortableUnsectioned>
                )
              }

              const sec = sections.find((s) => s.id === key)
              if (!sec) return null
              const secLinks = links
                .filter((l) => l.sectionId === sec.id)
                .sort((a, b) => a.position - b.position)
              return (
                <SortableSection
                  key={sec.id}
                  section={sec}
                  onEdit={handleEditSection}
                  onDelete={handleDeleteSection}
                  isOver={isOver}
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
                              onEdit={() => openEditLink(l as LinkFormLink)}
                              onToggle={() => toggleLink(l.id)}
                              onDelete={() => deleteLink(l.id)}
                              showFeatured={!!l.thumbnail && !!onSetFeatured}
                              featured={featuredLinkId === l.id}
                              onToggleFeatured={() =>
                                onSetFeatured?.(featuredLinkId === l.id ? null : l.id)
                              }
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

        {/* A floating clone follows the pointer so dragging feels direct instead
            of snapping between drop targets. */}
        <DragOverlay dropAnimation={{ duration: 200, easing: 'cubic-bezier(0.22,1,0.36,1)' }}>
          {activeDrag ? (
            <div className="card rotate-1 p-3 shadow-2xl ring-2 ring-primary/40">
              {activeDrag.type === 'section' ? (
                <p className="flex items-center gap-2 text-sm font-semibold">
                  <GripVertical className="h-4 w-4 text-muted-foreground" />
                  {activeDrag.id === UNSECTIONED_GROUP
                    ? 'No Section'
                    : sections.find((s) => s.id === activeDrag.id)?.title || 'Section'}
                </p>
              ) : (
                <p className="flex items-center gap-2 text-sm font-medium">
                  <GripVertical className="h-4 w-4 text-muted-foreground" />
                  {links.find((l) => l.id === activeDrag.id)?.title || 'Link'}
                </p>
              )}
            </div>
          ) : null}
        </DragOverlay>
      </DndContext>
      </div>

      <Modal
        open={modalOpen}
        onClose={closeLinkModal}
        title={editingId ? 'Edit Link' : 'Add Link'}
        size="lg"
        busy={submitting}
        footer={
          <>
            <button
              type="button"
              onClick={closeLinkModal}
              disabled={submitting}
              className="rounded-lg border px-4 py-2 text-sm font-medium hover:bg-accent disabled:opacity-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              form={LINK_FORM_ID}
              disabled={submitting}
              className="rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 disabled:opacity-50"
            >
              {submitting ? 'Saving…' : editingId ? 'Save' : 'Add'}
            </button>
          </>
        }
      >
        <LinkForm
          formId={LINK_FORM_ID}
          values={linkForm}
          errors={linkErrors}
          sections={sections}
          uploadingThumb={uploadingThumb}
          onChange={updateLinkForm}
          onUploadThumbnail={uploadThumbnail}
          onSubmit={submitLink}
          resolveLocation={resolveLocation}
        />
      </Modal>
    </div>
  )
}
