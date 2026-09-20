import { useDashboardContext } from './DashboardLayout'
import { useAuth } from '../../hooks/useAuth'
import VisualBuilder from '../../components/builder/VisualBuilder'
import type { BuilderMode } from '../../components/builder/types'

// The visual profile builder. Rendered full-screen (fixed overlay) from inside
// the dashboard route so it reuses the dashboard's already-loaded data + reload
// without duplicating any fetching or introducing a second data layer.
// `initialMode="links"` opens the full-width links workspace directly.
export default function BuilderPage({ initialMode = 'design' }: { initialMode?: BuilderMode }) {
  const { profile, links, sections, socials, reload } = useDashboardContext()
  const { user } = useAuth()

  return (
    <VisualBuilder
      profile={profile}
      user={user}
      links={links}
      sections={sections}
      socials={socials}
      reload={reload}
      initialMode={initialMode}
    />
  )
}
