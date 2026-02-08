import { createComponent, Shade } from '@furystack/shades'
import { PageContainer, PageHeader, PageLayout, Paper } from '@furystack/shades-common-components'

/**
 * Test page: AppBar with both left and right drawers
 * Used for E2E visual regression testing
 */
export const AppBarBothDrawersTest = Shade({
  tagName: 'layout-test-both-drawers',
  render: () => (
    <PageLayout
      topGap="16px"
      sideGap="16px"
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
            AppBar + Both Drawers (Pink)
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
                boxSizing: 'border-box',
                padding: '16px',
                color: 'white',
              }}
            >
              <h3>Left Drawer (Blue)</h3>
              <p>Width: 200px</p>
            </div>
          ),
        },
        right: {
          variant: 'permanent',
          width: '150px',
          component: (
            <div
              data-testid="test-drawer-right"
              style={{
                background: '#4caf50',
                height: '100%',
                boxSizing: 'border-box',
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
      <PageContainer
        data-testid="test-content"
        style={{
          background: '#ff9800',
          color: 'white',
        }}
      >
        <PageHeader title="↔️ AppBar + Both Drawers" />
        <Paper>
          <p>This test page shows a layout with AppBar, left drawer, right drawer, and content area.</p>
        </Paper>
      </PageContainer>
    </PageLayout>
  ),
})
