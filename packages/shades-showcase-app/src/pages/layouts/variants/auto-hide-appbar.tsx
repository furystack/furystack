import { createComponent, Shade } from '@furystack/shades'
import {
  Button,
  LayoutService,
  PageContainer,
  PageHeader,
  PageLayout,
  Paper,
} from '@furystack/shades-common-components'

const ShowAppBarButton = Shade({
  shadowDomName: 'show-appbar-button',
  render: ({ injector }) => {
    const layoutService = injector.getInstance(LayoutService)
    return (
      <Button variant="outlined" onclick={() => layoutService.appBarVisible.setValue(true)}>
        👁️ Show AppBar
      </Button>
    )
  },
})

const HideAppBarButton = Shade({
  shadowDomName: 'hide-appbar-button',
  render: ({ injector }) => {
    const layoutService = injector.getInstance(LayoutService)
    return (
      <Button variant="outlined" onclick={() => layoutService.appBarVisible.setValue(false)}>
        🙈 Hide AppBar
      </Button>
    )
  },
})

/**
 * Test page: Auto-hide AppBar behavior
 * Used for E2E visual regression testing
 */
export const AutoHideAppBarTest = Shade({
  shadowDomName: 'layout-test-auto-hide',
  render: () => {
    return (
      <PageLayout
        appBar={{
          variant: 'auto-hide',
          component: (
            <div
              data-testid="test-appbar"
              style={{
                background: '#673ab7',
                height: '100%',
                width: '100%',
                display: 'flex',
                alignItems: 'center',
                paddingLeft: '16px',
                color: 'white',
                fontWeight: 'bold',
              }}
            >
              <Button
                style={{ fontSize: '14px', padding: '0px', position: 'fixed', right: '2px', top: '2px' }}
                variant="contained"
                title="Show AppBar"
                data-testid="show-appbar-button"
              >
                🔻
              </Button>
              Auto-Hide AppBar (Deep Purple) - Hover to show
            </div>
          ),
        }}
      >
        <PageContainer
          data-testid="test-content"
          style={{
            background: '#8bc34a',
            color: 'white',
          }}
        >
          <PageHeader
            title="🙈 Auto-Hide AppBar"
            actions={
              <>
                <ShowAppBarButton />
                <HideAppBarButton />
              </>
            }
          />
          <Paper>
            <p>This test page demonstrates the auto-hide AppBar behavior.</p>
            <p>The AppBar is hidden by default and appears when you hover over the top of the page.</p>
            <p>Use the buttons in the header to show or hide the AppBar programmatically.</p>
          </Paper>
        </PageContainer>
      </PageLayout>
    )
  },
})
