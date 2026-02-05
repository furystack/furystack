import { createComponent, Shade } from '@furystack/shades'

export const AdvancedOverview = Shade({
  shadowDomName: 'showcase-advanced-overview',
  render: () => {
    return (
      <div
        style={{
          padding: '2rem',
          maxWidth: '800px',
          margin: '0 auto',
        }}
      >
        <h1>Advanced</h1>
        <p>
          Advanced features and integrations including code editors, animations, micro frontends, internationalization,
          and specialized UI controls.
        </p>

        <section style={{ marginTop: '2rem' }}>
          <h2>Available Features</h2>
          <ul style={{ lineHeight: '2' }}>
            <li>
              <strong>Monaco Editor</strong> - Code editor integration with syntax highlighting
            </li>
            <li>
              <strong>Lottie Animations</strong> - Vector animation support
            </li>
            <li>
              <strong>Nipple Controller</strong> - Touch joystick control
            </li>
            <li>
              <strong>Micro Frontends</strong> - MFE integration patterns
            </li>
            <li>
              <strong>Internationalization</strong> - Multi-language support
            </li>
            <li>
              <strong>Wizard</strong> - Multi-step form workflows
            </li>
          </ul>
        </section>

        <p style={{ marginTop: '2rem', fontStyle: 'italic' }}>
          Select a feature from the navigation to see examples and usage.
        </p>
      </div>
    )
  },
})
