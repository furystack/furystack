import { createComponent, Shade } from '@furystack/shades'
import type { MenuEntry } from '@furystack/shades-common-components'
import { Icon, icons, Menu, PageContainer, PageHeader, Paper, Typography } from '@furystack/shades-common-components'

const horizontalItems: MenuEntry[] = [
  { key: 'home', label: 'Home', icon: <Icon icon={icons.home} size="small" /> },
  { key: 'products', label: 'Products', icon: <Icon icon={icons.packageIcon} size="small" /> },
  { key: 'about', label: 'About', icon: <Icon icon={icons.info} size="small" /> },
  { key: 'contact', label: 'Contact', icon: <Icon icon={icons.envelope} size="small" /> },
  { type: 'divider' },
  { key: 'disabled', label: 'Disabled', disabled: true },
]

const verticalItems: MenuEntry[] = [
  { key: 'dashboard', label: 'Dashboard', icon: <Icon icon={icons.barChart} size="small" /> },
  { key: 'users', label: 'Users', icon: <Icon icon={icons.users} size="small" /> },
  { type: 'divider' },
  {
    type: 'group',
    key: 'admin-group',
    label: 'Administration',
    children: [
      { key: 'settings', label: 'Settings', icon: <Icon icon={icons.settings} size="small" /> },
      { key: 'logs', label: 'Logs', icon: <Icon icon={icons.fileText} size="small" /> },
      { key: 'restricted', label: 'Restricted', icon: <Icon icon={icons.lock} size="small" />, disabled: true },
    ],
  },
  { type: 'divider' },
  { key: 'logout', label: 'Log Out', icon: <Icon icon={icons.logOut} size="small" /> },
]

const inlineItems: MenuEntry[] = [
  { key: 'inbox', label: 'Inbox', icon: <Icon icon={icons.inbox} size="small" /> },
  { key: 'sent', label: 'Sent', icon: <Icon icon={icons.send} size="small" /> },
  {
    type: 'group',
    key: 'folders-group',
    label: 'Folders',
    children: [
      { key: 'work', label: 'Work', icon: <Icon icon={icons.briefcase} size="small" /> },
      { key: 'personal', label: 'Personal', icon: <Icon icon={icons.user} size="small" /> },
      { key: 'archive', label: 'Archive', icon: <Icon icon={icons.folder} size="small" /> },
    ],
  },
  {
    type: 'group',
    key: 'labels-group',
    label: 'Labels',
    children: [
      { key: 'important', label: 'Important', icon: <Icon icon={icons.star} size="small" /> },
      { key: 'urgent', label: 'Urgent', icon: <Icon icon={icons.circleDot} size="small" /> },
    ],
  },
]

const HorizontalMenuDemo = Shade({
  shadowDomName: 'horizontal-menu-demo',
  render: ({ useState }) => {
    const [selected, setSelected] = useState('selected', 'home')

    return (
      <div>
        <Menu items={horizontalItems} mode="horizontal" selectedKey={selected} onSelect={(key) => setSelected(key)} />
        <Typography variant="body1" style={{ marginTop: '8px', fontSize: '14px', opacity: '0.6' }}>
          Selected: {selected}
        </Typography>
      </div>
    )
  },
})

const VerticalMenuDemo = Shade({
  shadowDomName: 'vertical-menu-demo',
  render: ({ useState }) => {
    const [selected, setSelected] = useState('selected', 'dashboard')

    return (
      <div>
        <div style={{ maxWidth: '280px' }}>
          <Menu items={verticalItems} mode="vertical" selectedKey={selected} onSelect={(key) => setSelected(key)} />
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
  render: ({ useState }) => {
    const [selected, setSelected] = useState('selected', 'inbox')

    return (
      <div>
        <div style={{ maxWidth: '280px' }}>
          <Menu items={inlineItems} mode="inline" selectedKey={selected} onSelect={(key) => setSelected(key)} />
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
      <PageContainer centered>
        <PageHeader
          icon={<Icon icon={icons.clipboard} />}
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
