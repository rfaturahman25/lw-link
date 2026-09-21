import { closestCenter } from '@dnd-kit/core'
import type { CollisionDetection } from '@dnd-kit/core'
import { UNSECTIONED_GROUP } from '../../themes'

type DroppableLike = { id: string | number; data?: { current?: unknown } }

export function droppableType(container: { data?: { current?: unknown } }): string | undefined {
  return (container.data?.current as { type?: string } | undefined)?.type
}

// Resolve which section a dragged link should land in.
//
// The unsectioned group is itself a sortable node whose id is the
// `UNSECTIONED_GROUP` sentinel, so hovering its header must map to `null` (no
// section) rather than the literal sentinel — otherwise the update is rejected
// as an invalid section and the link snaps back.
export function resolveTargetSection(
  overData: { type?: string; sectionId?: string | null } | undefined,
  overId: string | number,
  fallback: string | null
): string | null {
  if (overData?.type === 'link' || overData?.type === 'container') {
    return overData.sectionId ?? null
  }
  if (overData?.type === 'section') {
    const key = String(overId)
    return key === UNSECTIONED_GROUP ? null : key
  }
  return fallback
}

// Pick the droppables a drag may snap to.
//
// Sections contain nested link/container droppables, so with a plain
// `closestCenter` the section's own children are the closest centers for most of
// the drag and `over` resolves back to the active section — the reorder never
// commits. For a section drag we therefore only consider other sections. For
// every drag we drop the active node so `over` is always a real target.
export function selectDroppables<T extends DroppableLike>(
  containers: T[],
  active: { id: string | number; type: string | undefined }
): T[] {
  const withoutActive = containers.filter((c) => c.id !== active.id)
  if (active.type !== 'section') return withoutActive
  const sectionsOnly = withoutActive.filter((c) => droppableType(c) === 'section')
  return sectionsOnly.length > 0 ? sectionsOnly : withoutActive
}

export const linksCollisionDetection: CollisionDetection = (args) => {
  const containers = selectDroppables(args.droppableContainers, {
    id: args.active.id,
    type: droppableType({ data: args.active.data }),
  })
  return closestCenter({ ...args, droppableContainers: containers })
}
