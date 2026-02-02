import { createComponent, RouteLink, Shade } from '@furystack/shades'
import { AppBar, cssVariableTheme, PageLayout } from '@furystack/shades-common-components'

/**
 * Index page for layout tests - lists all available test pages
 */
export const LayoutTestsIndex = Shade({
  shadowDomName: 'layout-tests-index',
  render: () => {
    const testPages = [
      {
        url: '/layout-tests/appbar-only',
        title: 'AppBar Only',
        description: 'Layout with only an AppBar and content area',
        color: '#e91e63',
      },
      {
        url: '/layout-tests/appbar-left-drawer',
        title: 'AppBar + Left Drawer',
        description: 'Layout with AppBar and a permanent left drawer',
        color: '#2196f3',
      },
      {
        url: '/layout-tests/appbar-right-drawer',
        title: 'AppBar + Right Drawer',
        description: 'Layout with AppBar and a permanent right drawer',
        color: '#4caf50',
      },
      {
        url: '/layout-tests/appbar-both-drawers',
        title: 'AppBar + Both Drawers',
        description: 'Layout with AppBar and both left and right permanent drawers',
        color: '#ff9800',
      },
      {
        url: '/layout-tests/collapsible-drawer',
        title: 'Collapsible Drawer',
        description: 'Layout with a collapsible drawer that can be toggled open/closed',
        color: '#9c27b0',
      },
      {
        url: '/layout-tests/auto-hide-appbar',
        title: 'Auto-Hide AppBar',
        description: 'Layout with an AppBar that hides when not hovered',
        color: '#673ab7',
      },
      {
        url: '/layout-tests/responsive-layout',
        title: 'Responsive Layout',
        description: 'Layout with a drawer that responds to screen size changes',
        color: '#607d8b',
      },
      {
        url: '/layout-tests/temporary-drawer',
        title: 'Temporary Drawer',
        description: 'Layout with temporary (overlay) drawers that appear over content with a backdrop',
        color: '#009688',
      },
    ]

    return (
      <PageLayout
        appBar={{
          variant: 'permanent',
          component: (
            <AppBar>
              <RouteLink
                href="/"
                style={{
                  color: cssVariableTheme.text.primary,
                  textDecoration: 'none',
                  padding: '8px 16px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                }}
              >
                <span style={{ fontSize: '20px' }}>←</span>
                <span>Back to Showcase App</span>
              </RouteLink>
              <h3 style={{ margin: '0', flex: '1' }}>Layout Test Pages</h3>
            </AppBar>
          ),
        }}
        topGap="16px"
      >
        <div style={{ padding: '24px', maxWidth: '800px', margin: '0 auto' }}>
          <p style={{ color: cssVariableTheme.text.secondary, marginBottom: '24px' }}>
            These test pages are designed for E2E visual regression testing. Each page demonstrates a different
            PageLayout configuration with colored backgrounds to make layout boundaries visible.
          </p>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            {testPages.map((page) => (
              <RouteLink
                href={page.url}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '16px',
                  padding: '16px',
                  borderRadius: '8px',
                  textDecoration: 'none',
                  backgroundColor: cssVariableTheme.background.paper,
                  border: `1px solid ${cssVariableTheme.divider}`,
                  transition: 'box-shadow 0.2s ease',
                }}
              >
                <div
                  style={{
                    width: '48px',
                    height: '48px',
                    borderRadius: '8px',
                    backgroundColor: page.color,
                    flexShrink: '0',
                  }}
                />
                <div>
                  <div style={{ color: cssVariableTheme.text.primary, fontWeight: 'bold' }}>{page.title}</div>
                  <div style={{ color: cssVariableTheme.text.secondary, fontSize: '14px' }}>{page.description}</div>
                </div>
              </RouteLink>
            ))}
          </div>
        </div>
      </PageLayout>
    )
  },
})
