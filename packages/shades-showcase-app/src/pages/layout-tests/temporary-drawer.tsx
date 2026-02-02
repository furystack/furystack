import { createComponent, Shade } from '@furystack/shades'
import { LayoutService, PageLayout } from '@furystack/shades-common-components'

const OpenDrawerButton = Shade<{ position: 'left' | 'right' }>({
  shadowDomName: 'open-drawer-button',
  render: ({ props, injector }) => {
    const layoutService = injector.getInstance(LayoutService)
    return (
      <button
        type="button"
        onclick={() => layoutService.setDrawerOpen(props.position, true)}
        style={{
          padding: '8px 16px',
          cursor: 'pointer',
        }}
      >
        Open {props.position === 'left' ? 'Left' : 'Right'} Drawer
      </button>
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
        <div
          data-testid="test-content"
          style={{
            background: '#cddc39',
            height: `100%`,
            boxSizing: 'border-box',
            padding: '16px',
            color: '#333',
          }}
        >
          <h2>Content Area (Lime)</h2>
          <p>This test page shows a layout with temporary (overlay) drawers.</p>
          <p>Temporary drawers appear over the content with a backdrop overlay.</p>
          <p>Click the backdrop to close them.</p>
          <div style={{ marginTop: '24px', display: 'flex', gap: '16px' }}>
            <OpenDrawerButton position="left" />
            <OpenDrawerButton position="right" />
          </div>
        </div>
      </PageLayout>
    )
  },
})
