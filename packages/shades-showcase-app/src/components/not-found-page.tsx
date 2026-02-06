import { createComponent, Shade } from '@furystack/shades'

/**
 * 404 page displayed when no route matches the current URL.
 */
export const NotFoundPage = Shade({
  shadowDomName: 'showcase-not-found-page',
  render: () => (
    <div style={{ paddingTop: '50px', textAlign: 'center' }}>
      <h1>404 🔍</h1>
      <p>Have you seen this cat? 😸</p>
    </div>
  ),
})
