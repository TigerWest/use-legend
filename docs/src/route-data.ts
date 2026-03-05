import { defineRouteMiddleware } from '@astrojs/starlight/route-data'

const DOCS_ENABLE_NATIVE_TAB = process.env.DOCS_ENABLE_NATIVE_TAB === '1'

const SIDEBAR_LABEL_BY_SECTION = {
  guides: 'Guides',
  core: 'Core',
  web: 'Web',
  native: 'Native',
  integrations: 'Integrations',
} as const

type DocsSection = keyof typeof SIDEBAR_LABEL_BY_SECTION

function getSectionFromRouteId(routeId: string): DocsSection | null {
  const firstSegment = routeId.split('/').filter(Boolean)[0]
  if (!firstSegment) return null
  if (firstSegment === 'native' && !DOCS_ENABLE_NATIVE_TAB) return null

  return firstSegment in SIDEBAR_LABEL_BY_SECTION
    ? (firstSegment as DocsSection)
    : null
}

export const onRequest = defineRouteMiddleware(context => {
  const activeSection = getSectionFromRouteId(context.locals.starlightRoute.id)
  if (!activeSection) return

  const targetLabel = SIDEBAR_LABEL_BY_SECTION[activeSection]
  const filteredSidebar = context.locals.starlightRoute.sidebar.filter(entry => entry.label === targetLabel)

  context.locals.starlightRoute.sidebar = filteredSidebar
  context.locals.starlightRoute.hasSidebar = filteredSidebar.length > 0
})
