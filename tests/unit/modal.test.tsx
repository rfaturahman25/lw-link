import { describe, it, expect, vi } from 'vitest'
import { act, fireEvent, render, screen } from '@testing-library/react'
import Modal from '@frontend/components/ui/Modal'

describe('Modal', () => {
  it('renders nothing when closed', () => {
    render(
      <Modal open={false} onClose={() => {}} title="Hidden">
        content
      </Modal>
    )
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
  })

  it('renders an accessible dialog and closes via the close button', () => {
    const onClose = vi.fn()
    render(
      <Modal open onClose={onClose} title="Add Link">
        content
      </Modal>
    )
    const dialog = screen.getByRole('dialog')
    expect(dialog).toHaveAttribute('aria-modal', 'true')
    expect(dialog).toHaveAccessibleName('Add Link')
    fireEvent.click(screen.getByRole('button', { name: /close dialog/i }))
    expect(onClose).toHaveBeenCalledTimes(1)
  })

  it('closes on Escape', () => {
    const onClose = vi.fn()
    render(
      <Modal open onClose={onClose} title="T">
        x
      </Modal>
    )
    fireEvent.keyDown(document, { key: 'Escape' })
    expect(onClose).toHaveBeenCalledTimes(1)
  })

  it('ignores Escape and disables close while busy', () => {
    const onClose = vi.fn()
    render(
      <Modal open onClose={onClose} title="T" busy>
        x
      </Modal>
    )
    fireEvent.keyDown(document, { key: 'Escape' })
    expect(onClose).not.toHaveBeenCalled()
    expect(screen.getByRole('button', { name: /close dialog/i })).toBeDisabled()
  })

  it('restores focus to the trigger when it closes', () => {
    const trigger = document.createElement('button')
    document.body.appendChild(trigger)
    trigger.focus()
    const { rerender } = render(
      <Modal open onClose={() => {}} title="T">
        x
      </Modal>
    )
    rerender(
      <Modal open={false} onClose={() => {}} title="T">
        x
      </Modal>
    )
    expect(document.activeElement).toBe(trigger)
    trigger.remove()
  })

  it('plays an exit animation before unmounting', () => {
    vi.useFakeTimers()
    try {
      const { rerender } = render(
        <Modal open onClose={() => {}} title="T">
          x
        </Modal>
      )
      expect(screen.getByRole('dialog').className).toContain('modal-panel-in')

      rerender(
        <Modal open={false} onClose={() => {}} title="T">
          x
        </Modal>
      )
      // Still mounted, now running the out-animation.
      expect(screen.getByRole('dialog').className).toContain('modal-panel-out')

      act(() => {
        vi.advanceTimersByTime(400)
      })
      expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
    } finally {
      vi.useRealTimers()
    }
  })
})
