import { createComponent, Shade } from '@furystack/shades'
import type { AlertSeverity } from '@furystack/shades-common-components'
import { Alert, PageContainer, PageHeader, Paper } from '@furystack/shades-common-components'

const severities: AlertSeverity[] = ['error', 'warning', 'info', 'success']

export const AlertPage = Shade({
  shadowDomName: 'shades-alert-page',
  render: ({ useSearchState }) => {
    const [state, setState] = useSearchState('alert', { dismissed: [] as string[] })

    const handleClose = (id: string) => {
      setState({ dismissed: [...state.dismissed, id] })
    }

    const handleReset = () => {
      setState({ dismissed: [] })
    }

    return (
      <PageContainer maxWidth="900px" centered>
        <PageHeader
          icon="🚨"
          title="Alert"
          description="Alerts display short, important messages that attract the user's attention without interrupting their workflow. They support four severity levels and three visual variants."
        />

        <Paper elevation={3} style={{ padding: '32px', display: 'flex', flexDirection: 'column', gap: '24px' }}>
          <h3 style={{ margin: '0' }}>Standard (default)</h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {severities.map((severity) => (
              <Alert severity={severity}>This is a {severity} alert — check it out!</Alert>
            ))}
          </div>

          <h3 style={{ margin: '0' }}>Filled</h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {severities.map((severity) => (
              <Alert severity={severity} variant="filled">
                This is a filled {severity} alert.
              </Alert>
            ))}
          </div>

          <h3 style={{ margin: '0' }}>Outlined</h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {severities.map((severity) => (
              <Alert severity={severity} variant="outlined">
                This is an outlined {severity} alert.
              </Alert>
            ))}
          </div>

          <h3 style={{ margin: '0' }}>With title</h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {severities.map((severity) => (
              <Alert severity={severity} title={`${severity.charAt(0).toUpperCase()}${severity.slice(1)}`}>
                This is a {severity} alert with a title.
              </Alert>
            ))}
          </div>

          <h3 style={{ margin: '0' }}>Custom icon</h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            <Alert severity="info" icon="💡">
              Tip: You can use custom icons for alerts.
            </Alert>
            <Alert severity="success" icon="🚀">
              Your deployment has been completed.
            </Alert>
            <Alert severity="warning" icon="🔥">
              Performance degradation detected.
            </Alert>
          </div>

          <h3 style={{ margin: '0' }}>Closeable</h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {severities
              .filter((s) => !state.dismissed.includes(s))
              .map((severity) => (
                <Alert severity={severity} onClose={() => handleClose(severity)}>
                  This is a closeable {severity} alert.
                </Alert>
              ))}
            {state.dismissed.length > 0 ? (
              <Alert severity="info" variant="outlined" icon="♻️" onClose={handleReset}>
                {state.dismissed.length} alert(s) dismissed. Click close to reset.
              </Alert>
            ) : null}
          </div>
        </Paper>
      </PageContainer>
    )
  },
})
