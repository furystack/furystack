import { Shade, createComponent } from '@furystack/shades'

export const HomePage = Shade({
  shadowDomName: 'shade-app-home-page',
  render: () => {
    return (
      <div
        style={{
          margin: '0 2em',
          textAlign: 'justify',
        }}>
        <h1> 🎉 Welcome to Shade App Demo!</h1>
        <hr />
        <p>
          The application's main purpose is to showcase the outstanding features of the{' '}
          <strong>Shades UI Library </strong> with a few example component.
        </p>
        <p>
          Shade is the UI layer of{' '}
          <a href="https://furystack.github.io/" target="_blank">
            FuryStack
          </a>
          , it uses the JSX syntax for rendering, embraces the concept of unidirectional data flow and uses the Shadow
          DOM. It also comes with some cool built-in features like lazy loading and routing.
        </p>
        <p>
          {' '}
          👉 You can check the source code in the{' '}
          <a href="https://github.com/furystack/furystack" target="_blank">
            FuryStack
          </a>{' '}
          monorepo.
        </p>
        <h2>✨ Demos</h2>
        <h3>Routing</h3>
        <p>
          This demo uses the bundled Shades routing for navigation, built on the top of the native browser History API.
          Each menu in the header uses their own route, their dependencies will be loaded separately.
        </p>
        <h3>Lazy Load demo</h3>
        <p>
          The page shows how a component (or its internal value) can be lazy-loaded. The firt component will load after
          1s, the second one fails after 2s.
        </p>
        <h3>Counter demo</h3>
        <p>
          This page was created for performance measurement. It renders a dozens of counters with random initial values.
          Each and every counter can be adjusted separately and the whole suff can be re-randomized.
        </p>
      </div>
    )
  },
})
