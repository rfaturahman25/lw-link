import { describe, it, expect } from 'vitest'
import { fireEvent, render, screen } from '@testing-library/react'
import ShareCard from '@frontend/components/profile/ShareCard'

describe('ShareCard disclosure', () => {
  it('starts collapsed and animates open on click', () => {
    render(<ShareCard profileUrl="https://example.com/@jane" />)

    const trigger = screen.getByRole('button', { name: /share profile/i })
    expect(trigger).toHaveAttribute('aria-expanded', 'false')

    const panel = document.getElementById(trigger.getAttribute('aria-controls') as string)
    expect(panel).not.toBeNull()
    // Collapsed via the grid-rows technique (animatable to intrinsic height).
    expect(panel?.className).toContain('grid-rows-[0fr]')

    fireEvent.click(trigger)

    expect(trigger).toHaveAttribute('aria-expanded', 'true')
    expect(panel?.className).toContain('grid-rows-[1fr]')
    expect(screen.getByRole('button', { name: /copy link/i })).toBeInTheDocument()
    expect(screen.getByRole('link', { name: /qr code/i })).toBeInTheDocument()
  })

  it('collapses again on a second click', () => {
    render(<ShareCard profileUrl="https://example.com/@jane" />)
    const trigger = screen.getByRole('button', { name: /share profile/i })
    fireEvent.click(trigger)
    fireEvent.click(trigger)
    expect(trigger).toHaveAttribute('aria-expanded', 'false')
  })
})
