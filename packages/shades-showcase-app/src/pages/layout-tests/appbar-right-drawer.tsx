import { createComponent, Shade } from '@furystack/shades'
import {
  Icon,
  icons,
  PageContainer,
  PageHeader,
  PageLayout,
  Paper,
  Typography,
} from '@furystack/shades-common-components'

/**
 * Test page: AppBar with right drawer
 * Used for E2E visual regression testing
 */
export const AppBarRightDrawerTest = Shade({
  customElementName: 'layout-test-appbar-right-drawer',
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
              <Typography variant="h6">Right Drawer (Green)</Typography>
              <Typography variant="body2">Width: 150px</Typography>
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
        <PageHeader icon={<Icon icon={icons.chevronRight} />} title="AppBar + Right Drawer" />
        <Paper>
          <Typography variant="body1">
            This test page shows a layout with AppBar, right drawer, and content area.
          </Typography>
        </Paper>
      </PageContainer>
    </PageLayout>
  ),
})
