import { describe, it, expect, vi } from 'vitest'
import { fireEvent, render, screen } from '@testing-library/react'
import PublicProfileView from '@frontend/components/profile/PublicProfileView'
import {
  SOCIAL_META,
  SOCIAL_PLATFORMS,
  socialHref,
  validateSocialValue,
} from '@frontend/components/profile/socialMeta'
import { TikTokIcon } from '@frontend/components/icons/BrandIcons'
import { resolveSocialStyle, resolveTheme } from '@frontend/themes'

describe('social platform metadata', () => {
  it('includes the WhatsApp platform', () => {
    expect(SOCIAL_PLATFORMS).toContain('whatsapp')
  })

  it('uses the real TikTok brand glyph, not a music note', () => {
    expect(SOCIAL_META.tiktok.Icon).toBe(TikTokIcon)
    const { container } = render(<TikTokIcon />)
    const path = container.querySelector('path')?.getAttribute('d') ?? ''
    // The official silhouette starts with the characteristic note outline.
    expect(path.startsWith('M12.525.02')).toBe(true)
  })
})

describe('socialHref normalization', () => {
  it('resolves handles to platform URLs', () => {
    expect(socialHref('instagram', '@lensawaktu')).toBe('https://instagram.com/lensawaktu')
    expect(socialHref('tiktok', 'lensawaktu')).toBe('https://tiktok.com/@lensawaktu')
    expect(socialHref('linkedin', 'lensawaktu')).toBe('https://linkedin.com/in/lensawaktu')
  })

  it('leaves full URLs untouched', () => {
    expect(socialHref('instagram', 'https://instagram.com/lensawaktu')).toBe(
      'https://instagram.com/lensawaktu'
    )
  })

  it('handles whatsapp, email, phone and website', () => {
    expect(socialHref('whatsapp', '+62 812-3456-7890')).toBe('https://wa.me/6281234567890')
    expect(socialHref('email', 'a@b.com')).toBe('mailto:a@b.com')
    expect(socialHref('phone', '+62 812 3456')).toBe('tel:+628123456')
    expect(socialHref('website', 'example.com')).toBe('https://example.com')
  })
})

describe('validateSocialValue', () => {
  it('validates email format', () => {
    expect(validateSocialValue('email', 'not-an-email')).toBeTruthy()
    expect(validateSocialValue('email', 'a@b.com')).toBeNull()
  })

  it('validates phone/whatsapp leniently for international formats', () => {
    expect(validateSocialValue('whatsapp', '123')).toBeTruthy()
    expect(validateSocialValue('whatsapp', '+62 812 3456 7890')).toBeNull()
    expect(validateSocialValue('phone', '+1 (555) 123-4567')).toBeNull()
  })

  it('rejects handles containing spaces but accepts plain handles', () => {
    expect(validateSocialValue('instagram', '@lensawaktu')).toBeNull()
    expect(validateSocialValue('instagram', 'lensa waktu')).toBeTruthy()
  })

  it('requires a value', () => {
    expect(validateSocialValue('website', '   ')).toBeTruthy()
  })
})

describe('PublicProfileView social rendering', () => {
  it('renders accessible, correctly linked social icons', () => {
    render(
      <PublicProfileView
        displayName="Jane"
        links={[]}
        socials={[
          { platform: 'instagram', value: '@jane' },
          { platform: 'whatsapp', value: '+62 812 3456 7890' },
        ]}
        profileUrl="https://example.com/@jane"
        theme={resolveTheme({ themeId: 'mesh' })}
      />
    )
    expect(screen.getByLabelText(/instagram/i)).toHaveAttribute(
      'href',
      'https://instagram.com/jane'
    )
    expect(screen.getByLabelText(/whatsapp/i)).toHaveAttribute(
      'href',
      'https://wa.me/6281234567890'
    )
  })

  it('renders icon-only style and reports clicks when interactive', () => {
    const onSocialClick = vi.fn()
    render(
      <PublicProfileView
        displayName="Jane"
        links={[]}
        socials={[{ platform: 'whatsapp', value: '+62 812 3456 7890' }]}
        profileUrl="https://example.com/@jane"
        theme={resolveTheme({ themeId: 'mesh' })}
        socialStyle="plain"
        interactive
        onSocialClick={onSocialClick}
      />
    )
    const link = screen.getByLabelText(/whatsapp/i)
    expect(link.className).toContain('pp-social-plain')
    fireEvent.click(link)
    expect(onSocialClick).toHaveBeenCalledWith('whatsapp')
  })
})

describe('resolveSocialStyle', () => {
  it('defaults to circle and reads plain from config', () => {
    expect(resolveSocialStyle({ themeConfig: JSON.stringify({ themeId: 'mesh' }) })).toBe('circle')
    expect(
      resolveSocialStyle({ themeConfig: JSON.stringify({ themeId: 'mesh', socialStyle: 'plain' }) })
    ).toBe('plain')
  })
})
