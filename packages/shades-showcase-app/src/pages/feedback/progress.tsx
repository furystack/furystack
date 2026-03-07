import { createComponent, Shade } from '@furystack/shades'
import {
  CircularProgress,
  LinearProgress,
  PageContainer,
  PageHeader,
  Paper,
  Typography,
} from '@furystack/shades-common-components'

export const ProgressPage = Shade({
  shadowDomName: 'progress-page',
  render: ({ useState }) => {
    const [progressValue, setProgressValue] = useState('progressValue', 40)

    return (
      <PageContainer centered>
        <PageHeader
          icon="⏳"
          title="Progress"
          description="Progress indicators inform users about the status of ongoing processes. LinearProgress displays a horizontal bar while CircularProgress uses a circular spinner. Both support determinate and indeterminate variants with palette colors."
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
                value={String(progressValue)}
                oninput={(ev: Event) => setProgressValue(Number((ev.target as HTMLInputElement).value))}
                style={{ flex: '1' }}
              />
              <span data-testid="progress-value-label" style={{ minWidth: '40px', textAlign: 'right' }}>
                {progressValue}%
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
                value={String(progressValue)}
                oninput={(ev: Event) => setProgressValue(Number((ev.target as HTMLInputElement).value))}
                style={{ flex: '1' }}
              />
              <span data-testid="progress-value-label" style={{ minWidth: '40px', textAlign: 'right' }}>
                {progressValue}%
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
