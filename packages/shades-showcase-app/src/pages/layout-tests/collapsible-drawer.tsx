import { createComponent, Shade } from '@furystack/shades'
import {
  Button,
  DrawerToggleButton,
  Icon,
  icons,
  LayoutService,
  PageContainer,
  PageHeader,
  PageLayout,
  Paper,
  Typography,
} from '@furystack/shades-common-components'

const ToggleDrawerButton = Shade({
  customElementName: 'toggle-drawer-button-collapsible',
  render: ({ injector }) => {
    const layoutService = injector.get(LayoutService)
    return (
      <Button variant="outlined" onclick={() => layoutService.toggleDrawer('left')}>
        <Icon icon={icons.ruler} size="small" /> Toggle Drawer
      </Button>
    )
  },
})

/**
 * Test page: Collapsible drawer with toggle button
 * Used for E2E visual regression testing
 */
export const CollapsibleDrawerTest = Shade({
  customElementName: 'layout-test-collapsible',
  render: () => {
    return (
      <PageLayout
        appBar={{
          variant: 'permanent',
          component: (
            <div
              data-testid="test-appbar"
              style={{
                background: '#9c27b0',
                height: '100%',
                width: '100%',
                display: 'flex',
                alignItems: 'center',
                paddingLeft: '8px',
                color: 'white',
                fontWeight: 'bold',
                gap: '8px',
              }}
            >
              <DrawerToggleButton position="left" />
              <span>Collapsible Drawer Test (Purple)</span>
            </div>
          ),
        }}
        drawer={{
          left: {
            variant: 'collapsible',
            width: '240px',
            defaultOpen: true,
            component: (
              <div
                data-testid="test-drawer-left"
                style={{
                  background: '#00bcd4',
                  height: '100%',
                  boxSizing: 'border-box',
                  padding: '16px',
                  color: 'white',
                }}
              >
                <Typography variant="h6">Collapsible Drawer (Cyan)</Typography>
                <Typography variant="body2">Width: 240px</Typography>
                <Typography variant="body2">Click the hamburger icon in the AppBar to toggle this drawer.</Typography>
              </div>
            ),
          },
        }}
      >
        <PageContainer
          data-testid="test-content"
          style={{
            background: '#ffeb3b',
            color: '#333',
          }}
        >
          <PageHeader icon={<Icon icon={icons.ruler} />} title="Collapsible Drawer" actions={<ToggleDrawerButton />} />
          <Paper>
            <Typography variant="body1">This test page shows a layout with a collapsible drawer.</Typography>
            <Typography variant="body1">
              Use the hamburger icon in the AppBar or the button in the header to toggle the drawer.
            </Typography>
          </Paper>
        </PageContainer>
      </PageLayout>
    )
  },
})
