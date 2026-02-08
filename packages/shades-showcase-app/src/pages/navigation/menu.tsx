import { createComponent, Shade } from '@furystack/shades'
import type { MenuEntry } from '@furystack/shades-common-components'
import { Menu, PageContainer, PageHeader, Paper, Typography } from '@furystack/shades-common-components'
import { ObservableValue } from '@furystack/utils'

const horizontalItems: MenuEntry[] = [
  { key: 'home', label: 'Home', icon: <span>🏠</span> },
  { key: 'products', label: 'Products', icon: <span>📦</span> },
  { key: 'about', label: 'About', icon: <span>ℹ️</span> },
  { key: 'contact', label: 'Contact', icon: <span>📧</span> },
  { type: 'divider' },
  { key: 'disabled', label: 'Disabled', disabled: true },
]

const verticalItems: MenuEntry[] = [
  { key: 'dashboard', label: 'Dashboard', icon: <span>📊</span> },
  { key: 'users', label: 'Users', icon: <span>👥</span> },
  { type: 'divider' },
  {
    type: 'group',
    key: 'admin-group',
    label: 'Administration',
    children: [
      { key: 'settings', label: 'Settings', icon: <span>⚙️</span> },
      { key: 'logs', label: 'Logs', icon: <span>📝</span> },
      { key: 'restricted', label: 'Restricted', icon: <span>🔒</span>, disabled: true },
    ],
  },
  { type: 'divider' },
  { key: 'logout', label: 'Log Out', icon: <span>🚪</span> },
]

const inlineItems: MenuEntry[] = [
  { key: 'inbox', label: 'Inbox', icon: <span>📥</span> },
  { key: 'sent', label: 'Sent', icon: <span>📤</span> },
  {
    type: 'group',
    key: 'folders-group',
    label: 'Folders',
    children: [
      { key: 'work', label: 'Work', icon: <span>💼</span> },
      { key: 'personal', label: 'Personal', icon: <span>👤</span> },
      { key: 'archive', label: 'Archive', icon: <span>📁</span> },
    ],
  },
  {
    type: 'group',
    key: 'labels-group',
    label: 'Labels',
    children: [
      { key: 'important', label: 'Important', icon: <span>⭐</span> },
      { key: 'urgent', label: 'Urgent', icon: <span>🔴</span> },
    ],
  },
]

const HorizontalMenuDemo = Shade({
  shadowDomName: 'horizontal-menu-demo',
  render: ({ useDisposable, useObservable }) => {
    const selected$ = useDisposable('selected', () => new ObservableValue('home'))
    const [selected] = useObservable('selectedValue', selected$)

    return (
      <div>
        <Menu
          items={horizontalItems}
          mode="horizontal"
          selectedKey={selected}
          onSelect={(key) => selected$.setValue(key)}
        />
        <Typography variant="body1" style={{ marginTop: '8px', fontSize: '14px', opacity: '0.6' }}>
          Selected: {selected}
        </Typography>
      </div>
    )
  },
})

const VerticalMenuDemo = Shade({
  shadowDomName: 'vertical-menu-demo',
  render: ({ useDisposable, useObservable }) => {
    const selected$ = useDisposable('selected', () => new ObservableValue('dashboard'))
    const [selected] = useObservable('selectedValue', selected$)

    return (
      <div>
        <div style={{ maxWidth: '280px' }}>
          <Menu
            items={verticalItems}
            mode="vertical"
            selectedKey={selected}
            onSelect={(key) => selected$.setValue(key)}
          />
        </div>
        <Typography variant="body1" style={{ marginTop: '8px', fontSize: '14px', opacity: '0.6' }}>
          Selected: {selected}
        </Typography>
      </div>
    )
  },
})

const InlineMenuDemo = Shade({
  shadowDomName: 'inline-menu-demo',
  render: ({ useDisposable, useObservable }) => {
    const selected$ = useDisposable('selected', () => new ObservableValue('inbox'))
    const [selected] = useObservable('selectedValue', selected$)

    return (
      <div>
        <div style={{ maxWidth: '280px' }}>
          <Menu items={inlineItems} mode="inline" selectedKey={selected} onSelect={(key) => selected$.setValue(key)} />
        </div>
        <Typography variant="body1" style={{ marginTop: '8px', fontSize: '14px', opacity: '0.6' }}>
          Selected: {selected}
        </Typography>
      </div>
    )
  },
})

export const MenuPage = Shade({
  shadowDomName: 'shades-menu-page',
  render: () => {
    return (
      <PageContainer maxWidth="900px" centered>
        <PageHeader
          icon="📋"
          title="Menu"
          description="Navigation menus with horizontal, vertical, and inline modes. Supports groups, dividers, icons, keyboard navigation, and disabled items."
        />

        <Paper elevation={3} style={{ padding: '32px', marginBottom: '24px' }}>
          <Typography variant="h3">Horizontal Mode</Typography>
          <Typography variant="body1" style={{ opacity: '0.7', marginBottom: '16px' }}>
            Items flow left-to-right. Use ArrowLeft/ArrowRight for keyboard navigation.
          </Typography>
          <HorizontalMenuDemo />
        </Paper>

        <Paper elevation={3} style={{ padding: '32px', marginBottom: '24px' }}>
          <Typography variant="h3">Vertical Mode</Typography>
          <Typography variant="body1" style={{ opacity: '0.7', marginBottom: '16px' }}>
            Items stack vertically with group headers. Use ArrowUp/ArrowDown for keyboard navigation.
          </Typography>
          <VerticalMenuDemo />
        </Paper>

        <Paper elevation={3} style={{ padding: '32px' }}>
          <Typography variant="h3">Inline Mode</Typography>
          <Typography variant="body1" style={{ opacity: '0.7', marginBottom: '16px' }}>
            Like vertical mode, but groups are collapsible. Click a group header to expand or collapse it.
          </Typography>
          <InlineMenuDemo />
        </Paper>
      </PageContainer>
    )
  },
})
