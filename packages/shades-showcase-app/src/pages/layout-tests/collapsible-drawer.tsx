import { createComponent, Shade } from '@furystack/shades'
import { DrawerToggleButton, LayoutService, PageLayout } from '@furystack/shades-common-components'

/**
 * Test page: Collapsible drawer with toggle button
 * Used for E2E visual regression testing
 */
export const CollapsibleDrawerTest = Shade({
  shadowDomName: 'layout-test-collapsible',
  render: ({ injector }) => {
    const layoutService = injector.getInstance(LayoutService)

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
        <div
          data-testid="test-content"
          style={{
            background: '#ffeb3b',
            height: `100%`,
            boxSizing: 'border-box',
            padding: '16px',
            color: '#333',
          }}
        >
          <h2>Content Area (Yellow)</h2>
          <p>This test page shows a layout with a collapsible drawer.</p>
          <p>Use the toggle button in the AppBar or the button below to toggle the drawer:</p>
          <button
            type="button"
            onclick={() => layoutService.toggleDrawer('left')}
            style={{
              marginTop: '16px',
              padding: '8px 16px',
              cursor: 'pointer',
            }}
          >
            Toggle Drawer Programmatically
          </button>
        </div>
      </PageLayout>
    )
  },
})
