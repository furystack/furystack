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
                boxSizing: 'border-box',
                padding: '16px',
                color: 'white',
              }}
            >
              <Typography variant="h6">Left Drawer (Blue)</Typography>
              <Typography variant="body2">Width: 200px</Typography>
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
        <PageHeader icon={<Icon icon={icons.chevronLeft} />} title="AppBar + Left Drawer" />
        <Paper>
          <Typography variant="body1">
            This test page shows a layout with AppBar, left drawer, and content area.
          </Typography>
        </Paper>
      </PageContainer>
    </PageLayout>
  ),
})
