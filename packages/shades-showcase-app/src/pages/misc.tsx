import { createComponent, Shade } from '@furystack/shades'
import {
  Avatar,
  Breadcrumb,
  CommandPalette,
  ContextMenu,
  ContextMenuManager,
  createBreadcrumb,
  Fab,
  Input,
  List,
  ListService,
  PageContainer,
  PageHeader,
  Paper,
  Suggest,
  Tree,
  TreeService,
} from '@furystack/shades-common-components'
import { ObservableValue, sleepAsync } from '@furystack/utils'

import type { appRoutes } from '../routes.js'

const AppBreadcrumb = createBreadcrumb<typeof appRoutes>()

type SuggestEntry = { title: string; description: string }
const entries: SuggestEntry[] = [
  { title: 'First Entry', description: 'This is the first entry' },
  { title: 'Second Entry', description: 'This is the second entry' },
  { title: 'Third Entry', description: 'This is the third entry' },
  { title: 'Fourth Entry', description: 'This is the fourth entry' },
  { title: 'Fifth Entry', description: 'This is the fifth entry' },
]

const ExampleSearchChangeComponent = Shade({
  shadowDomName: 'shades-example-search-change',
  render: ({ useSearchState, renderCount }) => {
    const [searchValue, setSearchValue] = useSearchState('searchValue', '')

    return (
      <p>
        Search state change ({renderCount})
        <Input placeholder="Search" value={searchValue} onTextChange={setSearchValue} />
      </p>
    )
  },
})

const ExampleStoredStateChangeComponent = Shade({
  shadowDomName: 'shades-example-storedstate-change',
  render: ({ useStoredState, renderCount }) => {
    const [searchValue, setSearchValue] = useStoredState('storedStateValue', '', sessionStorage)

    return (
      <p>
        Stored state change ({renderCount})
        <Input placeholder="Search" value={searchValue} onTextChange={setSearchValue} />
      </p>
    )
  },
})

type ListEntry = { label: string; icon: string }
const listEntries: ListEntry[] = [
  { label: 'Documents', icon: '📄' },
  { label: 'Pictures', icon: '🖼️' },
  { label: 'Music', icon: '🎵' },
  { label: 'Videos', icon: '🎬' },
  { label: 'Downloads', icon: '📥' },
]

const ListShowcase = Shade({
  shadowDomName: 'shades-list-showcase',
  render: ({ useDisposable }) => {
    const listService = useDisposable('listService', () => new ListService<ListEntry>({ searchField: 'label' }))
    const multiSelectService = useDisposable(
      'multiSelectService',
      () => new ListService<ListEntry>({ searchField: 'label' }),
    )
    const selectionCount = useDisposable('selectionCount', () => new ObservableValue(0))

    return (
      <div>
        <h2>List</h2>
        <h3>Basic List</h3>
        <p style={{ marginBottom: '8px', opacity: '0.7' }}>Click to focus, arrow keys to navigate, Enter to activate</p>
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
      </div>
    )
  },
})

const SelectionCountDisplay = Shade<{ selectionCount: ObservableValue<number> }>({
  shadowDomName: 'shades-selection-count-display',
  render: ({ props, useObservable }) => {
    const [count] = useObservable('count', props.selectionCount)
    return <p style={{ marginTop: '8px', opacity: '0.7' }}>Selected: {count} item(s)</p>
  },
})

type MenuAction = { action: string }

const ContextMenuShowcase = Shade({
  shadowDomName: 'shades-context-menu-showcase',
  render: ({ useDisposable }) => {
    const rightClickManager = useDisposable('rightClickManager', () => new ContextMenuManager<MenuAction>())
    const buttonManager = useDisposable('buttonManager', () => new ContextMenuManager<MenuAction>())

    return (
      <div>
        <h2>Context Menu</h2>
        <h3>Right-click triggered</h3>
        <div
          style={{
            padding: '32px',
            border: '2px dashed rgba(128,128,128,0.3)',
            borderRadius: '8px',
            textAlign: 'center',
            cursor: 'context-menu',
          }}
          oncontextmenu={(ev: MouseEvent) => {
            ev.preventDefault()
            rightClickManager.open({
              items: [
                { type: 'item', data: { action: 'cut' }, label: 'Cut', icon: <span>✂️</span> },
                { type: 'item', data: { action: 'copy' }, label: 'Copy', icon: <span>📋</span> },
                { type: 'item', data: { action: 'paste' }, label: 'Paste', icon: <span>📌</span> },
                { type: 'separator' },
                {
                  type: 'item',
                  data: { action: 'delete' },
                  label: 'Delete',
                  icon: <span>🗑️</span>,
                  description: 'Remove permanently',
                },
              ],
              position: { x: ev.clientX, y: ev.clientY },
            })
          }}
        >
          Right-click here to open context menu
        </div>
        <ContextMenu<MenuAction>
          manager={rightClickManager}
          onItemSelect={(item) => console.log('Selected:', item.action)}
        />

        <h3 style={{ marginTop: '24px' }}>Button triggered</h3>
        <button
          style={{
            padding: '8px 16px',
            borderRadius: '6px',
            border: '1px solid rgba(128,128,128,0.3)',
            background: 'transparent',
            color: 'inherit',
            cursor: 'pointer',
          }}
          onclick={(ev: MouseEvent) => {
            const rect = (ev.currentTarget as HTMLElement).getBoundingClientRect()
            buttonManager.open({
              items: [
                {
                  type: 'item',
                  data: { action: 'new-file' },
                  label: 'New File',
                  icon: <span>📄</span>,
                  description: 'Create an empty file',
                },
                {
                  type: 'item',
                  data: { action: 'new-folder' },
                  label: 'New Folder',
                  icon: <span>📁</span>,
                  description: 'Create an empty folder',
                },
                { type: 'separator' },
                {
                  type: 'item',
                  data: { action: 'import' },
                  label: 'Import...',
                  icon: <span>📦</span>,
                  description: 'Import from external source',
                },
                { type: 'item', data: { action: 'disabled' }, label: 'Disabled action', disabled: true },
              ],
              position: { x: rect.left, y: rect.bottom + 4 },
            })
          }}
        >
          Open menu
        </button>
        <ContextMenu<MenuAction>
          manager={buttonManager}
          onItemSelect={(item) => console.log('Selected:', item.action)}
        />
      </div>
    )
  },
})

type FileNode = { name: string; icon: string; children?: FileNode[] }
const fileTree: FileNode[] = [
  {
    name: 'src',
    icon: '📁',
    children: [
      {
        name: 'components',
        icon: '📁',
        children: [
          { name: 'list.tsx', icon: '📄' },
          { name: 'tree.tsx', icon: '📄' },
          { name: 'context-menu.tsx', icon: '📄' },
        ],
      },
      {
        name: 'services',
        icon: '📁',
        children: [
          { name: 'list-service.ts', icon: '📄' },
          { name: 'tree-service.ts', icon: '📄' },
        ],
      },
      { name: 'index.ts', icon: '📄' },
    ],
  },
  { name: 'package.json', icon: '📦' },
  { name: 'tsconfig.json', icon: '⚙️' },
  { name: 'README.md', icon: '📝' },
]

const TreeShowcase = Shade({
  shadowDomName: 'shades-tree-showcase',
  render: ({ useDisposable }) => {
    const treeService = useDisposable(
      'treeService',
      () =>
        new TreeService<FileNode>({
          getChildren: (item) => item.children ?? [],
          searchField: 'name',
        }),
    )

    return (
      <div>
        <h2>Tree</h2>
        <h3>File system tree</h3>
        <p style={{ marginBottom: '8px', opacity: '0.7' }}>
          Arrow Right/Left to expand/collapse, Up/Down to navigate, Space to select
        </p>
        <div style={{ maxHeight: '300px', border: '1px solid rgba(128,128,128,0.3)', borderRadius: '6px' }}>
          <Tree<FileNode>
            rootItems={fileTree}
            treeService={treeService}
            renderIcon={(item, isExpanded) => (
              <span>{item.children && item.children.length > 0 ? (isExpanded ? '📂' : '📁') : item.icon}</span>
            )}
            renderItem={(item) => <span>{item.name}</span>}
            onItemActivate={(item) => console.log('Activated:', item.name)}
          />
        </div>
      </div>
    )
  },
})

export const MiscPage = Shade({
  shadowDomName: 'shades-misc-page',
  render: () => {
    return (
      <PageContainer maxWidth="900px" centered>
        <PageHeader
          icon="🎨"
          title="Miscellaneous Components"
          description="A collection of utility components for common UI patterns. Avatar displays user images with fallback support for broken URLs. Fab (Floating Action Button) provides a prominent action button positioned at screen corners. Suggest offers typeahead search functionality, while CommandPalette provides a keyboard-driven command interface similar to VS Code's command palette."
        />
        <Paper elevation={3} style={{ padding: '32px' }}>
          <div>
            <h2>Avatar</h2>
            <div style={{ display: 'flex', gap: '16px' }}>
              <Avatar title="Avatar" avatarUrl="avatar.jpg" />
              <Avatar title="Broken Avatar without fallback" avatarUrl="broken.jpg" />
              <Avatar title="Broken Avatar with fallback" avatarUrl="broken.jpg" fallback={<>👽</>} />
            </div>
          </div>
          <hr />
          <div>
            <h2>FAB (Bottom Right) </h2>
            <Fab>👍</Fab>
          </div>
          <div>
            <h2>Suggest</h2>
            <Suggest<SuggestEntry>
              getEntries={async (term) => {
                await sleepAsync(1000)
                return entries.filter((e) => e.title.includes(term) || e.description.includes(term))
              }}
              getSuggestionEntry={(entry) => {
                return {
                  element: <div>{entry.title}</div>,
                  score: 1,
                }
              }}
              onSelectSuggestion={(entry) => {
                console.log(entry)
              }}
              defaultPrefix=">"
            />
          </div>
          <div>
            <h2>Command Palette</h2>
            <CommandPalette
              defaultPrefix=">"
              commandProviders={[
                async ({ term }) => {
                  return entries
                    .filter((e) => e.title.includes(term) || e.description.includes(term))
                    .map((e) => ({
                      element: (
                        <div>
                          {e.title} <br /> <hr /> {e.description}
                        </div>
                      ),
                      score: 1,
                      onSelected: () => {
                        console.log(e)
                      },
                    }))
                },
              ]}
            />
          </div>
          <hr />
          <ExampleSearchChangeComponent />
          <ExampleStoredStateChangeComponent />
          <hr />
          <ListShowcase />
          <hr />
          <ContextMenuShowcase />
          <hr />
          <TreeShowcase />
          <div>
            <h2>Breadcrumb</h2>

            <h3>Basic Breadcrumb</h3>
            <Breadcrumb homeItem={{ path: '/' as const, label: 'Home' }} items={[{ path: '/misc', label: 'Misc' }]} />

            <h3>Multiple Items</h3>
            <Breadcrumb
              items={[
                { path: '/' as const, label: 'Home' },
                { path: '/buttons' as const, label: 'Buttons' },
                { path: '/misc' as const, label: 'Miscellaneous' },
              ]}
            />

            <h3>Custom Separator</h3>
            <Breadcrumb
              items={[
                { path: '/' as const, label: 'Home' },
                { path: '/grid' as const, label: 'Grid' },
                { path: '/misc' as const, label: 'Misc' },
              ]}
              separator=" → "
            />

            <h3>Custom Rendering</h3>
            <Breadcrumb
              items={[
                {
                  path: '/' as const,
                  label: 'Home',
                  render: (item, isActive) => (
                    <span style={{ fontWeight: isActive ? 'bold' : 'normal', color: isActive ? 'var(--primary)' : '' }}>
                      🏠 {item.label}
                    </span>
                  ),
                },
                {
                  path: '/misc' as const,
                  label: 'Misc',
                  render: (item, isActive) => (
                    <span style={{ fontWeight: isActive ? 'bold' : 'normal', color: isActive ? 'var(--primary)' : '' }}>
                      🎨 {item.label}
                    </span>
                  ),
                },
              ]}
              separator=" › "
              lastItemClickable={true}
            />

            <h3>Type-Safe Breadcrumb (using createBreadcrumb)</h3>
            <AppBreadcrumb
              homeItem={{ path: '/', label: '🏠 Home' }}
              items={[{ path: '/misc', label: 'Miscellaneous' }]}
              separator=" / "
            />

            <h3>Last Item Non-Clickable (default)</h3>
            <Breadcrumb
              items={[
                { path: '/' as const, label: 'Home' },
                { path: '/misc' as const, label: 'Misc (not clickable)' },
              ]}
              lastItemClickable={false}
            />
          </div>
        </Paper>
      </PageContainer>
    )
  },
})
