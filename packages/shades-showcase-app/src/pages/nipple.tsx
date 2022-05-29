import { createComponent, Shade } from '@furystack/shades'
import { NippleComponent } from '@furystack/shades-nipple'

export const NipplePage = Shade({
  shadowDomName: 'nipple-page',
  render: ({ element }) => {
    return (
      <div
        style={{
          position: 'fixed',
          top: '32px',
          left: '0',
          width: '100%',
          height: '100%',
        }}
      >
        <h1>Nipple</h1>
        <code
          className="nipple-container"
          style={{
            position: 'absolute',
            top: '0',
            left: '0',
            whiteSpace: 'pre-wrap',
          }}
        ></code>
        <NippleComponent
          style={{
            position: 'absolute',
            top: '0',
            left: '0',
            width: '100%',
            height: '100%',
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
      </div>
    )
  },
})
