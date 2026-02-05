import { createComponent, Shade } from '@furystack/shades'

export const LayoutsOverview = Shade({
  shadowDomName: 'showcase-layouts-overview',
  render: () => {
    return (
      <div
        style={{
          padding: '2rem',
          maxWidth: '800px',
          margin: '0 auto',
        }}
      >
        <h1>Layouts</h1>
        <p>
          FuryStack provides a flexible layout system based on the <code>PageLayout</code> component. This system
          supports various configurations of AppBars and Drawers to create responsive, accessible application layouts.
        </p>

        <section style={{ marginTop: '2rem' }}>
          <h2>Layout System Features</h2>
          <ul style={{ lineHeight: '2' }}>
            <li>Configurable AppBar positioning (permanent, auto-hide)</li>
            <li>Left and right drawer support</li>
            <li>Multiple drawer variants (permanent, collapsible, temporary)</li>
            <li>Responsive behavior with breakpoint support</li>
            <li>Smooth animations and transitions</li>
            <li>Keyboard navigation and accessibility</li>
          </ul>
        </section>

        <section style={{ marginTop: '2rem' }}>
          <h2>Layout Variants</h2>
          <p>
            Explore different layout configurations in the <strong>Layout Variants</strong> section. Each variant
            demonstrates a specific combination of AppBar and Drawer configurations with practical examples.
          </p>
        </section>

        <section style={{ marginTop: '2rem' }}>
          <h3>Basic Usage</h3>
          <pre
            style={{
              backgroundColor: '#f5f5f5',
              padding: '1rem',
              borderRadius: '4px',
              overflow: 'auto',
            }}
          >
            {`<PageLayout
  appBar={{
    variant: "permanent",
    component: <AppBar>...</AppBar>,
  }}
  drawer={{
    left: {
      variant: "collapsible",
      width: "280px",
      component: <NavigationMenu />,
    },
  }}
>
  {/* Your content here */}
</PageLayout>`}
          </pre>
        </section>

        <p style={{ marginTop: '2rem', fontStyle: 'italic' }}>
          Navigate to the Layout Variants section to see live examples of each configuration.
        </p>
      </div>
    )
  },
})
