import { createComponent, Shade } from '@furystack/shades'
import {
  Button,
  DrawerToggleButton,
  LayoutService,
  PageContainer,
  PageHeader,
  PageLayout,
  Paper,
} from '@furystack/shades-common-components'

const ToggleDrawerButton = Shade({
  tagName: 'toggle-drawer-button-collapsible',
  render: ({ injector }) => {
    const layoutService = injector.getInstance(LayoutService)
    return (
      <Button variant="outlined" onclick={() => layoutService.toggleDrawer('left')}>
        📐 Toggle Drawer
      </Button>
    )
  },
})

/**
 * Test page: Collapsible drawer with toggle button
 * Used for E2E visual regression testing
 */
export const CollapsibleDrawerTest = Shade({
  tagName: 'layout-test-collapsible',
  render: () => {
    return (
      <PageLayout
        appBar={{
          variant: 'permanent',
          component: (
            <div
              data-testid="test-appbar"
              style={{
                background: '#9c27b0',
                height: '100%',
                width: '100%',
                display: 'flex',
                alignItems: 'center',
                paddingLeft: '8px',
                color: 'white',
                fontWeight: 'bold',
                gap: '8px',
              }}
            >
              <DrawerToggleButton position="left" />
              <span>Collapsible Drawer Test (Purple)</span>
            </div>
          ),
        }}
        drawer={{
          left: {
            variant: 'collapsible',
            width: '240px',
            defaultOpen: true,
            component: (
              <div
                data-testid="test-drawer-left"
                style={{
                  background: '#00bcd4',
                  height: '100%',
                  boxSizing: 'border-box',
                  padding: '16px',
                  color: 'white',
                }}
              >
                <h3>Collapsible Drawer (Cyan)</h3>
                <p>Width: 240px</p>
                <p>Click the hamburger icon in the AppBar to toggle this drawer.</p>
              </div>
            ),
          },
        }}
      >
        <PageContainer
          data-testid="test-content"
          style={{
            background: '#ffeb3b',
            color: '#333',
          }}
        >
          <PageHeader title="📐 Collapsible Drawer" actions={<ToggleDrawerButton />} />
          <Paper>
            <p>This test page shows a layout with a collapsible drawer.</p>
            <p>Use the hamburger icon in the AppBar or the button in the header to toggle the drawer.</p>
          </Paper>
        </PageContainer>
      </PageLayout>
    )
  },
})
