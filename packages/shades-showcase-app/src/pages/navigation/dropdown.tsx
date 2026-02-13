import { createComponent, Shade } from '@furystack/shades'
import type { MenuEntry } from '@furystack/shades-common-components'
import {
  Button,
  Dropdown,
  Icon,
  icons,
  PageContainer,
  PageHeader,
  Paper,
  Typography,
} from '@furystack/shades-common-components'

const basicItems: MenuEntry[] = [
  { key: 'cut', label: 'Cut', icon: <Icon icon={icons.cut} size="small" /> },
  { key: 'copy', label: 'Copy', icon: <Icon icon={icons.clipboard} size="small" /> },
  { key: 'paste', label: 'Paste', icon: <Icon icon={icons.paste} size="small" /> },
  { type: 'divider' },
  { key: 'select-all', label: 'Select All' },
]

const groupedItems: MenuEntry[] = [
  {
    type: 'group',
    key: 'file-group',
    label: 'File',
    children: [
      { key: 'new-file', label: 'New File', icon: <Icon icon={icons.file} size="small" /> },
      { key: 'open', label: 'Open', icon: <Icon icon={icons.folderOpen} size="small" /> },
      { key: 'save', label: 'Save', icon: <Icon icon={icons.save} size="small" /> },
    ],
  },
  { type: 'divider' },
  {
    type: 'group',
    key: 'edit-group',
    label: 'Edit',
    children: [
      { key: 'undo', label: 'Undo', icon: <Icon icon={icons.undo} size="small" /> },
      { key: 'redo', label: 'Redo', icon: <Icon icon={icons.redo} size="small" /> },
    ],
  },
]

const withDisabledItems: MenuEntry[] = [
  { key: 'view', label: 'View', icon: <Icon icon={icons.eye} size="small" /> },
  { key: 'edit', label: 'Edit', icon: <Icon icon={icons.edit} size="small" /> },
  { key: 'delete', label: 'Delete', icon: <Icon icon={icons.trash} size="small" />, disabled: true },
  { type: 'divider' },
  { key: 'share', label: 'Share', icon: <Icon icon={icons.link} size="small" /> },
]

const BasicDropdownDemo = Shade({
  shadowDomName: 'basic-dropdown-demo',
  render: ({ useState }) => {
    const [lastSelected, setLastSelected] = useState('lastSelected', '')

    return (
      <div>
        <div style={{ display: 'flex', gap: '16px', alignItems: 'center', flexWrap: 'wrap' }}>
          <Dropdown items={basicItems} onSelect={(key) => setLastSelected(key)}>
            <Button variant="outlined">Actions</Button>
          </Dropdown>
          <Dropdown items={basicItems} onSelect={(key) => setLastSelected(key)} placement="bottomRight">
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
      <PageContainer centered>
        <PageHeader
          icon={<Icon icon={icons.chevronDown} />}
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
