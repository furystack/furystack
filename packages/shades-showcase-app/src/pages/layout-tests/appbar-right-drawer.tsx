import { createComponent, Shade } from '@furystack/shades'
import { PageLayout } from '@furystack/shades-common-components'

/**
 * Test page: AppBar with right drawer
 * Used for E2E visual regression testing
 */
export const AppBarRightDrawerTest = Shade({
  shadowDomName: 'layout-test-appbar-right-drawer',
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
            AppBar + Right Drawer (Pink)
          </div>
        ),
      }}
      drawer={{
        right: {
          variant: 'permanent',
          width: '150px',
          component: (
            <div
              data-testid="test-drawer-right"
              style={{
                background: '#4caf50',
                height: '100%',
                padding: '16px',
                color: 'white',
              }}
            >
              <h3>Right Drawer (Green)</h3>
              <p>Width: 150px</p>
            </div>
          ),
        },
      }}
    >
      <div
        data-testid="test-content"
        style={{
          background: '#ff9800',
          height: `100%`,
          boxSizing: 'border-box',
          padding: '16px',
          color: 'white',
        }}
      >
        <h2>Content Area (Orange)</h2>
        <p>This test page shows a layout with AppBar, right drawer, and content area.</p>
      </div>
    </PageLayout>
  ),
})
