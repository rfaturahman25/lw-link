import { describe, it, expect } from 'vitest'
import { droppableType, selectDroppables } from '@frontend/components/links/dndCollision'

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
