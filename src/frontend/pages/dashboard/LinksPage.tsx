import { useState } from 'react'
import { useDashboardContext } from './DashboardLayout'
import { api } from '../../services/api'
import { DndContext, closestCenter, PointerSensor, useSensor, useSensors, KeyboardSensor, DragEndEvent } from '@dnd-kit/core'
import { SortableContext, verticalListSortingStrategy, arrayMove, useSortable, sortableKeyboardCoordinates } from '@dnd-kit/sortable'
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
  MessageCircle,
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
} from 'lucide-react'

const ICON_OPTIONS = [
  { value: 'link', label: 'Link', icon: LinkIcon },
  { value: 'instagram', label: 'Instagram', icon: Instagram },
  { value: 'whatsapp', label: 'WhatsApp', icon: MessageCircle },
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
  whatsapp: <MessageCircle className="h-5 w-5" />,
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

function SortableLinkItem({ link, onEdit, onToggle, onDelete }: { link: { id: string; title: string; url: string; icon: string | null; enabled: boolean; sectionId: string | null }; onEdit: () => void; onToggle: () => void; onDelete: () => void }) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: link.id })
  const style: React.CSSProperties = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.6 : 1,
  }
  return (
    <div ref={setNodeRef} style={style} className={`card p-3 flex items-center gap-2 ${isDragging ? 'shadow-lg ring-2 ring-primary/20' : ''}`}>
      <button {...attributes} {...listeners} className="shrink-0 rounded p-1.5 hover:bg-accent text-muted-foreground cursor-grab active:cursor-grabbing touch-none" aria-label="Drag to reorder">
        <GripVertical className="h-4 w-4" />
      </button>
      <div className="h-9 w-9 rounded-lg bg-primary/10 flex items-center justify-center text-primary shrink-0">{iconMap[link.icon || 'link'] || iconMap.default}</div>
      <div className="flex-1 min-w-0">
        <p className="font-medium truncate text-sm">
          {link.title} {link.enabled ? '' : '(disabled)'}
        </p>
        <p className="text-xs text-muted-foreground truncate">{link.url}</p>
      </div>
      <div className="flex items-center gap-1 shrink-0">
        <button onClick={onEdit} className="rounded border px-2 py-1 text-xs hover:bg-accent">
          Edit
        </button>
        <button onClick={onToggle} className={`rounded px-2 py-1 text-xs font-medium ${link.enabled ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700'}`}>
          {link.enabled ? 'ON' : 'OFF'}
        </button>
        <button onClick={onDelete} className="rounded bg-red-50 px-2 py-1 text-xs text-red-700 hover:bg-red-100">
          Delete
        </button>
      </div>
    </div>
  )
}

function SortableSection({ section, children, onEdit, onDelete }: { section: { id: string; title: string }; children: React.ReactNode; onEdit: (id: string, title: string) => void; onDelete: (id: string) => void }) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: section.id })
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
    <div ref={setNodeRef} style={style} className={`card p-4 space-y-3 ${isDragging ? 'shadow-lg ring-2 ring-primary/20' : ''}`}>
      <div className="flex items-center gap-2">
        <button {...attributes} {...listeners} className="shrink-0 rounded p-1 hover:bg-accent text-muted-foreground cursor-grab active:cursor-grabbing">
          <GripVertical className="h-4 w-4" />
        </button>
        <Folder className="h-4 w-4 text-primary" />
        {editing ? (
          <input value={title} onChange={(e) => setTitle(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && handleSave()} onBlur={handleSave} autoFocus className="input h-7 text-sm font-semibold flex-1" />
        ) : (
          <h3 className="font-semibold flex-1">{section.title}</h3>
        )}
        <div className="flex items-center gap-1">
          {!editing && (
            <button onClick={() => setEditing(true)} className="rounded p-1 hover:bg-accent text-muted-foreground">
              <Edit2 className="h-4 w-4" />
            </button>
          )}
          <button onClick={() => onDelete(section.id)} className="rounded p-1 hover:bg-accent text-muted-foreground">
            <Trash2 className="h-4 w-4" />
          </button>
        </div>
      </div>
      <div className="space-y-2">{children}</div>
    </div>
  )
}

export default function LinksPage() {
  const { links, sections, reload, setLinks } = useDashboardContext() as unknown as { links: Array<{ id: string; title: string; url: string; icon: string | null; enabled: boolean; sectionId: string | null; position: number }>; sections: Array<{ id: string; title: string; position: number }>; reload: () => Promise<void>; setLinks: React.Dispatch<React.SetStateAction<any[]>> }
  const [linkForm, setLinkForm] = useState({ title: '', url: '', icon: 'link', sectionId: '' as string })
  const [editingId, setEditingId] = useState<string | null>(null)
  const [newSectionTitle, setNewSectionTitle] = useState('')
  const [showAddSection, setShowAddSection] = useState(false)

  const sectionSensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 6 } }), useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }))
  const linkSensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 6 } }))

  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 6 } }), useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }))

  const handleAddSection = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!newSectionTitle.trim()) return
    await api.sectionCreate(newSectionTitle.trim())
    setNewSectionTitle('')
    setShowAddSection(false)
    await reload()
  }

  const handleEditSection = async (id: string, title: string) => {
    await api.sectionUpdate(id, title)
    await reload()
  }

  const handleDeleteSection = async (id: string) => {
    const sec = sections.find((s) => s.id === id)
    const count = links.filter((l) => l.sectionId === id).length
    const msg = count > 0 ? `Delete "${sec?.title}"?\n\nThis section contains ${count} link${count > 1 ? 's' : ''}.\n\nWhat should happen to these links?\n\n[OK] = Move links to No Section\n[Cancel] = Cancel` : `Delete "${sec?.title}"?`
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

  const addLink = async (e: React.FormEvent) => {
    e.preventDefault()
    const payload: Record<string, unknown> = { title: linkForm.title, url: linkForm.url, icon: linkForm.icon || null, sectionId: linkForm.sectionId || null }
    if (editingId) {
      await api.linkUpdate(editingId, payload)
      setEditingId(null)
    } else {
      await api.linkCreate(payload)
    }
    setLinkForm({ title: '', url: '', icon: 'link', sectionId: '' })
    await reload()
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
    const sectionLinks = links.filter((l) => l.sectionId === sectionId).sort((a, b) => a.position - b.position)
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
    for (const l of noneToUse.sort((a, b) => a.position - b.position)) if (!orderedIds.includes(l.id)) orderedIds.push(l.id)
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
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold">Links</h2>
        <button onClick={() => setShowAddSection((v) => !v)} className="inline-flex items-center gap-2 rounded-md bg-primary px-3 py-1.5 text-sm font-medium text-primary-foreground hover:bg-primary/90">
          <Plus className="h-4 w-4" /> Add Section
        </button>
      </div>

      {showAddSection && (
        <form onSubmit={handleAddSection} className="card p-4 flex gap-2">
          <input value={newSectionTitle} onChange={(e) => setNewSectionTitle(e.target.value)} placeholder="Section title (e.g. Social Media)" className="input flex-1" required autoFocus />
          <button type="submit" className="rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground">Create</button>
          <button type="button" onClick={() => setShowAddSection(false)} className="rounded-md border px-4 py-2 text-sm">Cancel</button>
        </form>
      )}

      {!hasSections && !hasLinks && (
        <div className="card p-8 text-center space-y-3">
          <Folder className="h-10 w-10 mx-auto text-muted-foreground" />
          <h3 className="font-semibold">Organize your links into sections</h3>
          <p className="text-sm text-muted-foreground">Create sections to make your Linktree easier to navigate.</p>
          <button onClick={() => setShowAddSection(true)} className="inline-flex items-center gap-2 rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground">
            <Plus className="h-4 w-4" /> Create Section
          </button>
        </div>
      )}

      <form onSubmit={addLink} className="card p-4 space-y-3">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <input value={linkForm.title} onChange={(e) => setLinkForm({ ...linkForm, title: e.target.value })} placeholder="Title (e.g. WhatsApp)" className="input" required />
          <input value={linkForm.url} onChange={(e) => setLinkForm({ ...linkForm, url: e.target.value })} placeholder="https://..." className="input" required />
        </div>
        <div className="space-y-2">
          <label className="text-sm font-medium">Section</label>
          <select value={linkForm.sectionId} onChange={(e) => setLinkForm({ ...linkForm, sectionId: e.target.value })} className="input">
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
            {ICON_OPTIONS.map((opt) => {
              const Icon = opt.icon
              const selected = linkForm.icon === opt.value
              return (
                <button
                  key={opt.value}
                  type="button"
                  onClick={() => setLinkForm({ ...linkForm, icon: opt.value })}
                  className={`flex flex-col items-center gap-1 rounded-lg border p-2 text-xs hover:bg-accent ${selected ? 'bg-primary text-primary-foreground border-primary shadow' : 'bg-background'}`}
                  title={opt.label}
                >
                  <Icon className="h-5 w-5" />
                  <span className="truncate w-full text-center text-[10px] leading-none">{opt.label}</span>
                </button>
              )
            })}
          </div>
          <p className="text-xs text-muted-foreground">Choose the icon that appears next to your link (WhatsApp, Instagram, Google Sheet, etc.). Saved as <code className="bg-muted px-1 rounded">{linkForm.icon}</code></p>
        </div>
        <div className="flex gap-2">
          <button type="submit" className="inline-flex items-center justify-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 shadow">
            {editingId ? 'Update link' : '+ Add link'}
          </button>
          {editingId && (
            <button type="button" onClick={() => { setEditingId(null); setLinkForm({ title: '', url: '', icon: 'link', sectionId: '' }) }} className="rounded-md border px-4 py-2 text-sm hover:bg-accent">
              Cancel
            </button>
          )}
        </div>
        <p className="text-xs text-muted-foreground">Drag the handle on the left of each link to reorder. Use ON/OFF to hide without deleting.</p>
      </form>

      {/* Sections */}
      {hasSections ? (
        <DndContext sensors={sectionSensors} collisionDetection={closestCenter} onDragEnd={handleSectionReorder}>
          <SortableContext items={sections.map((s) => s.id)} strategy={verticalListSortingStrategy}>
            <div className="space-y-4">
              {sections.map((sec) => {
                const secLinks = links.filter((l) => l.sectionId === sec.id).sort((a, b) => a.position - b.position)
                return (
                  <SortableSection key={sec.id} section={sec} onEdit={handleEditSection} onDelete={handleDeleteSection}>
                    {secLinks.length === 0 ? (
                      <div className="text-center py-4 space-y-2 border-2 border-dashed rounded-lg">
                        <p className="text-sm text-muted-foreground">No links in this section yet.</p>
                        <p className="text-xs text-muted-foreground">Use the form above and select "{sec.title}" as section.</p>
                      </div>
                    ) : (
                      <DndContext sensors={linkSensors} collisionDetection={closestCenter} onDragEnd={(e) => handleLinkDragEnd(e, sec.id)}>
                        <SortableContext items={secLinks.map((l) => l.id)} strategy={verticalListSortingStrategy}>
                          <div className="space-y-2">
                            {secLinks.map((l) => (
                              <SortableLinkItem
                                key={l.id}
                                link={l as never}
                                onEdit={() => {
                                  setEditingId(l.id)
                                  setLinkForm({ title: l.title, url: l.url, icon: l.icon || 'link', sectionId: l.sectionId || '' })
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
                    {secLinks.length > 0 && <p className="text-xs text-muted-foreground">{secLinks.length} link{secLinks.length !== 1 ? 's' : ''} • Drag to reorder within section</p>}
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
          <LinkIcon className="h-4 w-4" /> {hasSections ? 'No Section' : 'Your Links'} <span className="text-xs font-normal text-muted-foreground">({noSectionLinks.length})</span>
        </h3>
        {noSectionLinks.length === 0 ? (
          hasSections ? (
            <p className="text-sm text-muted-foreground card p-4 text-center">No unsectioned links. All links are inside sections, or create one above.</p>
          ) : (
            <p className="text-sm text-muted-foreground">No links yet. Add your first link above.</p>
          )
        ) : (
          <DndContext sensors={linkSensors} collisionDetection={closestCenter} onDragEnd={(e) => handleLinkDragEnd(e, null)}>
            <SortableContext items={noSectionLinks.map((l) => l.id)} strategy={verticalListSortingStrategy}>
              <div className="space-y-2">
                {noSectionLinks.map((l) => (
                  <SortableLinkItem
                    key={l.id}
                    link={l as never}
                    onEdit={() => {
                      setEditingId(l.id)
                      setLinkForm({ title: l.title, url: l.url, icon: l.icon || 'link', sectionId: l.sectionId || '' })
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
  )
}
