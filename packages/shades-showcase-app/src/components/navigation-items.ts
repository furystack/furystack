import type { TreeNavigationItem } from '@furystack/shades-common-components'

/**
 * Navigation items for the showcase app
 * Organized hierarchically by category
 */
export const navigationItems: TreeNavigationItem[] = [
  {
    label: 'Home',
    path: '/',
    icon: '🏠',
  },
  {
    label: 'Components',
    icon: '🧩',
    children: [
      {
        label: 'Form Controls',
        children: [
          { label: 'Buttons', path: '/components/form-controls/buttons' },
          { label: 'Inputs', path: '/components/form-controls/inputs' },
          { label: 'Form', path: '/components/form-controls/form' },
        ],
      },
      {
        label: 'Data Display',
        children: [
          { label: 'Grid', path: '/components/data-display/grid' },
          { label: 'Tabs', path: '/components/data-display/tabs' },
        ],
      },
      {
        label: 'Feedback',
        children: [{ label: 'Notifications', path: '/components/feedback/notys' }],
      },
      {
        label: 'Surfaces',
        children: [{ label: 'Misc', path: '/components/surfaces/misc' }],
      },
    ],
  },
  {
    label: 'Layouts',
    icon: '📐',
    children: [
      { label: 'Overview', path: '/layouts' },
      {
        label: 'Layout Variants',
        children: [
          { label: 'AppBar Only', path: '/layouts/variants/appbar-only' },
          { label: 'AppBar + Left Drawer', path: '/layouts/variants/appbar-left-drawer' },
          { label: 'AppBar + Right Drawer', path: '/layouts/variants/appbar-right-drawer' },
          { label: 'AppBar + Both Drawers', path: '/layouts/variants/appbar-both-drawers' },
          { label: 'Collapsible Drawer', path: '/layouts/variants/collapsible-drawer' },
          { label: 'Auto-Hide AppBar', path: '/layouts/variants/auto-hide-appbar' },
          { label: 'Responsive Layout', path: '/layouts/variants/responsive-layout' },
          { label: 'Temporary Drawer', path: '/layouts/variants/temporary-drawer' },
        ],
      },
    ],
  },
  {
    label: 'Advanced',
    icon: '🚀',
    children: [
      { label: 'Monaco Editor', path: '/advanced/monaco' },
      { label: 'Lottie Animations', path: '/advanced/lottie' },
      { label: 'Nipple Controller', path: '/advanced/nipple' },
      { label: 'Micro Frontends', path: '/advanced/mfe' },
      { label: 'Internationalization', path: '/advanced/i18n' },
      { label: 'Wizard', path: '/advanced/wizard' },
    ],
  },
]
