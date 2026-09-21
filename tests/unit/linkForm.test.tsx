import { describe, it, expect, vi } from 'vitest'
import { act, fireEvent, render, screen } from '@testing-library/react'
import LinkForm from '@frontend/components/links/LinkForm'
import {
  emptyLinkForm,
  linkFormFromLink,
  validateLinkForm,
} from '@frontend/components/links/linkFormModel'

describe('linkFormModel', () => {
  it('validates title and url like the server', () => {
    expect(validateLinkForm(emptyLinkForm())).toEqual({
      title: 'Title is required.',
      url: 'URL is required.',
    })
    expect(validateLinkForm({ ...emptyLinkForm(), title: 'x', url: 'notaurl' }).url).toBeTruthy()
    expect(validateLinkForm({ ...emptyLinkForm(), title: 'x', url: 'mailto:a@b.com' })).toEqual({})
    expect(validateLinkForm({ ...emptyLinkForm(), title: 'x', url: 'https://a.com' })).toEqual({})
  })

  it('defaults new links to centred text', () => {
    expect(emptyLinkForm().align).toBe('center')
  })

  it('maps a location link, including the hidden-location flag', () => {
    const v = linkFormFromLink({
      id: '1',
      title: 'Office',
      url: 'https://maps.google.com/x',
      icon: null,
      type: 'location',
      metadata: JSON.stringify({ showLocation: false }),
      sectionId: 's1',
      align: 'center',
    })
    expect(v.icon).toBe('link')
    expect(v.sectionId).toBe('s1')
    expect(v.align).toBe('center')
    expect(v.showLocation).toBe(false)
  })
})

describe('LinkForm', () => {
  const base = {
    formId: 'test-link',
    errors: {},
    sections: [{ id: 's1', title: 'Social' }],
    uploadingThumb: false,
    onChange: vi.fn(),
    onUploadThumbnail: vi.fn(),
    onSubmit: vi.fn(),
  }

  it('renders the shared fields and the section options', () => {
    render(<LinkForm {...base} values={emptyLinkForm()} />)
    expect(screen.getByLabelText('Title')).toBeInTheDocument()
    expect(screen.getByLabelText('URL')).toBeInTheDocument()
    expect(screen.getByRole('option', { name: 'Social' })).toBeInTheDocument()
  })

  it('recognises a Maps URL and offers the location toggle', () => {
    render(
      <LinkForm
        {...base}
        values={{ ...emptyLinkForm(), url: 'https://maps.google.com/place/x' }}
      />
    )
    expect(screen.getByText(/Location Smart Link/i)).toBeInTheDocument()
    expect(screen.getByText(/Show location info/i)).toBeInTheDocument()
  })

  it('previews the resolved location for a Maps URL before saving', async () => {
    vi.useFakeTimers()
    try {
      const resolveLocation = vi.fn().mockResolvedValue({
        type: 'location',
        metadata: { placeName: 'Titik Seduh Heritage', address: 'Jalan Melawai I, Jakarta' },
      })
      render(
        <LinkForm
          {...base}
          values={{ ...emptyLinkForm(), url: 'https://maps.google.com/place/x' }}
          resolveLocation={resolveLocation}
        />
      )
      // Shows a loading state while the server resolves the coordinates.
      expect(screen.getByText(/Resolving location/)).toBeInTheDocument()
      expect(resolveLocation).not.toHaveBeenCalled()

      await act(async () => {
        vi.advanceTimersByTime(900)
      })

      expect(resolveLocation).toHaveBeenCalledWith('https://maps.google.com/place/x')
      expect(screen.getByText('Titik Seduh Heritage')).toBeInTheDocument()
      expect(screen.getByText('Jalan Melawai I, Jakarta')).toBeInTheDocument()
    } finally {
      vi.useRealTimers()
    }
  })

  it('reports field changes to the parent', () => {
    const onChange = vi.fn()
    render(<LinkForm {...base} onChange={onChange} values={emptyLinkForm()} />)
    fireEvent.change(screen.getByLabelText('Title'), { target: { value: 'Hello' } })
    expect(onChange).toHaveBeenCalledWith({ title: 'Hello' })
  })
})
