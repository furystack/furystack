import { createComponent, Shade } from '@furystack/shades'
import { List, ListService, PageContainer, PageHeader, Paper, Typography } from '@furystack/shades-common-components'

type ListEntry = { label: string; icon: string }
const listEntries: ListEntry[] = [
  { label: 'Documents', icon: '📄' },
  { label: 'Pictures', icon: '🖼️' },
  { label: 'Music', icon: '🎵' },
  { label: 'Videos', icon: '🎬' },
  { label: 'Downloads', icon: '📥' },
]

const SelectionCountDisplay = Shade<{ count: number }>({
  shadowDomName: 'shades-selection-count-display',
  render: ({ props }) => {
    return (
      <Typography variant="body1" style={{ marginTop: '8px', opacity: '0.7' }}>
        Selected: {props.count} item(s)
      </Typography>
    )
  },
})

export const ListPage = Shade({
  shadowDomName: 'shades-list-page',
  render: ({ useDisposable, useState }) => {
    const listService = useDisposable('listService', () => new ListService<ListEntry>({ searchField: 'label' }))
    const multiSelectService = useDisposable(
      'multiSelectService',
      () => new ListService<ListEntry>({ searchField: 'label' }),
    )
    const [selectionCount, setSelectionCount] = useState('selectionCount', 0)

    return (
      <PageContainer centered>
        <PageHeader
          icon="📋"
          title="List"
          description="Keyboard-navigable list with single and multi-select support."
        />
        <Paper elevation={3} style={{ padding: '32px' }}>
          <Typography variant="h3">Basic List</Typography>
          <Typography variant="body1" style={{ marginBottom: '8px', opacity: '0.7' }}>
            Click to focus, arrow keys to navigate, Enter to activate
          </Typography>
          <div style={{ maxHeight: '250px', border: '1px solid rgba(128,128,128,0.3)', borderRadius: '6px' }}>
            <List<ListEntry>
              items={listEntries}
              listService={listService}
              renderIcon={(item) => <span>{item.icon}</span>}
              renderItem={(item) => <span>{item.label}</span>}
              onItemActivate={(item) => console.log('Activated:', item.label)}
            />
          </div>
          <Typography variant="h3" style={{ marginTop: '24px' }}>
            Multi-select List
          </Typography>
          <Typography variant="body1" style={{ marginBottom: '8px', opacity: '0.7' }}>
            Ctrl+Click for toggle, Shift+Click for range, Space to toggle, + to select all, - to deselect all
          </Typography>
          <div style={{ maxHeight: '250px', border: '1px solid rgba(128,128,128,0.3)', borderRadius: '6px' }}>
            <List<ListEntry>
              items={listEntries}
              listService={multiSelectService}
              renderIcon={(item) => <span>{item.icon}</span>}
              renderItem={(item) => <span>{item.label}</span>}
              onSelectionChange={(selected) => setSelectionCount(selected.length)}
            />
          </div>
          <SelectionCountDisplay count={selectionCount} />
        </Paper>
      </PageContainer>
    )
  },
})
