import { createComponent, Shade } from '@furystack/shades'
import { Paper } from '@furystack/shades-common-components'
import { NippleComponent } from '@furystack/shades-nipple'

export const NipplePage = Shade({
  shadowDomName: 'nipple-page',
  css: { height: '100%', padding: '16px' },
  render: ({ element }) => {
    return (
      <Paper elevation={3} style={{ height: '100%', position: 'relative', padding: '16px', overflow: 'auto' }}>
        <h1 style={{ margin: '0 0 16px 0' }}>Nipple</h1>
        <code
          className="nipple-container"
          style={{
            position: 'absolute',
            top: '48px',
            left: '16px',
            whiteSpace: 'pre-wrap',
            zIndex: '10',
          }}
        ></code>
        <NippleComponent
          style={{
            position: 'absolute',
            top: '48px',
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
            ;(element.querySelector('.nipple-container') as HTMLDivElement).textContent = JSON.stringify(
              newData,
              undefined,
              2,
            )
          }}
        />
      </Paper>
    )
  },
})
