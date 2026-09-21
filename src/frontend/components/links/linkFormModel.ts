import { parseSmartMetadata } from '../profile/smartLink'

export type LinkFormValues = {
  title: string
  url: string
  icon: string
  align: 'left' | 'center' | 'right'
  sectionId: string
  showLocation: boolean
  showUrl: boolean
  thumbnail: string
}

export type LinkFormErrors = { title?: string; url?: string }

export type LinkFormLink = {
  id: string
  title: string
  url: string
  icon: string | null
  align?: string | null
  type?: string | null
  metadata?: string | null
  showUrl?: boolean | null
  thumbnail?: string | null
  sectionId: string | null
}

export const LINK_FORM_ID = 'link-form'

export function emptyLinkForm(): LinkFormValues {
  return {
    title: '',
    url: '',
    icon: 'link',
    // New links default to centred text, matching the public profile's default look.
    align: 'center',
    sectionId: '',
    showLocation: true,
    showUrl: true,
    thumbnail: '',
  }
}

export function linkFormFromLink(link: LinkFormLink): LinkFormValues {
  return {
    title: link.title,
    url: link.url,
    icon: link.icon || 'link',
    align: (link.align as LinkFormValues['align']) || 'left',
    sectionId: link.sectionId || '',
    showLocation: parseSmartMetadata(link)?.showLocation ?? true,
    showUrl: link.showUrl !== false,
    thumbnail: link.thumbnail || '',
  }
}

// Mirrors the server-side link rules so errors surface before the request.
export function validateLinkForm(values: LinkFormValues): LinkFormErrors {
  const errs: LinkFormErrors = {}
  if (!values.title.trim()) errs.title = 'Title is required.'
  const url = values.url.trim()
  if (!url) errs.url = 'URL is required.'
  else if (!/^(https?:\/\/|mailto:|tel:|sms:).+/i.test(url))
    errs.url = 'URL must start with http://, https://, mailto:, tel: or sms:'
  return errs
}
