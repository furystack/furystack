import { createComponent, Shade } from '@furystack/shades'
import type { MenuEntry } from '@furystack/shades-common-components'
import { Button, Dropdown, PageContainer, PageHeader, Paper, Typography } from '@furystack/shades-common-components'
import { ObservableValue } from '@furystack/utils'

const basicItems: MenuEntry[] = [
  { key: 'cut', label: 'Cut', icon: <span>✂️</span> },
  { key: 'copy', label: 'Copy', icon: <span>📋</span> },
  { key: 'paste', label: 'Paste', icon: <span>📌</span> },
  { type: 'divider' },
  { key: 'select-all', label: 'Select All' },
]

const groupedItems: MenuEntry[] = [
  {
    type: 'group',
    key: 'file-group',
    label: 'File',
    children: [
      { key: 'new-file', label: 'New File', icon: <span>📄</span> },
      { key: 'open', label: 'Open', icon: <span>📂</span> },
      { key: 'save', label: 'Save', icon: <span>💾</span> },
    ],
  },
  { type: 'divider' },
  {
    type: 'group',
    key: 'edit-group',
    label: 'Edit',
    children: [
      { key: 'undo', label: 'Undo', icon: <span>↩️</span> },
      { key: 'redo', label: 'Redo', icon: <span>↪️</span> },
    ],
  },
]

const withDisabledItems: MenuEntry[] = [
  { key: 'view', label: 'View', icon: <span>👁️</span> },
  { key: 'edit', label: 'Edit', icon: <span>✏️</span> },
  { key: 'delete', label: 'Delete', icon: <span>🗑️</span>, disabled: true },
  { type: 'divider' },
  { key: 'share', label: 'Share', icon: <span>🔗</span> },
]

const BasicDropdownDemo = Shade({
  shadowDomName: 'basic-dropdown-demo',
  render: ({ useDisposable, useObservable }) => {
    const lastSelected$ = useDisposable('lastSelected', () => new ObservableValue(''))
    const [lastSelected] = useObservable('lastSelectedValue', lastSelected$)

    return (
      <div>
        <div style={{ display: 'flex', gap: '16px', alignItems: 'center', flexWrap: 'wrap' }}>
          <Dropdown items={basicItems} onSelect={(key) => lastSelected$.setValue(key)}>
            <Button variant="outlined">Actions</Button>
          </Dropdown>
          <Dropdown items={basicItems} onSelect={(key) => lastSelected$.setValue(key)} placement="bottomRight">
            <Button variant="outlined">Bottom Right</Button>
          </Dropdown>
        </div>
        {lastSelected && (
          <p style={{ marginTop: '8px', fontSize: '14px', opacity: '0.6' }}>Last selected: {lastSelected}</p>
        )}
      </div>
    )
  },
})

export const DropdownPage = Shade({
  shadowDomName: 'shades-dropdown-page',
  render: () => {
    return (
      <PageContainer maxWidth="900px" centered>
        <PageHeader
          icon="🔽"
          title="Dropdown"
          description="Trigger-anchored dropdown menus. Supports groups, dividers, disabled items, icons, keyboard navigation, and multiple placements."
        />

        <Paper elevation={3} style={{ padding: '32px', marginBottom: '24px' }}>
          <Typography variant="h3">Basic Dropdown</Typography>
          <Typography variant="body1" style={{ opacity: '0.7', marginBottom: '16px' }}>
            Click the button to open a dropdown menu.
          </Typography>
          <BasicDropdownDemo />
        </Paper>

        <Paper elevation={3} style={{ padding: '32px', marginBottom: '24px' }}>
          <Typography variant="h3">Grouped Items</Typography>
          <Typography variant="body1" style={{ opacity: '0.7', marginBottom: '16px' }}>
            Dropdown items can be organized into labeled groups.
          </Typography>
          <Dropdown items={groupedItems} onSelect={(key) => console.log('Selected:', key)}>
            <Button variant="contained" color="primary">
              File Menu
            </Button>
          </Dropdown>
        </Paper>

        <Paper elevation={3} style={{ padding: '32px', marginBottom: '24px' }}>
          <Typography variant="h3">With Disabled Items</Typography>
          <Typography variant="body1" style={{ opacity: '0.7', marginBottom: '16px' }}>
            Individual items can be disabled while others remain interactive.
          </Typography>
          <Dropdown items={withDisabledItems} onSelect={(key) => console.log('Selected:', key)}>
            <Button variant="outlined" color="warning">
              More Options
            </Button>
          </Dropdown>
        </Paper>

        <Paper elevation={3} style={{ padding: '32px' }}>
          <Typography variant="h3">Disabled Dropdown</Typography>
          <Typography variant="body1" style={{ opacity: '0.7', marginBottom: '16px' }}>
            The entire dropdown can be disabled, preventing it from opening.
          </Typography>
          <Dropdown items={basicItems} disabled>
            <Button variant="outlined" disabled>
              Disabled
            </Button>
          </Dropdown>
        </Paper>
      </PageContainer>
    )
  },
})
