import { sleepAsync } from '@sensenet/client-utils'
import { Shade, createComponent, LazyLoad } from '@furystack/shades'

export const LazyLoadDemo = Shade({
  initialState: undefined,
  shadowDomName: 'lazy-load-demo',
  onDetach: () => console.log('Lazy Load Detached'),
  render: () => {
    return (
      <div>
        <LazyLoad
          loader={<div>Loading...</div>}
          component={async () => {
            await sleepAsync(1000)
            return <div>Loaded succesfully.</div>
          }}
        />
        <LazyLoad
          loader={<div>Loading...</div>}
          component={async () => {
            await sleepAsync(2000)
            throw Error('something bad happened :(')
          }}
          error={e => <div style={{ color: 'red' }}>{e.toString()}</div>}
        />
      </div>
    )
  },
})
