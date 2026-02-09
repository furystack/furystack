import { createComponent, Shade } from '@furystack/shades'
import { Button, ConfirmDialog, Dialog, PageContainer, PageHeader, Paper } from '@furystack/shades-common-components'

export const DialogPage = Shade({
  shadowDomName: 'shades-dialog-page',
  render: ({ useState }) => {
    const [isBasicOpen, setBasicOpen] = useState('basicDialog', false)
    const [isActionsOpen, setActionsOpen] = useState('actionsDialog', false)
    const [isFullWidthOpen, setFullWidthOpen] = useState('fullWidthDialog', false)
    const [isScrollOpen, setScrollOpen] = useState('scrollDialog', false)
    const [isConfirmOpen, setConfirmOpen] = useState('confirmDialog', false)
    const [isCustomConfirmOpen, setCustomConfirmOpen] = useState('customConfirmDialog', false)

    return (
      <PageContainer maxWidth="900px" centered>
        <PageHeader
          icon="💬"
          title="Dialog"
          description="Dialogs inform users about a task and can contain critical information, require decisions, or involve multiple tasks. Built on top of the Modal component."
        />

        <Paper elevation={3} style={{ padding: '32px', display: 'flex', flexDirection: 'column', gap: '24px' }}>
          <h3 style={{ margin: '0' }}>Basic Dialog</h3>
          <p style={{ margin: '0', opacity: '0.7' }}>A simple dialog with a title and close button.</p>
          <div>
            <Button variant="contained" color="primary" onclick={() => setBasicOpen(true)}>
              Open Basic Dialog
            </Button>
          </div>
          <Dialog isVisible={isBasicOpen} title="Basic Dialog" onClose={() => setBasicOpen(false)}>
            <p style={{ margin: '0' }}>
              This is a basic dialog with a title and a close button. Click the X or the backdrop to close it.
            </p>
          </Dialog>

          <h3 style={{ margin: '0' }}>Dialog with Actions</h3>
          <p style={{ margin: '0', opacity: '0.7' }}>A dialog with custom action buttons in the footer.</p>
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
            <p style={{ margin: '0' }}>You have unsaved changes. Would you like to save them before leaving?</p>
          </Dialog>

          <h3 style={{ margin: '0' }}>Full Width Dialog</h3>
          <p style={{ margin: '0', opacity: '0.7' }}>
            A dialog that stretches to fill the available width up to maxWidth.
          </p>
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
            <p style={{ margin: '0' }}>
              This dialog uses <code>fullWidth</code> with a <code>maxWidth</code> of 700px.
            </p>
          </Dialog>

          <h3 style={{ margin: '0' }}>Scrollable Content</h3>
          <p style={{ margin: '0', opacity: '0.7' }}>When content exceeds the viewport, the dialog body scrolls.</p>
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
              <p>
                Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do eiusmod tempor incididunt ut labore et
                dolore magna aliqua. Paragraph {i + 1}.
              </p>
            ))}
          </Dialog>

          <h3 style={{ margin: '0' }}>Confirm Dialog Helper</h3>
          <p style={{ margin: '0', opacity: '0.7' }}>
            A pre-built confirm dialog using the <code>ConfirmDialog</code> helper function.
          </p>
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

          <h3 style={{ margin: '0' }}>Confirm Dialog with JSX Message</h3>
          <p style={{ margin: '0', opacity: '0.7' }}>The confirm dialog also accepts JSX as the message content.</p>
          <div>
            <Button variant="contained" color="warning" onclick={() => setCustomConfirmOpen(true)}>
              Reset Settings
            </Button>
          </div>
          {ConfirmDialog(isCustomConfirmOpen, {
            title: 'Reset All Settings',
            message: (
              <div>
                <p style={{ margin: '0 0 8px 0' }}>This will reset all settings to their defaults:</p>
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
