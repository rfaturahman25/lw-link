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

function SortableLinkItem({ link, onEdit, onToggle, onDelete }: { link: { id: string; title: string; url: string; icon: string | null; enabled: boolean }; onEdit: () => void; onToggle: () => void; onDelete: () => void }) {
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

export default function LinksPage() {
  const { links, reload, setLinks } = useDashboardContext()
  const [linkForm, setLinkForm] = useState({ title: '', url: '', icon: 'link' })
  const [editingId, setEditingId] = useState<string | null>(null)

  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 6 } }), useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }))

  const addLink = async (e: React.FormEvent) => {
    e.preventDefault()
    if (editingId) {
      await api.linkUpdate(editingId, { title: linkForm.title, url: linkForm.url, icon: linkForm.icon || null })
      setEditingId(null)
    } else {
      await api.linkCreate({ title: linkForm.title, url: linkForm.url, icon: linkForm.icon || null })
    }
    setLinkForm({ title: '', url: '', icon: 'link' })
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

  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event
    if (!over || active.id === over.id) return
    const oldIndex = links.findIndex((l) => l.id === active.id)
    const newIndex = links.findIndex((l) => l.id === over.id)
    if (oldIndex === -1 || newIndex === -1) return
    const newOrder = arrayMove(links, oldIndex, newIndex)
    setLinks(newOrder)
    try {
      await api.linkReorder(newOrder.map((l) => l.id))
    } catch {
      await reload()
    }
  }

  return (
    <div className="space-y-4">
      <h2 className="text-2xl font-bold">Links</h2>
      <form onSubmit={addLink} className="card p-4 space-y-3">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <input value={linkForm.title} onChange={(e) => setLinkForm({ ...linkForm, title: e.target.value })} placeholder="Title (e.g. WhatsApp)" className="input" required />
          <input value={linkForm.url} onChange={(e) => setLinkForm({ ...linkForm, url: e.target.value })} placeholder="https://..." className="input" required />
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
            <button type="button" onClick={() => { setEditingId(null); setLinkForm({ title: '', url: '', icon: 'link' }) }} className="rounded-md border px-4 py-2 text-sm hover:bg-accent">
              Cancel
            </button>
          )}
        </div>
        <p className="text-xs text-muted-foreground">Drag the handle on the left of each link to reorder. Use ON/OFF to hide without deleting.</p>
      </form>

      <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
        <SortableContext items={links.map((l) => l.id)} strategy={verticalListSortingStrategy}>
          <div className="space-y-2">
            {links.map((l) => (
              <SortableLinkItem key={l.id} link={l} onEdit={() => { setEditingId(l.id); setLinkForm({ title: l.title, url: l.url, icon: l.icon || 'link' }) }} onToggle={() => toggleLink(l.id)} onDelete={() => deleteLink(l.id)} />
            ))}
            {links.length === 0 && <p className="text-sm text-muted-foreground">No links yet. Add your first link above.</p>}
          </div>
        </SortableContext>
      </DndContext>
    </div>
  )
}
