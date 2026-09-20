import { describe, it, expect, vi, beforeEach } from 'vitest'
import { act, render, renderHook, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { useProfileDraft } from '@frontend/hooks/useProfileDraft'
import VisualBuilder from '@frontend/components/builder/VisualBuilder'

const mocks = vi.hoisted(() => ({
  put: vi.fn().mockResolvedValue({ success: true }),
  socialsPut: vi.fn().mockResolvedValue({ success: true }),
  publish: vi.fn().mockResolvedValue({ success: true }),
}))

vi.mock('@frontend/services/api', () => ({
  api: {
    profilePut: mocks.put,
    profileSocialsPut: mocks.socialsPut,
    profilePublish: mocks.publish,
  },
}))

// The links workspace reads the dashboard outlet context; provide a minimal one.
vi.mock('@frontend/pages/dashboard/DashboardLayout', () => ({
  useDashboardContext: () => ({
    links: [],
    sections: [],
    reload: vi.fn().mockResolvedValue(undefined),
    setLinks: vi.fn(),
    setSections: vi.fn(),
  }),
}))

const profile = {
  bio: 'Hello',
  theme: 'default',
  published: true,
  colorPalette: null,
  logoUrl: null,
  headerStyle: 'classic',
  bannerUrl: null,
  themeConfig: JSON.stringify({ themeId: 'mesh' }),
  user: { displayName: 'Jane', avatarUrl: null },
}
const user = { displayName: 'Jane', username: 'jane', avatarUrl: null }
const socials = [{ platform: 'instagram', value: '@jane', enabled: true, position: 0 }]

function setup(overrides: Partial<Parameters<typeof useProfileDraft>[0]> = {}) {
  const reload = vi.fn().mockResolvedValue(undefined)
  const hook = renderHook(
    (props: Parameters<typeof useProfileDraft>[0]) => useProfileDraft(props),
    { initialProps: { profile, user, socials, reload, ...overrides } }
  )
  return { ...hook, reload }
}

describe('useProfileDraft', () => {
  beforeEach(() => {
    mocks.put.mockClear()
    mocks.socialsPut.mockClear()
    mocks.publish.mockClear()
  })

  it('starts clean and reports dirty after an edit', () => {
    const { result } = setup()
    expect(result.current.dirty).toBe(false)
    expect(result.current.form.displayName).toBe('Jane')
    expect(result.current.form.themeConfig.themeId).toBe('mesh')

    act(() => result.current.patch({ displayName: 'Jane Doe' }))
    expect(result.current.dirty).toBe(true)

    act(() => result.current.reset())
    expect(result.current.dirty).toBe(false)
    expect(result.current.form.displayName).toBe('Jane')
  })

  it('treats a theme tweak as a change and persists it on save', async () => {
    const { result, reload, rerender } = setup()
    act(() => result.current.setThemeConfig({ typeScale: 1.1, avatarSize: 'lg' }))
    expect(result.current.dirty).toBe(true)

    await act(async () => {
      await result.current.save()
    })

    expect(mocks.put).toHaveBeenCalledTimes(1)
    const payload = mocks.put.mock.calls[0][0] as {
      themeConfig: { typeScale: number; avatarSize: string }
    }
    expect(payload.themeConfig.typeScale).toBe(1.1)
    expect(payload.themeConfig.avatarSize).toBe('lg')
    expect(mocks.socialsPut).toHaveBeenCalledTimes(1)
    expect(mocks.publish).toHaveBeenCalledWith(true)
    expect(reload).toHaveBeenCalledTimes(1)

    // A real reload refetches the profile; simulate that and expect dirty to clear.
    rerender({
      profile: { ...profile, themeConfig: JSON.stringify(payload.themeConfig) },
      user,
      socials,
      reload,
    })
    expect(result.current.dirty).toBe(false)
  })

  it('blocks save when a social value is invalid', async () => {
    const { result } = setup()
    act(() =>
      result.current.setSocials([
        { id: 's1', platform: 'email', value: 'not-an-email', enabled: true },
      ])
    )
    await act(async () => {
      await result.current.save()
    })
    expect(mocks.put).not.toHaveBeenCalled()
    expect(result.current.saveMsg?.type).toBe('error')
  })

  it('requires a display name', async () => {
    const { result } = setup()
    act(() => result.current.patch({ displayName: '   ' }))
    await act(async () => {
      await result.current.save()
    })
    expect(mocks.put).not.toHaveBeenCalled()
    expect(result.current.saveMsg?.type).toBe('error')
  })
})

describe('VisualBuilder smoke', () => {
  it('renders the full-screen builder with the live canvas and toolbar', () => {
    render(
      <MemoryRouter>
        <VisualBuilder
          profile={profile}
          user={user}
          links={[]}
          sections={[]}
          socials={socials}
          reload={vi.fn().mockResolvedValue(undefined)}
        />
      </MemoryRouter>
    )
    expect(screen.getByText('Profile Builder')).toBeInTheDocument()
    // The public renderer is used as the canvas, so the profile name is visible.
    expect(screen.getAllByText('Jane').length).toBeGreaterThan(0)
    // Toolbar exposes real actions with accessible names.
    expect(screen.getByRole('button', { name: /save/i })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Theme' })).toBeInTheDocument()
  })

  it('opens the full-width links workspace in links mode', () => {
    render(
      <MemoryRouter>
        <VisualBuilder
          profile={profile}
          user={user}
          links={[]}
          sections={[]}
          socials={socials}
          reload={vi.fn().mockResolvedValue(undefined)}
          initialMode="links"
        />
      </MemoryRouter>
    )
    // The full links editor (sections + drag) replaces the canvas; no theme tabs.
    expect(screen.getByText(/Links & sections/i)).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /Add Section/i })).toBeInTheDocument()
    expect(screen.queryByRole('button', { name: 'Theme' })).not.toBeInTheDocument()
  })
})
