import type { CacheResult, CacheWithValue } from '@furystack/cache'
import { Cache } from '@furystack/cache'
import { createComponent, Shade } from '@furystack/shades'
import {
  Alert,
  Button,
  ButtonGroup,
  CacheView,
  Icon,
  icons,
  Loader,
  PageContainer,
  PageHeader,
  Paper,
  Skeleton,
  Typography,
} from '@furystack/shades-common-components'
import { sleepAsync } from '@furystack/utils'

type DemoData = { message: string; timestamp: number }

const DemoContent = Shade<{ data: CacheWithValue<DemoData> }>({
  shadowDomName: 'demo-cache-content',
  render: ({ props }) => {
    const { value, status, updatedAt } = props.data
    return (
      <div style={{ padding: '16px' }}>
        <Typography variant="body1">
          <strong>Message:</strong> {value.message}
        </Typography>
        <Typography variant="body2" style={{ color: 'var(--shades-theme-text-secondary)' }}>
          Status: {status} | Updated: {updatedAt.toLocaleTimeString()} | Timestamp: {value.timestamp}
        </Typography>
      </div>
    )
  },
})

const demoCache = new Cache<DemoData, [string]>({
  load: async (key) => {
    await sleepAsync(1000)
    return { message: `Loaded value for "${key}"`, timestamp: Date.now() }
  },
})

const DEMO_ARGS: [string] = ['demo']

const setDemoState = (state: CacheResult<DemoData>) => {
  demoCache.setExplicitValue({ loadArgs: DEMO_ARGS, value: state })
}

export const CacheViewPage = Shade({
  shadowDomName: 'shades-cache-view-page',
  render: () => {
    return (
      <PageContainer centered>
        <PageHeader
          icon={<Icon icon={icons.packageIcon} />}
          title="Cache View"
          description="CacheView renders the state of a cache entry. It takes a Cache instance and args, subscribes to the observable, and handles loading, error (with retry), and loaded/obsolete states. Use the buttons below to toggle the cache state and observe the component's behavior."
        />

        <Paper elevation={3} style={{ padding: '32px', display: 'flex', flexDirection: 'column', gap: '24px' }}>
          <Typography variant="h3" style={{ margin: '0' }}>
            State controls
          </Typography>
          <Typography variant="body2" style={{ color: 'var(--shades-theme-text-secondary)' }}>
            Click a button to set the demo cache entry to that state. The CacheView below will update reactively.
          </Typography>

          <ButtonGroup>
            <Button
              variant="outlined"
              onclick={() =>
                setDemoState({
                  status: 'loading',
                  updatedAt: new Date(),
                })
              }
            >
              Set Loading
            </Button>
            <Button
              variant="outlined"
              color="success"
              onclick={() =>
                setDemoState({
                  status: 'loaded',
                  value: { message: 'Fresh data!', timestamp: Date.now() },
                  updatedAt: new Date(),
                })
              }
            >
              Set Loaded
            </Button>
            <Button
              variant="outlined"
              color="error"
              onclick={() =>
                setDemoState({
                  status: 'failed',
                  error: new Error('Something went wrong in the demo'),
                  updatedAt: new Date(),
                })
              }
            >
              Set Failed
            </Button>
            <Button
              variant="outlined"
              color="warning"
              onclick={() =>
                setDemoState({
                  status: 'obsolete',
                  value: { message: 'Stale data (obsolete)', timestamp: Date.now() },
                  updatedAt: new Date(),
                })
              }
            >
              Set Obsolete
            </Button>
            <Button
              variant="outlined"
              color="error"
              onclick={() =>
                setDemoState({
                  status: 'failed',
                  error: new Error('Failed but has stale value'),
                  value: { message: 'This stale value is hidden by error-first', timestamp: Date.now() },
                  updatedAt: new Date(),
                })
              }
            >
              Failed + Stale Value
            </Button>
          </ButtonGroup>

          <Typography variant="h3" style={{ margin: '0' }}>
            Default (no loader, no custom error)
          </Typography>
          <Typography variant="body2" style={{ color: 'var(--shades-theme-text-secondary)' }}>
            Default loader is null. Default error shows a Result component with retry button.
          </Typography>
          <Paper elevation={1} style={{ padding: '16px', minHeight: '80px' }}>
            <CacheView cache={demoCache} args={DEMO_ARGS} content={DemoContent} />
          </Paper>

          <Typography variant="h3" style={{ margin: '0' }}>
            With custom loader (Skeleton)
          </Typography>
          <Paper elevation={1} style={{ padding: '16px', minHeight: '80px' }}>
            <CacheView
              cache={demoCache}
              args={DEMO_ARGS}
              content={DemoContent}
              loader={
                (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', padding: '16px' }}>
                    <Skeleton delay={0} />
                    <Skeleton delay={0} />
                    <Skeleton delay={0} />
                  </div>
                ) as unknown as JSX.Element
              }
            />
          </Paper>

          <Typography variant="h3" style={{ margin: '0' }}>
            With custom loader (Loader spinner)
          </Typography>
          <Paper elevation={1} style={{ padding: '16px', minHeight: '80px' }}>
            <CacheView
              cache={demoCache}
              args={DEMO_ARGS}
              content={DemoContent}
              loader={
                (
                  <div
                    style={{
                      display: 'flex',
                      justifyContent: 'center',
                      alignItems: 'center',
                      height: '80px',
                    }}
                  >
                    <Loader style={{ width: '40px', height: '40px' }} delay={0} />
                  </div>
                ) as unknown as JSX.Element
              }
            />
          </Paper>

          <Typography variant="h3" style={{ margin: '0' }}>
            With custom inline error
          </Typography>
          <Paper elevation={1} style={{ padding: '16px', minHeight: '80px' }}>
            <CacheView
              cache={demoCache}
              args={DEMO_ARGS}
              content={DemoContent}
              error={(err, retry) =>
                (
                  <Alert severity="error" title="Cache load failed">
                    <span>{String(err)}</span>
                    <Button variant="outlined" color="error" size="small" onclick={retry}>
                      Retry
                    </Button>
                  </Alert>
                ) as unknown as JSX.Element
              }
            />
          </Paper>
        </Paper>
      </PageContainer>
    )
  },
})
