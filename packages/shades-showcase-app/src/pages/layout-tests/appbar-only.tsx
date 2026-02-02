import { createComponent, Shade } from '@furystack/shades'
import { LAYOUT_CSS_VARIABLES, PageLayout } from '@furystack/shades-common-components'

/**
 * Test page: AppBar only (no drawers)
 * Used for E2E visual regression testing
 */
export const AppBarOnlyTest = Shade({
  shadowDomName: 'layout-test-appbar-only',
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
            AppBar Only (Pink)
          </div>
        ),
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
        <p>This test page shows a layout with only an AppBar and content area.</p>
      </div>
    </PageLayout>
  ),
})
