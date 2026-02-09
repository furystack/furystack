import { createComponent, Shade } from '@furystack/shades'
import {
  Button,
  ContextMenu,
  ContextMenuManager,
  PageContainer,
  PageHeader,
  Paper,
  Typography,
} from '@furystack/shades-common-components'

type MenuAction = { action: string }

export const ContextMenuPage = Shade({
  shadowDomName: 'shades-context-menu-page',
  render: ({ useDisposable }) => {
    const rightClickManager = useDisposable('rightClickManager', () => new ContextMenuManager<MenuAction>())
    const buttonManager = useDisposable('buttonManager', () => new ContextMenuManager<MenuAction>())

    return (
      <PageContainer centered>
        <PageHeader
          icon="📋"
          title="Context Menu"
          description="Right-click or button-triggered context menus with icons, descriptions, separators, and disabled items."
        />
        <Paper elevation={3} style={{ padding: '32px' }}>
          <Typography variant="h3">Right-click triggered</Typography>
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

          <Typography variant="h3" style={{ marginTop: '24px' }}>
            Button triggered
          </Typography>
          <Button
            variant="outlined"
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
          </Button>
          <ContextMenu<MenuAction>
            manager={buttonManager}
            onItemSelect={(item) => console.log('Selected:', item.action)}
          />
        </Paper>
      </PageContainer>
    )
  },
})
