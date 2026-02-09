import { createComponent, Shade } from '@furystack/shades'
import {
  CircularProgress,
  LinearProgress,
  PageContainer,
  PageHeader,
  Paper,
  Typography,
} from '@furystack/shades-common-components'
import type { ObservableValue } from '@furystack/utils'
import { ObservableValue as OV } from '@furystack/utils'

/**
 * A small component that displays an observable number as text, updating
 * itself without causing a parent re-render.
 */
const ValueLabel = Shade<{ value: ObservableValue<number>; suffix?: string }>({
  shadowDomName: 'shade-value-label',
  css: {
    display: 'inline',
  },
  render: ({ props, useObservable }) => {
    const [v] = useObservable('value', props.value)

    return (
      <span>
        {v}
        {props.suffix ?? ''}
      </span>
    )
  },
})

export const ProgressPage = Shade({
  shadowDomName: 'progress-page',
  render: ({ useDisposable }) => {
    const progressValue = useDisposable('progressValue', () => new OV(40))

    return (
      <PageContainer centered>
        <PageHeader
          icon="⏳"
          title="Progress"
          description="Progress indicators inform users about the status of ongoing processes. LinearProgress displays a horizontal bar while CircularProgress uses a circular spinner. Both support determinate and indeterminate variants with palette colors. Determinate variants accept an ObservableValue and animate smoothly without re-rendering."
        />

        <Paper elevation={3} style={{ padding: '32px' }}>
          <Typography variant="h3">Linear Progress – Indeterminate</Typography>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <LinearProgress />
            {(['primary', 'secondary', 'error', 'warning', 'success', 'info'] as const).map((color) => (
              <LinearProgress color={color} />
            ))}
          </div>
        </Paper>

        <Paper elevation={3} style={{ padding: '32px', marginTop: '24px' }}>
          <Typography variant="h3">Linear Progress – Determinate</Typography>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
              <input
                type="range"
                min="0"
                max="100"
                value={String(progressValue.getValue())}
                oninput={(ev: Event) => progressValue.setValue(Number((ev.target as HTMLInputElement).value))}
                style={{ flex: '1' }}
              />
              <span style={{ minWidth: '40px', textAlign: 'right' }}>
                <ValueLabel value={progressValue} suffix="%" />
              </span>
            </div>
            <LinearProgress variant="determinate" value={progressValue} />
            <LinearProgress variant="determinate" value={progressValue} color="secondary" />
            <LinearProgress variant="determinate" value={progressValue} color="success" />
          </div>
        </Paper>

        <Paper elevation={3} style={{ padding: '32px', marginTop: '24px' }}>
          <Typography variant="h3">Linear Progress – Sizes</Typography>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <div>
              <div style={{ marginBottom: '8px', fontSize: '14px' }}>Small</div>
              <LinearProgress variant="determinate" value={progressValue} size="small" />
            </div>
            <div>
              <div style={{ marginBottom: '8px', fontSize: '14px' }}>Medium (default)</div>
              <LinearProgress variant="determinate" value={progressValue} />
            </div>
          </div>
        </Paper>

        <Paper elevation={3} style={{ padding: '32px', marginTop: '24px' }}>
          <Typography variant="h3">Circular Progress – Indeterminate</Typography>
          <div style={{ display: 'flex', gap: '24px', flexWrap: 'wrap', alignItems: 'center' }}>
            <CircularProgress />
            {(['primary', 'secondary', 'error', 'warning', 'success', 'info'] as const).map((color) => (
              <CircularProgress color={color} />
            ))}
          </div>
        </Paper>

        <Paper elevation={3} style={{ padding: '32px', marginTop: '24px' }}>
          <Typography variant="h3">Circular Progress – Determinate</Typography>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
              <input
                type="range"
                min="0"
                max="100"
                value={String(progressValue.getValue())}
                oninput={(ev: Event) => progressValue.setValue(Number((ev.target as HTMLInputElement).value))}
                style={{ flex: '1' }}
              />
              <span style={{ minWidth: '40px', textAlign: 'right' }}>
                <ValueLabel value={progressValue} suffix="%" />
              </span>
            </div>
            <div style={{ display: 'flex', gap: '24px', flexWrap: 'wrap', alignItems: 'center' }}>
              {(['primary', 'secondary', 'error', 'warning', 'success', 'info'] as const).map((color) => (
                <CircularProgress variant="determinate" value={progressValue} color={color} />
              ))}
            </div>
          </div>
        </Paper>

        <Paper elevation={3} style={{ padding: '32px', marginTop: '24px' }}>
          <Typography variant="h3">Circular Progress – Sizes</Typography>
          <div style={{ display: 'flex', gap: '24px', flexWrap: 'wrap', alignItems: 'center' }}>
            <CircularProgress size={24} />
            <CircularProgress size={40} />
            <CircularProgress size={60} />
            <CircularProgress size={80} />
          </div>
        </Paper>

        <Paper elevation={3} style={{ padding: '32px', marginTop: '24px' }}>
          <Typography variant="h3">Circular Progress – Thickness</Typography>
          <div style={{ display: 'flex', gap: '24px', flexWrap: 'wrap', alignItems: 'center' }}>
            <CircularProgress variant="determinate" value={progressValue} thickness={2} />
            <CircularProgress variant="determinate" value={progressValue} thickness={3.6} />
            <CircularProgress variant="determinate" value={progressValue} thickness={6} />
            <CircularProgress variant="determinate" value={progressValue} thickness={8} />
          </div>
        </Paper>
      </PageContainer>
    )
  },
})
