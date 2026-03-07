import { createComponent, Shade } from '@furystack/shades'
import {
  Button,
  ConfirmDialog,
  Dialog,
  Icon,
  icons,
  PageContainer,
  PageHeader,
  Paper,
  Typography,
} from '@furystack/shades-common-components'

export const DialogPage = Shade({
  customElementName: 'shades-dialog-page',
  render: ({ useState }) => {
    const [isBasicOpen, setBasicOpen] = useState('basicDialog', false)
    const [isActionsOpen, setActionsOpen] = useState('actionsDialog', false)
    const [isFullWidthOpen, setFullWidthOpen] = useState('fullWidthDialog', false)
    const [isScrollOpen, setScrollOpen] = useState('scrollDialog', false)
    const [isConfirmOpen, setConfirmOpen] = useState('confirmDialog', false)
    const [isCustomConfirmOpen, setCustomConfirmOpen] = useState('customConfirmDialog', false)

    return (
      <PageContainer centered>
        <PageHeader
          icon={<Icon icon={icons.messageCircle} />}
          title="Dialog"
          description="Dialogs inform users about a task and can contain critical information, require decisions, or involve multiple tasks. Built on top of the Modal component."
        />

        <Paper elevation={3} style={{ padding: '32px', display: 'flex', flexDirection: 'column', gap: '24px' }}>
          <Typography variant="h6" style={{ margin: '0' }}>
            Basic Dialog
          </Typography>
          <Typography variant="body2" color="textSecondary" style={{ margin: '0' }}>
            A simple dialog with a title and close button.
          </Typography>
          <div>
            <Button variant="contained" color="primary" onclick={() => setBasicOpen(true)}>
              Open Basic Dialog
            </Button>
          </div>
          <Dialog isVisible={isBasicOpen} title="Basic Dialog" onClose={() => setBasicOpen(false)}>
            <Typography variant="body1" style={{ margin: '0' }}>
              This is a basic dialog with a title and a close button. Click the X or the backdrop to close it.
            </Typography>
          </Dialog>

          <Typography variant="h6" style={{ margin: '0' }}>
            Dialog with Actions
          </Typography>
          <Typography variant="body2" color="textSecondary" style={{ margin: '0' }}>
            A dialog with custom action buttons in the footer.
          </Typography>
          <div>
            <Button variant="contained" color="primary" onclick={() => setActionsOpen(true)}>
              Open Actions Dialog
            </Button>
          </div>
          <Dialog
            isVisible={isActionsOpen}
            title="Save Changes?"
            onClose={() => setActionsOpen(false)}
            actions={
              <>
                <Button onclick={() => setActionsOpen(false)}>Discard</Button>
                <Button variant="contained" color="primary" onclick={() => setActionsOpen(false)}>
                  Save
                </Button>
              </>
            }
          >
            <Typography variant="body1" style={{ margin: '0' }}>
              You have unsaved changes. Would you like to save them before leaving?
            </Typography>
          </Dialog>

          <Typography variant="h6" style={{ margin: '0' }}>
            Full Width Dialog
          </Typography>
          <Typography variant="body2" color="textSecondary" style={{ margin: '0' }}>
            A dialog that stretches to fill the available width up to maxWidth.
          </Typography>
          <div>
            <Button variant="contained" color="primary" onclick={() => setFullWidthOpen(true)}>
              Open Full Width Dialog
            </Button>
          </div>
          <Dialog
            isVisible={isFullWidthOpen}
            title="Full Width Dialog"
            onClose={() => setFullWidthOpen(false)}
            fullWidth
            maxWidth="700px"
            actions={
              <Button variant="contained" color="primary" onclick={() => setFullWidthOpen(false)}>
                Close
              </Button>
            }
          >
            <Typography variant="body1" style={{ margin: '0' }}>
              This dialog uses <code>fullWidth</code> with a <code>maxWidth</code> of 700px.
            </Typography>
          </Dialog>

          <Typography variant="h6" style={{ margin: '0' }}>
            Scrollable Content
          </Typography>
          <Typography variant="body2" color="textSecondary" style={{ margin: '0' }}>
            When content exceeds the viewport, the dialog body scrolls.
          </Typography>
          <div>
            <Button variant="contained" color="primary" onclick={() => setScrollOpen(true)}>
              Open Scrollable Dialog
            </Button>
          </div>
          <Dialog
            isVisible={isScrollOpen}
            title="Terms and Conditions"
            onClose={() => setScrollOpen(false)}
            actions={
              <>
                <Button onclick={() => setScrollOpen(false)}>Decline</Button>
                <Button variant="contained" color="primary" onclick={() => setScrollOpen(false)}>
                  Accept
                </Button>
              </>
            }
          >
            {Array.from({ length: 20 }, (_, i) => (
              <Typography variant="body1">
                Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do eiusmod tempor incididunt ut labore et
                dolore magna aliqua. Paragraph {i + 1}.
              </Typography>
            ))}
          </Dialog>

          <Typography variant="h6" style={{ margin: '0' }}>
            Confirm Dialog Helper
          </Typography>
          <Typography variant="body2" color="textSecondary" style={{ margin: '0' }}>
            A pre-built confirm dialog using the <code>ConfirmDialog</code> helper function.
          </Typography>
          <div>
            <Button variant="contained" color="error" onclick={() => setConfirmOpen(true)}>
              Delete Item
            </Button>
          </div>
          {ConfirmDialog(isConfirmOpen, {
            title: 'Delete Item',
            message: 'Are you sure you want to delete this item? This action cannot be undone.',
            confirmText: 'Delete',
            cancelText: 'Cancel',
            onConfirm: () => {
              console.log('Item deleted')
              setConfirmOpen(false)
            },
            onCancel: () => setConfirmOpen(false),
          })}

          <Typography variant="h6" style={{ margin: '0' }}>
            Confirm Dialog with JSX Message
          </Typography>
          <Typography variant="body2" color="textSecondary" style={{ margin: '0' }}>
            The confirm dialog also accepts JSX as the message content.
          </Typography>
          <div>
            <Button variant="contained" color="warning" onclick={() => setCustomConfirmOpen(true)}>
              Reset Settings
            </Button>
          </div>
          {ConfirmDialog(isCustomConfirmOpen, {
            title: 'Reset All Settings',
            message: (
              <div>
                <Typography variant="body1" style={{ margin: '0 0 8px 0' }}>
                  This will reset all settings to their defaults:
                </Typography>
                <ul style={{ margin: '0', paddingLeft: '20px' }}>
                  <li>Theme preferences</li>
                  <li>Layout configuration</li>
                  <li>Saved filters</li>
                </ul>
              </div>
            ),
            confirmText: 'Reset',
            cancelText: 'Keep Settings',
            onConfirm: () => {
              console.log('Settings reset')
              setCustomConfirmOpen(false)
            },
            onCancel: () => setCustomConfirmOpen(false),
          })}
        </Paper>
      </PageContainer>
    )
  },
})
