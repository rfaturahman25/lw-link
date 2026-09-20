import { describe, it, expect, vi, beforeEach } from 'vitest'
import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import LinksManager from '@frontend/components/links/LinksManager'

const mocks = vi.hoisted(() => ({
  linkCreate: vi.fn().mockResolvedValue({ success: true }),
  linkUpdate: vi.fn().mockResolvedValue({ success: true }),
  linkToggle: vi.fn().mockResolvedValue({ success: true }),
  linkDelete: vi.fn().mockResolvedValue({ success: true }),
  linkReorder: vi.fn().mockResolvedValue({ success: true }),
  uploadImage: vi.fn(),
  sectionCreate: vi.fn(),
  sectionUpdate: vi.fn(),
  sectionDelete: vi.fn(),
  reload: vi.fn().mockResolvedValue(undefined),
}))

vi.mock('@frontend/services/api', () => ({
  api: {
    linkCreate: mocks.linkCreate,
    linkUpdate: mocks.linkUpdate,
    linkToggle: mocks.linkToggle,
    linkDelete: mocks.linkDelete,
    linkReorder: mocks.linkReorder,
    uploadImage: mocks.uploadImage,
    sectionCreate: mocks.sectionCreate,
    sectionUpdate: mocks.sectionUpdate,
    sectionDelete: mocks.sectionDelete,
  },
}))

vi.mock('@frontend/pages/dashboard/DashboardLayout', () => ({
  useDashboardContext: () => ({
    links: [
      {
        id: 'l1',
        title: 'My Website',
        url: 'https://example.com',
        icon: 'link',
        enabled: true,
        sectionId: null,
        position: 0,
      },
    ],
    sections: [],
    reload: mocks.reload,
    setLinks: vi.fn(),
    setSections: vi.fn(),
  }),
}))

describe('LinksManager add/edit modal', () => {
  beforeEach(() => {
    mocks.linkCreate.mockClear()
    mocks.linkUpdate.mockClear()
    mocks.reload.mockClear()
  })

  it('opens an empty Add Link dialog from the header CTA', () => {
    render(<LinksManager embedded />)
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
    fireEvent.click(screen.getByRole('button', { name: /add link/i }))
    expect(screen.getByRole('dialog')).toHaveAccessibleName('Add Link')
    expect(screen.getByLabelText('Title')).toHaveValue('')
  })

  it('opens the same dialog pre-filled when editing a link', () => {
    render(<LinksManager embedded />)
    fireEvent.click(screen.getByRole('button', { name: 'Edit' }))
    expect(screen.getByRole('dialog')).toHaveAccessibleName('Edit Link')
    expect(screen.getByLabelText('Title')).toHaveValue('My Website')
    expect(screen.getByLabelText('URL')).toHaveValue('https://example.com')
  })

  it('saves an edited link and closes the dialog', async () => {
    render(<LinksManager embedded />)
    fireEvent.click(screen.getByRole('button', { name: 'Edit' }))
    fireEvent.change(screen.getByLabelText('Title'), { target: { value: 'Updated' } })
    const form = screen.getByRole('dialog').querySelector('form')
    expect(form).not.toBeNull()
    fireEvent.submit(form as HTMLFormElement)
    await waitFor(() => expect(mocks.linkUpdate).toHaveBeenCalledTimes(1))
    expect(mocks.linkUpdate).toHaveBeenCalledWith(
      'l1',
      expect.objectContaining({ title: 'Updated', url: 'https://example.com' })
    )
    await waitFor(() => expect(screen.queryByRole('dialog')).not.toBeInTheDocument())
  })

  it('blocks submission with a validation error and keeps the dialog open', async () => {
    render(<LinksManager embedded />)
    fireEvent.click(screen.getByRole('button', { name: /add link/i }))
    const form = screen.getByRole('dialog').querySelector('form')
    fireEvent.submit(form as HTMLFormElement)
    expect(await screen.findByText('Title is required.')).toBeInTheDocument()
    expect(mocks.linkCreate).not.toHaveBeenCalled()
    expect(screen.getByRole('dialog')).toBeInTheDocument()
  })
})
