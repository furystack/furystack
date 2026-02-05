import { createComponent, Shade } from '@furystack/shades'

export const ComponentsOverview = Shade({
  shadowDomName: 'showcase-components-overview',
  render: () => {
    return (
      <div
        style={{
          padding: '2rem',
          maxWidth: '800px',
          margin: '0 auto',
        }}
      >
        <h1>Components</h1>
        <p>
          Explore the component library organized into categories below. Each category contains related components with
          examples and documentation.
        </p>

        <section style={{ marginTop: '2rem' }}>
          <h2>Categories</h2>
          <ul style={{ lineHeight: '2' }}>
            <li>
              <strong>Form Controls</strong> - Interactive input components like buttons, inputs, and forms
            </li>
            <li>
              <strong>Data Display</strong> - Components for displaying structured data like grids and tabs
            </li>
            <li>
              <strong>Feedback</strong> - Notification and alert components
            </li>
          </ul>
        </section>

        <p style={{ marginTop: '2rem', fontStyle: 'italic' }}>
          Use the navigation menu to explore individual components.
        </p>
      </div>
    )
  },
})
