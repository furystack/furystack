import { createComponent, Shade } from '@furystack/shades'

export const FeedbackOverview = Shade({
  shadowDomName: 'showcase-feedback-overview',
  render: () => {
    return (
      <div
        style={{
          padding: '2rem',
          maxWidth: '800px',
          margin: '0 auto',
        }}
      >
        <h1>Feedback</h1>
        <p>
          Components for providing feedback to users through notifications, alerts, loading indicators, and other UI
          feedback mechanisms.
        </p>

        <section style={{ marginTop: '2rem' }}>
          <h2>Available Components</h2>
          <ul style={{ lineHeight: '2' }}>
            <li>
              <strong>Notys</strong> - Toast notifications and alerts
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
