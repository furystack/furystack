/**
 * Single source of truth for the showcase app navigation structure.
 * Drives routes, sidebar tree, AppBar category links, and breadcrumbs.
 */

export type NavPage = {
  label: string
  slug: string
}

export type NavCategory = {
  label: string
  slug: string
  icon: string
  children: NavPage[]
}

export const navigationConfig: NavCategory[] = [
  {
    label: 'Inputs & Forms',
    slug: 'inputs-and-forms',
    icon: '📝',
    children: [
      { label: 'Buttons', slug: 'buttons' },
      { label: 'Inputs', slug: 'inputs' },
      { label: 'Form', slug: 'form' },
    ],
  },
  {
    label: 'Data Display',
    slug: 'data-display',
    icon: '📊',
    children: [
      { label: 'Grid', slug: 'grid' },
      { label: 'List', slug: 'list' },
      { label: 'Tree', slug: 'tree' },
      { label: 'Avatar', slug: 'avatar' },
      { label: 'Breadcrumb', slug: 'breadcrumb' },
    ],
  },
  {
    label: 'Navigation',
    slug: 'navigation',
    icon: '🧭',
    children: [
      { label: 'Tabs', slug: 'tabs' },
      { label: 'Context Menu', slug: 'context-menu' },
      { label: 'Command Palette', slug: 'command-palette' },
      { label: 'Suggest', slug: 'suggest' },
    ],
  },
  {
    label: 'Feedback',
    slug: 'feedback',
    icon: '🔔',
    children: [{ label: 'Notifications', slug: 'notifications' }],
  },
  {
    label: 'Surfaces',
    slug: 'surfaces',
    icon: '🪟',
    children: [
      { label: 'Wizard', slug: 'wizard' },
      { label: 'FAB', slug: 'fab' },
    ],
  },
  {
    label: 'Integrations',
    slug: 'integrations',
    icon: '🔌',
    children: [
      { label: 'Monaco', slug: 'monaco' },
      { label: 'Lottie', slug: 'lottie' },
      { label: 'Nipple', slug: 'nipple' },
      { label: 'MFE', slug: 'mfe' },
      { label: 'I18N', slug: 'i18n' },
    ],
  },
  {
    label: 'Utilities',
    slug: 'utilities',
    icon: '🔧',
    children: [
      { label: 'Search State', slug: 'search-state' },
      { label: 'Stored State', slug: 'stored-state' },
    ],
  },
]

/**
 * Finds the category and page labels for a given path.
 * Used by breadcrumbs to auto-generate items from the navigation config.
 */
export const findNavItemByPath = (
  path: string,
): { category: NavCategory; page: NavPage } | { category: NavCategory } | undefined => {
  for (const category of navigationConfig) {
    if (path === `/${category.slug}` || path.startsWith(`/${category.slug}/`)) {
      const page = category.children.find((p) => path === `/${category.slug}/${p.slug}`)
      if (page) {
        return { category, page }
      }
      return { category }
    }
  }
  return undefined
}
