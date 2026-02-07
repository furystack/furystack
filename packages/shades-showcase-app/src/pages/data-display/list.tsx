import { createComponent, Shade } from '@furystack/shades'
import { List, ListService, PageContainer, PageHeader, Paper } from '@furystack/shades-common-components'
import { ObservableValue } from '@furystack/utils'

type ListEntry = { label: string; icon: string }
const listEntries: ListEntry[] = [
  { label: 'Documents', icon: '📄' },
  { label: 'Pictures', icon: '🖼️' },
  { label: 'Music', icon: '🎵' },
  { label: 'Videos', icon: '🎬' },
  { label: 'Downloads', icon: '📥' },
]

const SelectionCountDisplay = Shade<{ selectionCount: ObservableValue<number> }>({
  shadowDomName: 'shades-selection-count-display',
  render: ({ props, useObservable }) => {
    const [count] = useObservable('count', props.selectionCount)
    return <p style={{ marginTop: '8px', opacity: '0.7' }}>Selected: {count} item(s)</p>
  },
})

export const ListPage = Shade({
  shadowDomName: 'shades-list-page',
  render: ({ useDisposable }) => {
    const listService = useDisposable('listService', () => new ListService<ListEntry>({ searchField: 'label' }))
    const multiSelectService = useDisposable(
      'multiSelectService',
      () => new ListService<ListEntry>({ searchField: 'label' }),
    )
    const selectionCount = useDisposable('selectionCount', () => new ObservableValue(0))

    return (
      <PageContainer maxWidth="900px" centered>
        <PageHeader
          icon="📋"
          title="List"
          description="Keyboard-navigable list with single and multi-select support."
        />
        <Paper elevation={3} style={{ padding: '32px' }}>
          <h3>Basic List</h3>
          <p style={{ marginBottom: '8px', opacity: '0.7' }}>
            Click to focus, arrow keys to navigate, Enter to activate
          </p>
          <div style={{ maxHeight: '250px', border: '1px solid rgba(128,128,128,0.3)', borderRadius: '6px' }}>
            <List<ListEntry>
              items={listEntries}
              listService={listService}
              renderIcon={(item) => <span>{item.icon}</span>}
              renderItem={(item) => <span>{item.label}</span>}
              onItemActivate={(item) => console.log('Activated:', item.label)}
            />
          </div>
          <h3 style={{ marginTop: '24px' }}>Multi-select List</h3>
          <p style={{ marginBottom: '8px', opacity: '0.7' }}>
            Ctrl+Click for toggle, Shift+Click for range, Space to toggle, + to select all, - to deselect all
          </p>
          <div style={{ maxHeight: '250px', border: '1px solid rgba(128,128,128,0.3)', borderRadius: '6px' }}>
            <List<ListEntry>
              items={listEntries}
              listService={multiSelectService}
              renderIcon={(item) => <span>{item.icon}</span>}
              renderItem={(item) => <span>{item.label}</span>}
              onSelectionChange={(selected) => selectionCount.setValue(selected.length)}
            />
          </div>
          <SelectionCountDisplay selectionCount={selectionCount} />
        </Paper>
      </PageContainer>
    )
  },
})
