import { createComponent, Shade } from '@furystack/shades'
import { LAYOUT_CSS_VARIABLES, LayoutService, PageLayout } from '@furystack/shades-common-components'

/**
 * Test page: Auto-hide AppBar behavior
 * Used for E2E visual regression testing
 */
export const AutoHideAppBarTest = Shade({
  shadowDomName: 'layout-test-auto-hide',
  render: ({ injector }) => {
    const layoutService = injector.getInstance(LayoutService)

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
            height: `var(${LAYOUT_CSS_VARIABLES.contentAvailableHeight})`,
            padding: '16px',
            color: 'white',
          }}
        >
          <h2>Content Area (Light Green)</h2>
          <p>This test page demonstrates the auto-hide AppBar behavior.</p>
          <p>The AppBar is hidden by default and appears when you hover over the top of the page.</p>
          <div style={{ marginTop: '24px' }}>
            <h3>Controls:</h3>
            <button
              type="button"
              onclick={() => layoutService.appBarVisible.setValue(true)}
              style={{
                marginRight: '8px',
                padding: '8px 16px',
                cursor: 'pointer',
              }}
            >
              Show AppBar
            </button>
            <button
              type="button"
              onclick={() => layoutService.appBarVisible.setValue(false)}
              style={{
                padding: '8px 16px',
                cursor: 'pointer',
              }}
            >
              Hide AppBar
            </button>
          </div>
        </div>
      </PageLayout>
    )
  },
})
