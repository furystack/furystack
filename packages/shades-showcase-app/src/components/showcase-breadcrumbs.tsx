import { createComponent, LocationService, Shade, type ExtractRoutePaths } from '@furystack/shades'
import { createBreadcrumb, type BreadcrumbItem } from '@furystack/shades-common-components'
import type { appRoutes } from '../routes.tsx'

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
const ShowcaseBreadcrumbItem = createBreadcrumb<typeof appRoutes>()

export const ShowcaseBreadcrumbComponent = Shade({
  shadowDomName: 'showcase-breadcrumb-component',
  render: ({ injector, useObservable }) => {
    const locationService = injector.getInstance(LocationService)
    const [currentPath] = useObservable('currentPath', locationService.onLocationPathChanged)
    const breadcrumbItems = getBreadcrumbItems(currentPath)

    return <ShowcaseBreadcrumbItem homeItem={{ path: '/', label: '🏠' }} items={breadcrumbItems} separator=" › " />
  },
})
