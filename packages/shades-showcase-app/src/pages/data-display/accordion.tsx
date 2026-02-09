import { createComponent, Shade } from '@furystack/shades'
import {
  Accordion,
  AccordionItem,
  PageContainer,
  PageHeader,
  Paper,
  Typography,
} from '@furystack/shades-common-components'

export const AccordionPage = Shade({
  shadowDomName: 'shades-accordion-page',
  render: () => {
    return (
      <PageContainer centered>
        <PageHeader
          icon="🪗"
          title="Accordion"
          description="Accordions display collapsible sections of content. They are useful for reducing clutter and letting users focus on relevant information."
        />

        <Paper elevation={3} style={{ padding: '32px', display: 'flex', flexDirection: 'column', gap: '32px' }}>
          <Typography variant="h3" style={{ margin: '0' }}>
            Basic Accordion
          </Typography>
          <Accordion>
            <AccordionItem title="What is FuryStack?" defaultExpanded>
              <Typography variant="body1" style={{ margin: '0' }}>
                FuryStack is a modular TypeScript framework for building modern web applications. It includes a
                component library (Shades), dependency injection, REST service layer, and more.
              </Typography>
            </AccordionItem>
            <AccordionItem title="How does the Shades framework work?">
              <Typography variant="body1" style={{ margin: '0' }}>
                Shades is a lightweight UI framework built on Web Components and Shadow DOM. Components are created
                using the <code>Shade()</code> factory function with built-in CSS-in-JS, lifecycle hooks, and dependency
                injection support.
              </Typography>
            </AccordionItem>
            <AccordionItem title="What about theming?">
              <Typography variant="body1" style={{ margin: '0' }}>
                FuryStack provides a theming system based on CSS custom properties. You can customize palette colors,
                typography, spacing, shadows, and transitions through the ThemeProviderService.
              </Typography>
            </AccordionItem>
          </Accordion>

          <Typography variant="h3" style={{ margin: '0' }}>
            With Icons
          </Typography>
          <Accordion>
            <AccordionItem title="Settings" icon="⚙️">
              <Typography variant="body1" style={{ margin: '0' }}>
                Configure your application preferences and customize the behavior.
              </Typography>
            </AccordionItem>
            <AccordionItem title="Notifications" icon="🔔" defaultExpanded>
              <Typography variant="body1" style={{ margin: '0' }}>
                Manage your notification preferences and view recent alerts.
              </Typography>
            </AccordionItem>
            <AccordionItem title="Security" icon="🔒">
              <Typography variant="body1" style={{ margin: '0' }}>
                Review security settings, manage passwords, and configure two-factor authentication.
              </Typography>
            </AccordionItem>
          </Accordion>

          <Typography variant="h3" style={{ margin: '0' }}>
            Elevation Variant
          </Typography>
          <Accordion variant="elevation">
            <AccordionItem title="First section" defaultExpanded>
              <Typography variant="body1" style={{ margin: '0' }}>
                This accordion uses the elevation variant for a raised card-like appearance with a shadow instead of a
                border.
              </Typography>
            </AccordionItem>
            <AccordionItem title="Second section">
              <Typography variant="body1" style={{ margin: '0' }}>
                Each section can be expanded or collapsed independently.
              </Typography>
            </AccordionItem>
          </Accordion>

          <Typography variant="h3" style={{ margin: '0' }}>
            Disabled Items
          </Typography>
          <Accordion>
            <AccordionItem title="Available section" defaultExpanded>
              <Typography variant="body1" style={{ margin: '0' }}>
                This section can be expanded and collapsed normally.
              </Typography>
            </AccordionItem>
            <AccordionItem title="Disabled section" disabled>
              <Typography variant="body1" style={{ margin: '0' }}>
                This content is not reachable because the section is disabled.
              </Typography>
            </AccordionItem>
            <AccordionItem title="Another available section">
              <Typography variant="body1" style={{ margin: '0' }}>
                This section works normally despite the disabled sibling above.
              </Typography>
            </AccordionItem>
          </Accordion>

          <Typography variant="h3" style={{ margin: '0' }}>
            Rich Content
          </Typography>
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
