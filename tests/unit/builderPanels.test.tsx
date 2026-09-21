import { describe, it, expect, vi } from 'vitest'
import { fireEvent, render, screen } from '@testing-library/react'
import ContentPanel from '@frontend/components/builder/ContentPanel'
import ThemePanel from '@frontend/components/builder/ThemePanel'
import type { ProfileDraft } from '@frontend/hooks/useProfileDraft'
import type { StoredThemeConfig } from '@frontend/themes'

vi.mock('@frontend/services/api', () => ({
  api: {
    meUpdate: vi.fn().mockResolvedValue({ success: true, data: { username: 'jane' } }),
    uploadImage: vi.fn().mockResolvedValue({ data: { url: '/media/x.png' } }),
  },
}))

vi.mock('@frontend/hooks/useAuth', () => ({
  useAuth: () => ({ user: { id: 'u1', username: 'jane', displayName: 'Jane', avatarUrl: null, role: 'user' } }),
}))

const themeConfig: StoredThemeConfig = { themeId: 'mesh', overrides: {} }

function draft(overrides: Partial<ProfileDraft> = {}): ProfileDraft {
  return {
    displayName: 'Jane',
    bio: '',
    theme: 'default',
    published: true,
    colorPalette: null,
    logoUrl: null,
    headerStyle: 'classic',
    bannerUrl: null,
    themeConfig,
    socials: [],
    ...overrides,
  }
}

const noop = () => {}

describe('ContentPanel publishing + profile image', () => {
  it('exposes publishing as a prominent, unmistakable switch', () => {
    const patch = vi.fn()
    vi.spyOn(window, 'confirm').mockReturnValue(true)
    render(
      <ContentPanel
        draft={draft()}
        patch={patch}
        setThemeConfig={noop}
        socialErrors={{}}
        setSocials={noop}
        links={[]}
        onManageLinks={noop}
      />
    )
    expect(screen.getByText('Published')).toBeInTheDocument()
    expect(screen.getByText('Your profile is visible on your public page.')).toBeInTheDocument()
    const toggle = screen.getByRole('switch', { name: 'Unpublish profile' })
    expect(toggle).toHaveAttribute('aria-checked', 'true')
    fireEvent.click(toggle)
    expect(patch).toHaveBeenCalledWith({ published: false })
  })

  it('shows the unpublished state clearly', () => {
    render(
      <ContentPanel
        draft={draft({ published: false })}
        patch={noop}
        setThemeConfig={noop}
        socialErrors={{}}
        setSocials={noop}
        links={[]}
        onManageLinks={noop}
      />
    )
    expect(screen.getByText('Unpublished')).toBeInTheDocument()
    expect(
      screen.getByText('Your profile is currently hidden from the public.')
    ).toBeInTheDocument()
  })

  it('only allows uploading the profile image (no external URL input)', () => {
    render(
      <ContentPanel
        draft={draft()}
        patch={noop}
        setThemeConfig={noop}
        socialErrors={{}}
        setSocials={noop}
        links={[]}
        onManageLinks={noop}
      />
    )
    expect(screen.getByText('Profile image')).toBeInTheDocument()
    expect(screen.getByText(/Supported formats: JPG, PNG, WebP/)).toBeInTheDocument()
    // No free-text image URL field anywhere in the classic header layout.
    expect(screen.queryByPlaceholderText(/https:\/\/\.\.\. or upload/)).not.toBeInTheDocument()
  })
})

describe('ThemePanel controls', () => {
  const baseProps = {
    config: themeConfig,
    onChange: vi.fn(),
    headerStyle: 'classic' as const,
    onHeaderStyleChange: vi.fn(),
    bannerUrl: null,
    onBannerUrlChange: vi.fn(),
  }

  it('offers a banner upload only for the hero / banner header styles', () => {
    const { rerender } = render(
      <ThemePanel {...baseProps} hasSocials onConfigureSocials={noop} />
    )
    fireEvent.click(screen.getByRole('button', { name: /Profile/ }))
    expect(screen.queryByText('Banner image')).not.toBeInTheDocument()

    rerender(
      <ThemePanel {...baseProps} headerStyle="hero" hasSocials onConfigureSocials={noop} />
    )
    expect(screen.getByText('Banner image')).toBeInTheDocument()
    expect(screen.getByText('Upload banner')).toBeInTheDocument()
  })

  it('lists the new retro / earthy themes', () => {
    render(<ThemePanel {...baseProps} hasSocials onConfigureSocials={noop} />)
    expect(screen.getByRole('button', { name: 'Earthy Vintage theme' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Retro Minimal theme' })).toBeInTheDocument()
    expect(screen.queryByRole('button', { name: 'Neo Brutalist theme' })).not.toBeInTheDocument()
  })

  it('no longer offers the duplicate "Framed avatar" header style', () => {
    render(<ThemePanel {...baseProps} hasSocials onConfigureSocials={noop} />)
    fireEvent.click(screen.getByRole('button', { name: /Profile/ }))
    expect(screen.getByText('Classic')).toBeInTheDocument()
    expect(screen.getByText('Hero')).toBeInTheDocument()
    expect(screen.getByText('Banner')).toBeInTheDocument()
    expect(screen.queryByText('Framed avatar')).not.toBeInTheDocument()
  })

  it('disables the social icon style and offers a CTA when there are no socials', () => {
    const onConfigureSocials = vi.fn()
    render(<ThemePanel {...baseProps} hasSocials={false} onConfigureSocials={onConfigureSocials} />)
    fireEvent.click(screen.getByRole('button', { name: /Social icons/ }))
    expect(screen.getByRole('group', { name: 'Social icon style' })).toHaveAttribute(
      'aria-disabled',
      'true'
    )
    fireEvent.click(screen.getByRole('button', { name: 'Add social link' }))
    expect(onConfigureSocials).toHaveBeenCalledTimes(1)
  })

  it('renders each font option in its own typeface', () => {
    const onChange = vi.fn()
    render(<ThemePanel {...baseProps} onChange={onChange} hasSocials onConfigureSocials={noop} />)
    fireEvent.click(screen.getByRole('button', { name: /Typography/ }))
    const poppins = screen.getByRole('option', { name: /Poppins/ })
    expect(poppins).toHaveStyle({ fontFamily: "'Poppins', system-ui, sans-serif" })
    fireEvent.click(poppins)
    expect(onChange).toHaveBeenCalled()
  })
})
