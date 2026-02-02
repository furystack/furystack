import { createComponent, Shade } from '@furystack/shades'
import { LayoutService, PageLayout } from '@furystack/shades-common-components'

const ShowHideAppBarButton = Shade({
  shadowDomName: 'show-hide-appbar-button',
  render: ({ injector }) => {
    const layoutService = injector.getInstance(LayoutService)
    return (
      <button type="button" onclick={() => layoutService.appBarVisible.setValue(true)}>
        Show AppBar
      </button>
    )
  },
})

const HideAppBarButton = Shade({
  shadowDomName: 'hide-appbar-button',
  render: ({ injector }) => {
    const layoutService = injector.getInstance(LayoutService)
    return (
      <button type="button" onclick={() => layoutService.appBarVisible.setValue(false)}>
        Hide AppBar
      </button>
    )
  },
})

/**
 * Test page: Auto-hide AppBar behavior
 * Used for E2E visual regression testing
 */
export const AutoHideAppBarTest = Shade({
  shadowDomName: 'layout-test-auto-hide',
  render: ({ injector }) => {
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
              Auto-Hide AppBar (Deep Purple) - Hover to show
            </div>
          ),
        }}
      >
        <div
          data-testid="test-content"
          style={{
            background: '#8bc34a',
            height: `100%`,
            boxSizing: 'border-box',
            padding: '16px',
            color: 'white',
          }}
        >
          <h2>Content Area (Light Green)</h2>
          <p>This test page demonstrates the auto-hide AppBar behavior.</p>
          <p>The AppBar is hidden by default and appears when you hover over the top of the page.</p>
          <div style={{ marginTop: '24px' }}>
            <h3>Controls:</h3>
            <ShowHideAppBarButton />
            <HideAppBarButton />
          </div>
        </div>
      </PageLayout>
    )
  },
})
