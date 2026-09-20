// Shared builder types. Kept in one module so the shell, panels, and toolbar
// don't import from each other just to agree on shapes.

export type BuilderMode = 'design' | 'links'

export type BuilderLink = {
  id: string
  title: string
  url: string
  icon: string | null
  align?: string | null
  type?: string | null
  metadata?: string | null
  showUrl?: boolean | null
  thumbnail?: string | null
  enabled: boolean
  sectionId: string | null
  position: number
}

export type BuilderSection = { id: string; title: string; position: number }
