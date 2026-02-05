import { createComponent, Shade } from '@furystack/shades'

export const FormControlsOverview = Shade({
  shadowDomName: 'showcase-form-controls-overview',
  render: () => {
    return (
      <div
        style={{
          padding: '2rem',
          maxWidth: '800px',
          margin: '0 auto',
        }}
      >
        <h1>Form Controls</h1>
        <p>
          Interactive input components for building forms and capturing user input. These components follow
          accessibility best practices and support various input types.
        </p>

        <section style={{ marginTop: '2rem' }}>
          <h2>Available Components</h2>
          <ul style={{ lineHeight: '2' }}>
            <li>
              <strong>Buttons</strong> - Various button styles and states
            </li>
            <li>
              <strong>Inputs</strong> - Text inputs, number inputs, and other form fields
            </li>
            <li>
              <strong>Form</strong> - Complete form examples with validation
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
