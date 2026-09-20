import { useMemo, useState } from 'react'
import { useDashboardContext } from './DashboardLayout'
import { api } from '../../services/api'
import { useAuth } from '../../hooks/useAuth'
import ProfilePreview from '../../components/profile/ProfilePreview'
import { resolveProfileTheme, resolveShowShare, resolveSocialStyle } from '../../themes'
import { WhatsAppIcon } from '../../components/icons/BrandIcons'
import { isMapsUrl, parseSmartMetadata } from '../../components/profile/smartLink'
import {
  DndContext,
  closestCenter,
  PointerSensor,
  useSensor,
  useSensors,
  KeyboardSensor,
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
  Github,
  Linkedin,
  Twitter,
  Globe,
  Mail,
  Instagram,
  Youtube,
  Facebook,
  Link as LinkIcon,
  FileSpreadsheet,
  FileText,
  ShoppingBag,
  Phone,
  Image as ImageIcon,
  Music,
  Video,
  Plus,
  Edit2,
  Trash2,
  MoreVertical,
  Folder,
  MapPin,
} from 'lucide-react'

const ICON_OPTIONS = [
  { value: 'link', label: 'Link', icon: LinkIcon },
  { value: 'instagram', label: 'Instagram', icon: Instagram },
  { value: 'whatsapp', label: 'WhatsApp', icon: WhatsAppIcon },
  { value: 'sheet', label: 'Google Sheet', icon: FileSpreadsheet },
  { value: 'globe', label: 'Website', icon: Globe },
  { value: 'youtube', label: 'YouTube', icon: Youtube },
  { value: 'tiktok', label: 'TikTok', icon: Music },
  { value: 'github', label: 'GitHub', icon: Github },
  { value: 'linkedin', label: 'LinkedIn', icon: Linkedin },
  { value: 'twitter', label: 'Twitter', icon: Twitter },
  { value: 'facebook', label: 'Facebook', icon: Facebook },
  { value: 'mail', label: 'Email', icon: Mail },
  { value: 'phone', label: 'Phone', icon: Phone },
  { value: 'file', label: 'File', icon: FileText },
  { value: 'shop', label: 'Shop', icon: ShoppingBag },
  { value: 'image', label: 'Image', icon: ImageIcon },
  { value: 'video', label: 'Video', icon: Video },
] as const

const iconMap: Record<string, React.ReactNode> = {
  github: <Github className="h-5 w-5" />,
  linkedin: <Linkedin className="h-5 w-5" />,
  twitter: <Twitter className="h-5 w-5" />,
  globe: <Globe className="h-5 w-5" />,
  mail: <Mail className="h-5 w-5" />,
  instagram: <Instagram className="h-5 w-5" />,
  youtube: <Youtube className="h-5 w-5" />,
  facebook: <Facebook className="h-5 w-5" />,
  whatsapp: <WhatsAppIcon className="h-5 w-5" />,
  sheet: <FileSpreadsheet className="h-5 w-5" />,
  link: <LinkIcon className="h-5 w-5" />,
  file: <FileText className="h-5 w-5" />,
  shop: <ShoppingBag className="h-5 w-5" />,
  phone: <Phone className="h-5 w-5" />,
  image: <ImageIcon className="h-5 w-5" />,
  video: <Video className="h-5 w-5" />,
  music: <Music className="h-5 w-5" />,
  tiktok: <Music className="h-5 w-5" />,
  default: <LinkIcon className="h-5 w-5" />,
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
      <div className="h-9 w-9 rounded-lg bg-primary/10 flex items-center justify-center text-primary shrink-0">
        {iconMap[link.icon || 'link'] || iconMap.default}
      </div>
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

export default function LinksPage() {
  const { links, sections, socials, profile, reload, setLinks } =
    useDashboardContext() as unknown as {
      links: Array<{
        id: string
        title: string
        url: string
        icon: string | null
        type?: string | null
        metadata?: string | null
        enabled: boolean
        sectionId: string | null
        position: number
      }>
      sections: Array<{ id: string; title: string; position: number }>
      socials: Array<{ platform: string; value: string; enabled: boolean; position: number }>
      profile: {
        bio?: string | null
        logoUrl?: string | null
        themeConfig?: unknown
        colorPalette?: string | null
        buttonStyle?: string | null
        fontFamily?: string | null
        headerStyle?: string | null
        bannerUrl?: string | null
        user?: { displayName: string; avatarUrl: string | null }
      } | null
      reload: () => Promise<void>
      setLinks: React.Dispatch<React.SetStateAction<any[]>>
    }
  const { user } = useAuth()
  const previewTheme = useMemo(() => resolveProfileTheme(profile), [profile])
  const previewUrl = user ? `${window.location.origin}/@${user.username}` : ''
  // Memoised so typing/selecting in the form does not re-render the whole preview
  // (and its QR/map iframes), which was making the editor feel laggy.
  const previewElement = useMemo(
    () => (
      <ProfilePreview
        theme={previewTheme}
        displayName={profile?.user?.displayName || user?.displayName || ''}
        avatarUrl={profile?.user?.avatarUrl ?? user?.avatarUrl ?? null}
        bio={profile?.bio ?? null}
        logoUrl={profile?.logoUrl ?? null}
        links={links.filter((l) => l.enabled)}
        sections={sections}
        socials={socials
          .filter((s) => s.enabled)
          .map((s) => ({ platform: s.platform, value: s.value }))}
        profileUrl={previewUrl}
        showShare={resolveShowShare(profile)}
        socialStyle={resolveSocialStyle(profile)}
        headerStyle={(profile?.headerStyle as 'classic' | 'hero' | 'banner' | 'shape') ?? 'classic'}
        bannerUrl={profile?.bannerUrl ?? null}
      />
    ),
    [previewTheme, profile, user, links, sections, socials, previewUrl]
  )

  const [linkForm, setLinkForm] = useState({
    title: '',
    url: '',
    icon: 'link',
    sectionId: '' as string,
    showLocation: true,
  })
  const [editingId, setEditingId] = useState<string | null>(null)
  const [newSectionTitle, setNewSectionTitle] = useState('')
  const [showAddSection, setShowAddSection] = useState(false)
  const [sectionError, setSectionError] = useState('')
  const [linkErrors, setLinkErrors] = useState<{ title?: string; url?: string }>({})
  const [submitting, setSubmitting] = useState(false)

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

  const sectionSensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 6 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  )
  const linkSensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 6 } })
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

  const handleSectionReorder = async (event: DragEndEvent) => {
    const { active, over } = event
    if (!over || active.id === over.id) return
    const oldIndex = sections.findIndex((s) => s.id === active.id)
    const newIndex = sections.findIndex((s) => s.id === over.id)
    if (oldIndex === -1 || newIndex === -1) return
    const newOrder = arrayMove(sections, oldIndex, newIndex)
    // optimistic
    // need to update via API
    await api.sectionReorder(newOrder.map((s) => s.id))
    await reload()
  }

  const validateLink = () => {
    const errs: { title?: string; url?: string } = {}
    if (!linkForm.title.trim()) errs.title = 'Title is required.'
    const url = linkForm.url.trim()
    if (!url) errs.url = 'URL is required.'
    else if (!/^https?:\/\/.+/i.test(url))
      errs.url = 'URL must start with http:// or https:// (example: https://example.com).'
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
    }
    if (isMapsUrl(linkForm.url)) payload.showLocation = linkForm.showLocation
    try {
      if (editingId) {
        await api.linkUpdate(editingId, payload)
        setEditingId(null)
      } else {
        await api.linkCreate(payload)
      }
      setLinkForm({ title: '', url: '', icon: 'link', sectionId: '', showLocation: true })
      setLinkErrors({})
      await reload()
    } catch (err: unknown) {
      setLinkErrors({ url: err instanceof Error ? err.message : 'Failed to save link.' })
    } finally {
      setSubmitting(false)
    }
  }

  const toggleLink = async (id: string) => {
    await api.linkToggle(id)
    await reload()
  }
  const deleteLink = async (id: string) => {
    if (!confirm('Delete link? This cannot be undone.')) return
    await api.linkDelete(id)
    await reload()
  }

  const handleLinkDragEnd = async (event: DragEndEvent, sectionId: string | null) => {
    const { active, over } = event
    if (!over || active.id === over.id) return
    // only reorder within same section
    const sectionLinks = links
      .filter((l) => l.sectionId === sectionId)
      .sort((a, b) => a.position - b.position)
    const oldIndex = sectionLinks.findIndex((l) => l.id === active.id)
    const newIndex = sectionLinks.findIndex((l) => l.id === over.id)
    if (oldIndex === -1 || newIndex === -1) return
    const newOrder = arrayMove(sectionLinks, oldIndex, newIndex)
    // For simplicity, reorder globally by section groups: keep section order, then link order within section
    // Build global orderedIds: sections in order, each with its links in new order, plus No Section at end
    const grouped: Record<string, typeof links> = {}
    for (const l of links) {
      const key = l.sectionId || '__none__'
      if (!grouped[key]) grouped[key] = []
      grouped[key].push(l)
    }
    // update the moved section's group
    grouped[sectionId || '__none__'] = newOrder
    const orderedIds: string[] = []
    for (const sec of sections) {
      const g = grouped[sec.id] || []
      for (const l of g.sort((a, b) => a.position - b.position)) orderedIds.push(l.id)
    }
    const noneGroup = grouped['__none__'] || []
    // if moving within No Section, use newOrder, else use existing noneGroup
    const noneToUse = sectionId === null ? newOrder : noneGroup
    for (const l of noneToUse.sort((a, b) => a.position - b.position))
      if (!orderedIds.includes(l.id)) orderedIds.push(l.id)
    // include any remaining links not in groups (should not happen)
    for (const l of links) if (!orderedIds.includes(l.id)) orderedIds.push(l.id)

    // optimistic update
    const updatedLinks = links.map((l) => {
      const idx = newOrder.findIndex((x) => x.id === l.id)
      if (idx !== -1) return { ...l, position: idx + 1 }
      return l
    })
    setLinks(updatedLinks as never)
    try {
      await api.linkReorder(orderedIds)
    } catch {
      await reload()
    }
  }

  const noSectionLinks = links.filter((l) => !l.sectionId).sort((a, b) => a.position - b.position)
  const hasSections = sections.length > 0
  const hasLinks = links.length > 0

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.16em] text-primary">
            Profile content
          </p>
          <h2 className="mt-1 text-3xl font-bold tracking-tight">Links</h2>
          <p className="mt-1 text-sm text-muted-foreground">
            Add, organize, and prioritize the places you want to share.
          </p>
        </div>
        <button
          onClick={() => setShowAddSection((v) => !v)}
          className="inline-flex items-center gap-2 rounded-xl bg-primary px-4 py-2.5 text-sm font-medium text-primary-foreground hover:bg-primary/90"
        >
          <Plus className="h-4 w-4" /> Add Section
        </button>
      </div>

      <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_340px]">
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
                setLinkForm({ title: '', url: '', icon: 'link', sectionId: '', showLocation: true })
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

      {/* Sections */}
      {hasSections ? (
        <DndContext
          sensors={sectionSensors}
          collisionDetection={closestCenter}
          onDragEnd={handleSectionReorder}
        >
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
                    {secLinks.length === 0 ? (
                      <div className="text-center py-4 space-y-2 border-2 border-dashed rounded-lg">
                        <p className="text-sm text-muted-foreground">
                          No links in this section yet.
                        </p>
                        <p className="text-xs text-muted-foreground">
                          Use the form above and select "{sec.title}" as section.
                        </p>
                      </div>
                    ) : (
                      <DndContext
                        sensors={linkSensors}
                        collisionDetection={closestCenter}
                        onDragEnd={(e) => handleLinkDragEnd(e, sec.id)}
                      >
                        <SortableContext
                          items={secLinks.map((l) => l.id)}
                          strategy={verticalListSortingStrategy}
                        >
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
                                    sectionId: l.sectionId || '',
                                    showLocation: parseSmartMetadata(l)?.showLocation ?? true,
                                  })
                                  window.scrollTo({ top: 0, behavior: 'smooth' })
                                }}
                                onToggle={() => toggleLink(l.id)}
                                onDelete={() => deleteLink(l.id)}
                              />
                            ))}
                          </div>
                        </SortableContext>
                      </DndContext>
                    )}
                    {secLinks.length > 0 && (
                      <p className="text-xs text-muted-foreground">
                        {secLinks.length} link{secLinks.length !== 1 ? 's' : ''} • Drag to reorder
                        within section
                      </p>
                    )}
                  </SortableSection>
                )
              })}
            </div>
          </SortableContext>
        </DndContext>
      ) : hasLinks ? null : null}

      {/* No Section links */}
      <div className="space-y-2">
        <h3 className="font-semibold flex items-center gap-2">
          <LinkIcon className="h-4 w-4" /> {hasSections ? 'No Section' : 'Your Links'}{' '}
          <span className="text-xs font-normal text-muted-foreground">
            ({noSectionLinks.length})
          </span>
        </h3>
        {noSectionLinks.length === 0 ? (
          hasSections ? (
            <p className="text-sm text-muted-foreground card p-4 text-center">
              No unsectioned links. All links are inside sections, or create one above.
            </p>
          ) : (
            <p className="text-sm text-muted-foreground">
              No links yet. Add your first link above.
            </p>
          )
        ) : (
          <DndContext
            sensors={linkSensors}
            collisionDetection={closestCenter}
            onDragEnd={(e) => handleLinkDragEnd(e, null)}
          >
            <SortableContext
              items={noSectionLinks.map((l) => l.id)}
              strategy={verticalListSortingStrategy}
            >
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
                        sectionId: l.sectionId || '',
                        showLocation: parseSmartMetadata(l)?.showLocation ?? true,
                      })
                      window.scrollTo({ top: 0, behavior: 'smooth' })
                    }}
                    onToggle={() => toggleLink(l.id)}
                    onDelete={() => deleteLink(l.id)}
                  />
                ))}
              </div>
            </SortableContext>
          </DndContext>
        )}
      </div>
        </div>

        <aside className="w-full min-w-0 lg:sticky lg:top-6 lg:self-start">
          <p className="mb-3 text-xs font-semibold uppercase tracking-[0.16em] text-muted-foreground">
            Live preview
          </p>
          {previewElement}
        </aside>
      </div>
    </div>
  )
}
