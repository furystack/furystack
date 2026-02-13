import { createComponent, Shade } from '@furystack/shades'
import { Icon, icons } from '@furystack/shades-common-components'

/**
 * 404 page displayed when no route matches the current URL.
 */
export const NotFoundPage = Shade({
  shadowDomName: 'showcase-not-found-page',
  render: () => (
    <div style={{ paddingTop: '50px', textAlign: 'center' }}>
      <h1>
        404 <Icon icon={icons.search} size="large" />
      </h1>
      <p>Page not found</p>
    </div>
  ),
})
