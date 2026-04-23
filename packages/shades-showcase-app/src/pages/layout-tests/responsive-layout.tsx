import { createComponent, ScreenService, Shade } from '@furystack/shades'
import {
  Button,
  DrawerToggleButton,
  LayoutService,
  PageContainer,
  PageHeader,
  PageLayout,
  Paper,
  Typography,
} from '@furystack/shades-common-components'

const ToggleDrawerButton = Shade({
  customElementName: 'toggle-drawer-button-responsive',
  render: ({ injector }) => {
    const layoutService = injector.get(LayoutService)
    return (
      <Button variant="outlined" onclick={() => layoutService.toggleDrawer('left')}>
        📱 Toggle Drawer
      </Button>
    )
  },
})

const DrawerState = Shade({
  customElementName: 'drawer-state',
  render: ({ injector, useObservable }) => {
    const layoutService = injector.get(LayoutService)
    const [drawerState] = useObservable('drawerState', layoutService.drawerState)
    return <>Drawer State: {drawerState.left?.open ? 'Open' : 'Closed'}</>
  },
})

/**
 * Test page: Responsive layout with auto-collapsing drawer
 * Used for E2E visual regression testing
 */
export const ResponsiveLayoutTest = Shade({
  customElementName: 'layout-test-responsive',
  render: ({ injector, useObservable }) => {
    const screenService = injector.get(ScreenService)

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
                <Typography variant="h6">Responsive Drawer (Brown)</Typography>
                <Typography variant="body2">Width: 240px</Typography>
                <Typography variant="body2">This drawer responds to screen size changes.</Typography>
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
              <Typography variant="h6">Current State:</Typography>
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
              <Typography variant="h6">Instructions:</Typography>
              <Typography variant="body1">Resize the browser window to test responsive behavior:</Typography>
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
