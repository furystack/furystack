import { createComponent, Shade } from '@furystack/shades'
import { PageContainer, PageHeader, Paper } from '@furystack/shades-common-components'
import { NippleComponent } from '@furystack/shades-nipple'

export const NipplePage = Shade({
  shadowDomName: 'nipple-page',
  render: ({ useRef }) => {
    const outputRef = useRef<HTMLElement>('output')

    return (
      <PageContainer fullHeight>
        <PageHeader
          icon="🕹️"
          title="Virtual Joystick"
          description="NippleComponent provides a virtual joystick control for touch-based interfaces, useful for game controls or directional input on mobile devices. Built on the nipplejs library, it supports static or dynamic positioning, customizable colors, and emits movement events with direction, angle, distance, and force data that can drive application logic."
        />
        <Paper elevation={3} style={{ flex: '1', position: 'relative', overflow: 'auto' }}>
          <code
            ref={outputRef}
            className="nipple-container"
            style={{
              position: 'absolute',
              top: '16px',
              left: '16px',
              whiteSpace: 'pre-wrap',
              zIndex: '10',
            }}
          ></code>
          <NippleComponent
            style={{
              position: 'absolute',
              top: '0',
              left: '0',
              right: '0',
              bottom: '0',
            }}
            managerOptions={{
              mode: 'static',
              color: 'black',
              position: { left: '50%', top: '50%' },
            }}
            onMove={(_evt, newData) => {
              if (outputRef.current) {
                outputRef.current.textContent = JSON.stringify(newData, undefined, 2)
              }
            }}
          />
        </Paper>
      </PageContainer>
    )
  },
})
