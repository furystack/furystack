import { createComponent, ScreenService, Shade } from '@furystack/shades'
import {
  DrawerToggleButton,
  LAYOUT_CSS_VARIABLES,
  LayoutService,
  PageLayout,
} from '@furystack/shades-common-components'

/**
 * Test page: Responsive layout with auto-collapsing drawer
 * Used for E2E visual regression testing
 */
export const ResponsiveLayoutTest = Shade({
  shadowDomName: 'layout-test-responsive',
  render: ({ injector, useObservable }) => {
    const layoutService = injector.getInstance(LayoutService)
    const screenService = injector.getInstance(ScreenService)

    const [isAtLeastMd] = useObservable('atLeastMd', screenService.screenSize.atLeast.md)
    const [drawerState] = useObservable('drawerState', layoutService.drawerState)
    const isDrawerOpen = drawerState.left?.open ?? false

    return (
      <PageLayout
        appBar={{
          variant: 'permanent',
          component: (
            <div
              data-testid="test-appbar"
              style={{
                background: '#607d8b',
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
              <span>Responsive Layout Test - Screen: {isAtLeastMd ? '≥md' : '<md'} (Blue Grey)</span>
            </div>
          ),
        }}
        drawer={{
          left: {
            variant: 'collapsible',
            width: '240px',
            defaultOpen: true,
            collapseOnBreakpoint: 'md',
            component: (
              <div
                data-testid="test-drawer-left"
                style={{
                  background: '#795548',
                  height: '100%',
                  padding: '16px',
                  color: 'white',
                }}
              >
                <h3>Responsive Drawer (Brown)</h3>
                <p>Width: 240px</p>
                <p>This drawer responds to screen size changes.</p>
              </div>
            ),
          },
        }}
      >
        <div
          data-testid="test-content"
          style={{
            background: '#009688',
            height: `var(${LAYOUT_CSS_VARIABLES.contentAvailableHeight})`,
            padding: '16px',
            color: 'white',
          }}
        >
          <h2>Responsive Layout Test (Teal)</h2>
          <div style={{ marginTop: '16px' }}>
            <h3>Current State:</h3>
            <ul>
              <li>
                Screen size: <strong>{isAtLeastMd ? 'Medium or larger (≥900px)' : 'Small (<900px)'}</strong>
              </li>
              <li>
                Drawer state: <strong>{isDrawerOpen ? 'Open' : 'Closed'}</strong>
              </li>
            </ul>
          </div>
          <div style={{ marginTop: '16px' }}>
            <h3>Instructions:</h3>
            <p>Resize the browser window to test responsive behavior:</p>
            <ul>
              <li>At ≥900px: The drawer can be toggled open/closed</li>
              <li>At &lt;900px: The drawer collapses automatically</li>
            </ul>
          </div>
          <div style={{ marginTop: '16px' }}>
            <button
              type="button"
              onclick={() => layoutService.toggleDrawer('left')}
              style={{
                padding: '8px 16px',
                cursor: 'pointer',
              }}
            >
              Toggle Drawer
            </button>
          </div>
        </div>
      </PageLayout>
    )
  },
})
