import { createComponent, Shade } from '@furystack/shades'
import {
  Button,
  Icon,
  icons,
  LayoutService,
  PageContainer,
  PageHeader,
  PageLayout,
  Paper,
} from '@furystack/shades-common-components'

const OpenLeftDrawerButton = Shade({
  shadowDomName: 'open-left-drawer-button',
  render: ({ injector }) => {
    const layoutService = injector.getInstance(LayoutService)
    return (
      <Button variant="outlined" onclick={() => layoutService.setDrawerOpen('left', true)}>
        <Icon icon={icons.chevronLeft} size="small" /> Open Left
      </Button>
    )
  },
})

const OpenRightDrawerButton = Shade({
  shadowDomName: 'open-right-drawer-button',
  render: ({ injector }) => {
    const layoutService = injector.getInstance(LayoutService)
    return (
      <Button variant="outlined" onclick={() => layoutService.setDrawerOpen('right', true)}>
        <Icon icon={icons.chevronRight} size="small" /> Open Right
      </Button>
    )
  },
})

/**
 * Test page: Temporary drawer with overlay backdrop
 * Used for E2E visual regression testing
 */
export const TemporaryDrawerTest = Shade({
  shadowDomName: 'layout-test-temporary-drawer',
  render: () => {
    return (
      <PageLayout
        appBar={{
          variant: 'permanent',
          component: (
            <div
              data-testid="test-appbar"
              style={{
                background: '#009688',
                height: '100%',
                width: '100%',
                display: 'flex',
                alignItems: 'center',
                paddingLeft: '16px',
                color: 'white',
                fontWeight: 'bold',
              }}
            >
              Temporary Drawer Test (Teal)
            </div>
          ),
        }}
        drawer={{
          left: {
            variant: 'temporary',
            width: '280px',
            defaultOpen: false,
            component: (
              <div
                data-testid="test-drawer-left"
                style={{
                  background: '#ff5722',
                  height: '100%',
                  boxSizing: 'border-box',
                  padding: '16px',
                  color: 'white',
                }}
              >
                <h3>Left Temporary Drawer (Deep Orange)</h3>
                <p>Width: 280px</p>
                <p>Click the backdrop or outside to close this drawer.</p>
              </div>
            ),
          },
          right: {
            variant: 'temporary',
            width: '240px',
            defaultOpen: false,
            component: (
              <div
                data-testid="test-drawer-right"
                style={{
                  background: '#795548',
                  height: '100%',
                  boxSizing: 'border-box',
                  padding: '16px',
                  color: 'white',
                }}
              >
                <h3>Right Temporary Drawer (Brown)</h3>
                <p>Width: 240px</p>
                <p>Click the backdrop or outside to close this drawer.</p>
              </div>
            ),
          },
        }}
      >
        <PageContainer
          data-testid="test-content"
          style={{
            background: '#cddc39',
            color: '#333',
          }}
        >
          <PageHeader
            icon={<Icon icon={icons.appWindow} />}
            title="Temporary Drawers"
            actions={
              <>
                <OpenLeftDrawerButton />
                <OpenRightDrawerButton />
              </>
            }
          />
          <Paper>
            <p>This test page shows a layout with temporary (overlay) drawers.</p>
            <p>Temporary drawers appear over the content with a backdrop overlay.</p>
            <p>Click the backdrop to close them, or use the buttons in the header to open them.</p>
          </Paper>
        </PageContainer>
      </PageLayout>
    )
  },
})
