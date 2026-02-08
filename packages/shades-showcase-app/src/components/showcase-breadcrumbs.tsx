import { createComponent, LocationService, Shade, type ExtractRoutePaths } from '@furystack/shades'
import { createBreadcrumb, type BreadcrumbItem } from '@furystack/shades-common-components'
import type { appRoutes } from '../routes.tsx'
import { findNavItemByPath } from '../navigation.js'

type AppRoutePath = ExtractRoutePaths<typeof appRoutes>

const getBreadcrumbItems = (currentPath: string): Array<BreadcrumbItem<AppRoutePath>> => {
  if (currentPath === '/') return []

  // Check navigation config first
  const navItem = findNavItemByPath(currentPath)
  if (navItem) {
    const items: Array<BreadcrumbItem<AppRoutePath>> = [
      {
        path: `/${navItem.category.slug}` as AppRoutePath,
        label: navItem.category.label,
      },
    ]
    if ('page' in navItem) {
      items.push({
        path: `/${navItem.category.slug}/${navItem.page.slug}` as AppRoutePath,
        label: navItem.page.label,
      })
    }
    return items
  }

  // Handle layout-tests (not in navigation config)
  if (currentPath.startsWith('/layout-tests')) {
    const items: Array<BreadcrumbItem<AppRoutePath>> = [{ path: '/layout-tests', label: 'Layout Tests' }]

    const layoutTestLabels: Partial<Record<string, string>> = {
      '/layout-tests/appbar-only': 'AppBar Only',
      '/layout-tests/appbar-left-drawer': 'AppBar + Left Drawer',
      '/layout-tests/appbar-right-drawer': 'AppBar + Right Drawer',
      '/layout-tests/appbar-both-drawers': 'AppBar + Both Drawers',
      '/layout-tests/collapsible-drawer': 'Collapsible Drawer',
      '/layout-tests/auto-hide-appbar': 'Auto-hide AppBar',
      '/layout-tests/responsive-layout': 'Responsive Layout',
      '/layout-tests/temporary-drawer': 'Temporary Drawer',
    }

    const subLabel = layoutTestLabels[currentPath]
    if (subLabel) {
      items.push({ path: currentPath as AppRoutePath, label: subLabel })
    }

    return items
  }

  return []
}

const ShowcaseBreadcrumbItem = createBreadcrumb<typeof appRoutes>()

export const ShowcaseBreadcrumbComponent = Shade({
  tagName: 'showcase-breadcrumb-component',
  render: ({ injector, useObservable }) => {
    const locationService = injector.getInstance(LocationService)
    const [currentPath] = useObservable('currentPath', locationService.onLocationPathChanged)
    const breadcrumbItems = getBreadcrumbItems(currentPath)

    return <ShowcaseBreadcrumbItem homeItem={{ path: '/', label: '🏠' }} items={breadcrumbItems} separator=" › " />
  },
})
