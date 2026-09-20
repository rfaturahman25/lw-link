import {
  DndContext,
  closestCenter,
  PointerSensor,
  useSensor,
  useSensors,
  KeyboardSensor,
  type DragEndEvent,
} from '@dnd-kit/core'
import {
  SortableContext,
  verticalListSortingStrategy,
  arrayMove,
  useSortable,
  sortableKeyboardCoordinates,
} from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import { GripVertical, Plus, Trash2, Eye, EyeOff } from 'lucide-react'
import { MAX_SOCIALS, SOCIAL_PLATFORMS, SOCIAL_META, newSocialDraft, socialIcon } from './socialMeta'
import type { SocialDraft, SocialPlatform } from './socialMeta'

type RowProps = {
  item: SocialDraft
  error?: string
  onUpdate: (patch: Partial<SocialDraft>) => void
  onRemove: () => void
}

function SortableRow({ item, error, onUpdate, onRemove }: RowProps) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: item.id,
  })
  const style: React.CSSProperties = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.6 : 1,
  }
  const meta = SOCIAL_META[item.platform]

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`card rounded-xl p-3 ${isDragging ? 'shadow-lg ring-2 ring-primary/20' : ''}`}
    >
      <div className="flex flex-wrap items-center gap-2">
        <button
          {...attributes}
          {...listeners}
          type="button"
          aria-label="Drag to reorder"
          className="inline-flex h-10 w-10 shrink-0 cursor-grab touch-none items-center justify-center rounded text-muted-foreground hover:bg-accent active:cursor-grabbing"
        >
          <GripVertical className="h-4 w-4" />
        </button>
        <span className="shrink-0 text-muted-foreground" aria-hidden="true">
          {socialIcon(item.platform, 'h-4 w-4')}
        </span>
        <select
          value={item.platform}
          onChange={(e) => onUpdate({ platform: e.target.value as SocialPlatform })}
          aria-label="Platform"
          className="input h-10 w-[136px] shrink-0"
        >
          {SOCIAL_PLATFORMS.map((p) => (
            <option key={p} value={p}>
              {SOCIAL_META[p].label}
            </option>
          ))}
        </select>
        <input
          value={item.value}
          onChange={(e) => onUpdate({ value: e.target.value })}
          placeholder={meta.placeholder}
          aria-label={`${meta.label} value`}
          aria-invalid={!!error}
          className={`input h-10 min-w-[150px] flex-1 ${error ? 'border-red-400' : ''}`}
        />
        <button
          type="button"
          onClick={() => onUpdate({ enabled: !item.enabled })}
          aria-pressed={item.enabled}
          aria-label={item.enabled ? `Hide ${meta.label}` : `Show ${meta.label}`}
          title={item.enabled ? 'Shown on profile' : 'Hidden'}
          className={`inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-lg border transition-colors ${
            item.enabled ? 'bg-primary/10 text-primary' : 'text-muted-foreground hover:bg-accent'
          }`}
        >
          {item.enabled ? <Eye className="h-4 w-4" /> : <EyeOff className="h-4 w-4" />}
        </button>
        <button
          type="button"
          onClick={onRemove}
          aria-label={`Remove ${meta.label}`}
          className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded text-muted-foreground transition-colors hover:bg-accent hover:text-red-600"
        >
          <Trash2 className="h-4 w-4" />
        </button>
      </div>
      <p className="mt-1 pl-8 text-[11px] text-muted-foreground">{meta.hint}</p>
      {error && <p className="mt-1 pl-8 text-xs text-red-600">{error}</p>}
    </div>
  )
}

type Props = {
  items: SocialDraft[]
  onChange: (items: SocialDraft[]) => void
  errors?: Record<string, string>
}

export default function SocialsEditor({ items, onChange, errors = {} }: Props) {
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 6 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  )

  const update = (id: string, patch: Partial<SocialDraft>) =>
    onChange(items.map((it) => (it.id === id ? { ...it, ...patch } : it)))
  const remove = (id: string) => onChange(items.filter((it) => it.id !== id))
  const add = () => {
    if (items.length >= MAX_SOCIALS) return
    onChange([...items, newSocialDraft()])
  }
  const onDragEnd = (event: DragEndEvent) => {
    const { active, over } = event
    if (!over || active.id === over.id) return
    const oldIndex = items.findIndex((i) => i.id === active.id)
    const newIndex = items.findIndex((i) => i.id === over.id)
    if (oldIndex === -1 || newIndex === -1) return
    onChange(arrayMove(items, oldIndex, newIndex))
  }

  return (
    <div className="space-y-3">
      {items.length === 0 && (
        <p className="text-sm text-muted-foreground">
          No social/contact yet. Add a platform to show it as small icons on your public profile.
        </p>
      )}

      {items.length > 0 && (
        <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={onDragEnd}>
          <SortableContext items={items.map((i) => i.id)} strategy={verticalListSortingStrategy}>
            <div className="space-y-2">
              {items.map((item) => (
                <SortableRow
                  key={item.id}
                  item={item}
                  error={errors[item.id]}
                  onUpdate={(patch) => update(item.id, patch)}
                  onRemove={() => remove(item.id)}
                />
              ))}
            </div>
          </SortableContext>
        </DndContext>
      )}

      <div className="flex items-center justify-between gap-3">
        <button
          type="button"
          onClick={add}
          disabled={items.length >= MAX_SOCIALS}
          className="inline-flex items-center gap-2 rounded-xl border px-4 py-2.5 text-sm font-medium hover:bg-accent disabled:opacity-50"
        >
          <Plus className="h-4 w-4" /> Add Social/Contact
        </button>
        <span className="text-xs text-muted-foreground">
          {items.length}/{MAX_SOCIALS}
        </span>
      </div>
      <p className="text-xs text-muted-foreground">
        Drag to reorder. Use the eye icon to show/hide without removing.
      </p>
    </div>
  )
}
