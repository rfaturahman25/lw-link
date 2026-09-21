import { describe, it, expect } from 'vitest'
import { droppableType, resolveTargetSection, selectDroppables } from '@frontend/components/links/dndCollision'
import { UNSECTIONED_GROUP } from '@frontend/themes'

const container = (id: string, type?: string) => ({
  id,
  data: { current: type ? { type } : undefined },
})

describe('droppableType', () => {
  it('reads the dnd-kit data type', () => {
    expect(droppableType(container('a', 'section'))).toBe('section')
    expect(droppableType(container('b'))).toBeUndefined()
  })
})

describe('selectDroppables', () => {
  it('never offers the active node as a target', () => {
    const list = [container('a', 'link'), container('b', 'link')]
    expect(selectDroppables(list, { id: 'a', type: 'link' }).map((c) => c.id)).toEqual(['b'])
  })

  it('restricts a section drag to the other sections', () => {
    const list = [
      container('s1', 'section'),
      container('l1', 'link'),
      container('c1', 'container'),
      container('s2', 'section'),
    ]
    expect(selectDroppables(list, { id: 's1', type: 'section' }).map((c) => c.id)).toEqual(['s2'])
  })

  it('keeps nested link/container targets for a link drag (cross-section moves)', () => {
    const list = [container('l1', 'link'), container('c1', 'container'), container('s2', 'section')]
    expect(selectDroppables(list, { id: 'l0', type: 'link' }).map((c) => c.id)).toEqual([
      'l1',
      'c1',
      's2',
    ])
  })

  it('falls back to non-active droppables when there are no other sections', () => {
    const list = [container('s1', 'section'), container('l1', 'link')]
    expect(selectDroppables(list, { id: 's1', type: 'section' }).map((c) => c.id)).toEqual(['l1'])
  })
})

describe('resolveTargetSection', () => {
  it('drops onto a section header', () => {
    expect(resolveTargetSection({ type: 'section' }, 's2', null)).toBe('s2')
  })

  it('drops onto a link or container inside a section', () => {
    expect(resolveTargetSection({ type: 'link', sectionId: 's2' }, 'l1', 's1')).toBe('s2')
    expect(resolveTargetSection({ type: 'container', sectionId: null }, 'c1', 's1')).toBeNull()
  })

  it('maps the unsectioned group header to "no section", not the sentinel id', () => {
    // Regression: returning the literal `__none__` made the update fail as an
    // invalid section, so links could never be dragged out of a section.
    expect(resolveTargetSection({ type: 'section' }, UNSECTIONED_GROUP, 's1')).toBeNull()
  })

  it('keeps the source section when the drop target is unknown', () => {
    expect(resolveTargetSection(undefined, 'x', 's1')).toBe('s1')
  })
})
