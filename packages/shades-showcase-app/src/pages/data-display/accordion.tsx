import { createComponent, Shade } from '@furystack/shades'
import { Accordion, AccordionItem, PageContainer, PageHeader, Paper } from '@furystack/shades-common-components'

export const AccordionPage = Shade({
  shadowDomName: 'shades-accordion-page',
  render: () => {
    return (
      <PageContainer maxWidth="900px" centered>
        <PageHeader
          icon="🪗"
          title="Accordion"
          description="Accordions display collapsible sections of content. They are useful for reducing clutter and letting users focus on relevant information."
        />

        <Paper elevation={3} style={{ padding: '32px', display: 'flex', flexDirection: 'column', gap: '32px' }}>
          <h3 style={{ margin: '0' }}>Basic Accordion</h3>
          <Accordion>
            <AccordionItem title="What is FuryStack?" defaultExpanded>
              <p style={{ margin: '0' }}>
                FuryStack is a modular TypeScript framework for building modern web applications. It includes a
                component library (Shades), dependency injection, REST service layer, and more.
              </p>
            </AccordionItem>
            <AccordionItem title="How does the Shades framework work?">
              <p style={{ margin: '0' }}>
                Shades is a lightweight UI framework built on Web Components and Shadow DOM. Components are created
                using the <code>Shade()</code> factory function with built-in CSS-in-JS, lifecycle hooks, and dependency
                injection support.
              </p>
            </AccordionItem>
            <AccordionItem title="What about theming?">
              <p style={{ margin: '0' }}>
                FuryStack provides a theming system based on CSS custom properties. You can customize palette colors,
                typography, spacing, shadows, and transitions through the ThemeProviderService.
              </p>
            </AccordionItem>
          </Accordion>

          <h3 style={{ margin: '0' }}>With Icons</h3>
          <Accordion>
            <AccordionItem title="Settings" icon="⚙️">
              <p style={{ margin: '0' }}>Configure your application preferences and customize the behavior.</p>
            </AccordionItem>
            <AccordionItem title="Notifications" icon="🔔" defaultExpanded>
              <p style={{ margin: '0' }}>Manage your notification preferences and view recent alerts.</p>
            </AccordionItem>
            <AccordionItem title="Security" icon="🔒">
              <p style={{ margin: '0' }}>
                Review security settings, manage passwords, and configure two-factor authentication.
              </p>
            </AccordionItem>
          </Accordion>

          <h3 style={{ margin: '0' }}>Elevation Variant</h3>
          <Accordion variant="elevation">
            <AccordionItem title="First section" defaultExpanded>
              <p style={{ margin: '0' }}>
                This accordion uses the elevation variant for a raised card-like appearance with a shadow instead of a
                border.
              </p>
            </AccordionItem>
            <AccordionItem title="Second section">
              <p style={{ margin: '0' }}>Each section can be expanded or collapsed independently.</p>
            </AccordionItem>
          </Accordion>

          <h3 style={{ margin: '0' }}>Disabled Items</h3>
          <Accordion>
            <AccordionItem title="Available section" defaultExpanded>
              <p style={{ margin: '0' }}>This section can be expanded and collapsed normally.</p>
            </AccordionItem>
            <AccordionItem title="Disabled section" disabled>
              <p style={{ margin: '0' }}>This content is not reachable because the section is disabled.</p>
            </AccordionItem>
            <AccordionItem title="Another available section">
              <p style={{ margin: '0' }}>This section works normally despite the disabled sibling above.</p>
            </AccordionItem>
          </Accordion>

          <h3 style={{ margin: '0' }}>Rich Content</h3>
          <Accordion>
            <AccordionItem title="Nested Lists" icon="📋" defaultExpanded>
              <ul style={{ margin: '0', paddingLeft: '20px' }}>
                <li>First item with some detail text</li>
                <li>Second item with additional context</li>
                <li>Third item wrapping up the list</li>
              </ul>
            </AccordionItem>
            <AccordionItem title="Code Example" icon="💻">
              <pre
                style={{
                  margin: '0',
                  padding: '12px',
                  borderRadius: '4px',
                  backgroundColor: 'rgba(0,0,0,0.1)',
                  overflow: 'auto',
                  fontSize: '13px',
                }}
              >
                {`const greeting = Shade({
  shadowDomName: 'my-greeting',
  render: () => <h1>Hello, World!</h1>,
})`}
              </pre>
            </AccordionItem>
          </Accordion>
        </Paper>
      </PageContainer>
    )
  },
})
