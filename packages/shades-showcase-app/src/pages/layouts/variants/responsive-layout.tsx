import { createComponent, ScreenService, Shade } from '@furystack/shades'
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
  shadowDomName: 'toggle-drawer-button-responsive',
  render: ({ injector }) => {
    const layoutService = injector.getInstance(LayoutService)
    return (
      <Button variant="outlined" onclick={() => layoutService.toggleDrawer('left')}>
        📱 Toggle Drawer
      </Button>
    )
  },
})

const DrawerState = Shade({
  shadowDomName: 'drawer-state',
  render: ({ injector, useObservable }) => {
    const layoutService = injector.getInstance(LayoutService)
    const [drawerState] = useObservable('drawerState', layoutService.drawerState)
    return <>Drawer State: {drawerState.left?.open ? 'Open' : 'Closed'}</>
  },
})

/**
 * Test page: Responsive layout with auto-collapsing drawer
 * Used for E2E visual regression testing
 */
export const ResponsiveLayoutTest = Shade({
  shadowDomName: 'layout-test-responsive',
  render: ({ injector, useObservable }) => {
    const screenService = injector.getInstance(ScreenService)

    const [isAtLeastMd] = useObservable('atLeastMd', screenService.screenSize.atLeast.md)

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
                  boxSizing: 'border-box',
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
        <PageContainer
          data-testid="test-content"
          style={{
            background: '#009688',
            color: 'white',
          }}
        >
          <PageHeader title="📱 Responsive Layout" actions={<ToggleDrawerButton />} />
          <Paper>
            <div style={{ marginTop: '16px' }}>
              <h3>Current State:</h3>
              <ul>
                <li>
                  Screen size: <strong>{isAtLeastMd ? 'Medium or larger (≥900px)' : 'Small (<900px)'}</strong>
                </li>
                <li>
                  <DrawerState />
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
          </Paper>
        </PageContainer>
      </PageLayout>
    )
  },
})
