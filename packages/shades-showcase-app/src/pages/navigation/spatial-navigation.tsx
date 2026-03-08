import { createComponent, Shade, SpatialNavigationService, configureSpatialNavigation } from '@furystack/shades'
import { ObservableValue } from '@furystack/utils'
import {
  Button,
  Dialog,
  Icon,
  icons,
  PageContainer,
  PageHeader,
  Paper,
  Typography,
} from '@furystack/shades-common-components'

export const SpatialNavigationPage = Shade({
  customElementName: 'shades-spatial-navigation-page',
  render: ({ injector, useObservable, useDisposable, useState }) => {
    if (!injector.cachedSingletons.has(SpatialNavigationService)) {
      configureSpatialNavigation(injector, { initiallyEnabled: true })
    }
    const spatialNav = injector.getInstance(SpatialNavigationService)

    const [isEnabled] = useObservable('enabled', spatialNav.enabled)
    const [activeSection] = useObservable('activeSection', spatialNav.activeSection)
    const [isDialogOpen, setDialogOpen] = useState('dialogOpen', false)

    const [logEntries, setLogEntries] = useObservable(
      'logEntries',
      useDisposable('actionLog', () => new ObservableValue<string[]>([])),
    )

    const logAction = (action: string) => {
      setLogEntries([`${new Date().toLocaleTimeString()} — ${action}`, ...logEntries].slice(0, 20))
    }

    return (
      <PageContainer centered>
        <PageHeader
          icon={<Icon icon={icons.compass} />}
          title="Spatial Navigation"
          description="Navigate between interactive elements using arrow keys. Press Enter to activate."
        />

        <Paper elevation={3} style={{ padding: '24px', marginBottom: '16px' }}>
          <div style={{ display: 'flex', gap: '16px', alignItems: 'center', flexWrap: 'wrap' }}>
            <Typography variant="body1">
              Status: <strong>{isEnabled ? 'Enabled' : 'Disabled'}</strong>
            </Typography>
            <Typography variant="body1">
              Active section: <strong>{activeSection ?? 'none'}</strong>
            </Typography>
            <Button variant="outlined" onclick={() => spatialNav.enabled.setValue(!spatialNav.enabled.getValue())}>
              {isEnabled ? 'Disable' : 'Enable'} Spatial Navigation
            </Button>
          </div>
        </Paper>

        <div style={{ display: 'grid', gridTemplateColumns: '200px 1fr', gap: '16px' }}>
          <Paper elevation={2} style={{ padding: '16px' }}>
            <div data-nav-section="sidebar">
              <Typography variant="h6" style={{ marginBottom: '12px' }}>
                Sidebar
              </Typography>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                <Button variant="outlined" onclick={() => logAction('Sidebar: Item 1')}>
                  Item 1
                </Button>
                <Button variant="outlined" onclick={() => logAction('Sidebar: Item 2')}>
                  Item 2
                </Button>
                <Button variant="outlined" onclick={() => logAction('Sidebar: Item 3')}>
                  Item 3
                </Button>
                <Button variant="outlined" onclick={() => logAction('Sidebar: Item 4')}>
                  Item 4
                </Button>
              </div>
            </div>
          </Paper>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <Paper elevation={2} style={{ padding: '16px' }}>
              <div data-nav-section="header-actions">
                <Typography variant="h6" style={{ marginBottom: '12px' }}>
                  Header Actions
                </Typography>
                <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                  <Button variant="contained" color="primary" onclick={() => logAction('Header: New')}>
                    New
                  </Button>
                  <Button variant="contained" color="secondary" onclick={() => logAction('Header: Edit')}>
                    Edit
                  </Button>
                  <Button variant="outlined" onclick={() => logAction('Header: Delete')}>
                    Delete
                  </Button>
                  <Button variant="outlined" onclick={() => logAction('Header: Settings')}>
                    Settings
                  </Button>
                  <Button variant="contained" color="primary" onclick={() => setDialogOpen(true)}>
                    Open Dialog
                  </Button>
                </div>
              </div>
            </Paper>

            <Paper elevation={2} style={{ padding: '16px' }}>
              <div data-nav-section="main-content">
                <Typography variant="h6" style={{ marginBottom: '12px' }}>
                  Main Content (Grid Layout)
                </Typography>
                <div
                  style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(4, 1fr)',
                    gap: '8px',
                  }}
                >
                  {Array.from({ length: 12 }, (_, i) => (
                    <Button variant="outlined" onclick={() => logAction(`Grid: Cell ${i + 1}`)}>
                      Cell {i + 1}
                    </Button>
                  ))}
                </div>
              </div>
            </Paper>

            <Paper elevation={2} style={{ padding: '16px' }}>
              <div data-nav-section="form-section">
                <Typography variant="h6" style={{ marginBottom: '12px' }}>
                  Form (Input Passthrough)
                </Typography>
                <Typography variant="body2" style={{ marginBottom: '8px' }}>
                  Arrow keys should work normally inside text inputs and textareas.
                </Typography>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', maxWidth: '400px' }}>
                  <input type="text" placeholder="Text input (arrows work inside)" style={{ padding: '8px' }} />
                  <textarea placeholder="Textarea (arrows work inside)" rows={3} style={{ padding: '8px' }} />
                  <div style={{ display: 'flex', gap: '8px' }}>
                    <Button variant="contained" color="primary" onclick={() => logAction('Form: Submit')}>
                      Submit
                    </Button>
                    <Button variant="outlined" onclick={() => logAction('Form: Cancel')}>
                      Cancel
                    </Button>
                  </div>
                </div>
              </div>
            </Paper>
          </div>
        </div>

        <Paper elevation={2} style={{ padding: '16px', marginTop: '16px' }}>
          <Typography variant="h6" style={{ marginBottom: '8px' }}>
            Action Log
          </Typography>
          <div
            style={{
              fontFamily: 'monospace',
              fontSize: '12px',
              maxHeight: '200px',
              overflow: 'auto',
              padding: '8px',
              borderRadius: '4px',
            }}
          >
            {logEntries.length === 0 ? (
              <Typography variant="body2">Use arrow keys to navigate and Enter to activate buttons...</Typography>
            ) : (
              logEntries.map((entry) => <div>{entry}</div>)
            )}
          </div>
        </Paper>

        <Dialog
          isVisible={isDialogOpen}
          title="Focus Trap Dialog"
          onClose={() => setDialogOpen(false)}
          trapFocus={true}
          navSection="dialog"
          actions={
            <>
              <Button variant="outlined" onclick={() => setDialogOpen(false)}>
                Cancel
              </Button>
              <Button
                variant="contained"
                color="primary"
                onclick={() => {
                  logAction('Dialog: Confirmed')
                  setDialogOpen(false)
                }}
              >
                Confirm
              </Button>
            </>
          }
        >
          <Typography variant="body1">
            This dialog traps spatial navigation within its bounds. Arrow keys should only move between the Cancel and
            Confirm buttons.
          </Typography>
        </Dialog>
      </PageContainer>
    )
  },
})
