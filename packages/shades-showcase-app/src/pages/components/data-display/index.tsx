import { createComponent, Shade } from '@furystack/shades'

export const DataDisplayOverview = Shade({
  shadowDomName: 'showcase-data-display-overview',
  render: () => {
    return (
      <div
        style={{
          padding: '2rem',
          maxWidth: '800px',
          margin: '0 auto',
        }}
      >
        <h1>Data Display</h1>
        <p>
          Components for organizing and displaying structured data. These components help present information in a
          clear, accessible way with features like sorting, filtering, and pagination.
        </p>

        <section style={{ marginTop: '2rem' }}>
          <h2>Available Components</h2>
          <ul style={{ lineHeight: '2' }}>
            <li>
              <strong>Grid</strong> - Data grid with sorting, filtering, and pagination
            </li>
            <li>
              <strong>Tabs</strong> - Tab navigation for organizing content
            </li>
          </ul>
        </section>

        <p style={{ marginTop: '2rem', fontStyle: 'italic' }}>
          Select a component from the navigation to see examples and usage.
        </p>
      </div>
    )
  },
})
