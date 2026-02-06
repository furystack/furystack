import type { ExtractRoutePaths } from '@furystack/shades'
import { createComponent, LocationService, Shade } from '@furystack/shades'
import type { BreadcrumbItem } from '@furystack/shades-common-components'
import { AppBar, createAppBarLink, createBreadcrumb } from '@furystack/shades-common-components'

import type { appRoutes } from '../routes.tsx'
import { ThemeSwitch } from './theme-switch.js'

type AppRoutePath = ExtractRoutePaths<typeof appRoutes>

const getBreadcrumbItems = (currentPath: string): Array<BreadcrumbItem<AppRoutePath>> => {
  const routeLabels: Partial<Record<AppRoutePath, string>> = {
    '/buttons': 'Buttons',
    '/inputs': 'Inputs',
    '/form': 'Form',
    '/grid': 'Grid',
    '/nipple': 'Nipple',
    '/lottie': 'Lottie',
    '/monaco': 'Monaco',
    '/wizard': 'Wizard',
    '/notys': 'Notys',
    '/tabs': 'Tabs',
    '/i18n': 'I18N',
    '/mfe': 'MFE',
    '/misc': 'Misc',
  }

  if (currentPath === '/') return []

  const label = routeLabels[currentPath as AppRoutePath]
  if (label) {
    return [{ path: currentPath as AppRoutePath, label }]
  }

  if (currentPath.startsWith('/layout-tests')) {
    const items: Array<BreadcrumbItem<AppRoutePath>> = [{ path: '/layout-tests', label: 'Layout Tests' }]

    const layoutTestLabels: Partial<Record<AppRoutePath, string>> = {
      '/layout-tests/appbar-only': 'AppBar Only',
      '/layout-tests/appbar-left-drawer': 'AppBar + Left Drawer',
      '/layout-tests/appbar-right-drawer': 'AppBar + Right Drawer',
      '/layout-tests/appbar-both-drawers': 'AppBar + Both Drawers',
      '/layout-tests/collapsible-drawer': 'Collapsible Drawer',
      '/layout-tests/auto-hide-appbar': 'Auto-hide AppBar',
      '/layout-tests/responsive-layout': 'Responsive Layout',
      '/layout-tests/temporary-drawer': 'Temporary Drawer',
    }

    const subLabel = layoutTestLabels[currentPath as AppRoutePath]
    if (subLabel) {
      items.push({ path: currentPath as AppRoutePath, label: subLabel })
    }

    return items
  }

  return []
}

// Create type-safe components constrained to the app routes
const ShowcaseAppBarLinks = createAppBarLink<typeof appRoutes>()
const ShowcaseBreadcrumb = createBreadcrumb<typeof appRoutes>()

/**
 * Main navigation AppBar for the showcase application.
 * Contains links to all top-level pages and the theme switcher.
 */
export const ShowcaseAppBar = Shade({
  shadowDomName: 'showcase-app-bar',
  render: ({ injector, useObservable }) => {
    const locationService = injector.getInstance(LocationService)
    const [currentPath] = useObservable('currentPath', locationService.onLocationPathChanged)
    const breadcrumbItems = getBreadcrumbItems(currentPath)

    return (
      <AppBar>
        <h3 style={{ margin: '0', paddingLeft: '16px' }}>Showcase App</h3>
        {breadcrumbItems.length > 0 && (
          <div style={{ paddingLeft: '16px', fontSize: '0.9em' }}>
            <ShowcaseBreadcrumb homeItem={{ path: '/', label: '🏠' }} items={breadcrumbItems} separator=" › " />
          </div>
        )}
        <div
          style={{
            display: 'flex',
            height: '32px',
            paddingLeft: '16px',
            gap: '4px',
            overflow: 'hidden',
            overflowX: 'auto',
          }}
        >
          <ShowcaseAppBarLinks href="/">Home</ShowcaseAppBarLinks>
          <ShowcaseAppBarLinks href="/buttons">Buttons</ShowcaseAppBarLinks>
          <ShowcaseAppBarLinks href="/inputs">Inputs</ShowcaseAppBarLinks>
          <ShowcaseAppBarLinks href="/form">Form</ShowcaseAppBarLinks>
          <ShowcaseAppBarLinks href="/grid">Grid</ShowcaseAppBarLinks>
          <ShowcaseAppBarLinks href="/nipple">Nipple</ShowcaseAppBarLinks>
          <ShowcaseAppBarLinks href="/lottie">Lottie</ShowcaseAppBarLinks>
          <ShowcaseAppBarLinks href="/monaco">Monaco</ShowcaseAppBarLinks>
          <ShowcaseAppBarLinks href="/wizard">Wizard</ShowcaseAppBarLinks>
          <ShowcaseAppBarLinks href="/notys">Notys</ShowcaseAppBarLinks>
          <ShowcaseAppBarLinks href="/tabs">Tabs</ShowcaseAppBarLinks>
          <ShowcaseAppBarLinks href="/i18n">I18N</ShowcaseAppBarLinks>
          <ShowcaseAppBarLinks href="/mfe">MFE</ShowcaseAppBarLinks>
          <ShowcaseAppBarLinks href="/misc">Misc</ShowcaseAppBarLinks>
          <ShowcaseAppBarLinks href="/layout-tests" routingOptions={{ end: false }}>
            Layout Tests
          </ShowcaseAppBarLinks>
        </div>
        <ThemeSwitch />
      </AppBar>
    )
  },
})
