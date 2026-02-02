import { createComponent, Shade } from '@furystack/shades'
import { LAYOUT_CSS_VARIABLES, PageLayout } from '@furystack/shades-common-components'

/**
 * Test page: AppBar with left drawer
 * Used for E2E visual regression testing
 */
export const AppBarLeftDrawerTest = Shade({
  shadowDomName: 'layout-test-appbar-left-drawer',
  render: () => (
    <PageLayout
      appBar={{
        variant: 'permanent',
        component: (
          <div
            data-testid="test-appbar"
            style={{
              background: '#e91e63',
              height: '100%',
              width: '100%',
              display: 'flex',
              alignItems: 'center',
              paddingLeft: '16px',
              color: 'white',
              fontWeight: 'bold',
            }}
          >
            AppBar + Left Drawer (Pink)
          </div>
        ),
      }}
      drawer={{
        left: {
          variant: 'permanent',
          width: '200px',
          component: (
            <div
              data-testid="test-drawer-left"
              style={{
                background: '#2196f3',
                height: '100%',
                padding: '16px',
                color: 'white',
              }}
            >
              <h3>Left Drawer (Blue)</h3>
              <p>Width: 200px</p>
            </div>
          ),
        },
      }}
    >
      <div
        data-testid="test-content"
        style={{
          background: '#ff9800',
          height: `var(${LAYOUT_CSS_VARIABLES.contentAvailableHeight})`,
          padding: '16px',
          color: 'white',
        }}
      >
        <h2>Content Area (Orange)</h2>
        <p>This test page shows a layout with AppBar, left drawer, and content area.</p>
      </div>
    </PageLayout>
  ),
})
