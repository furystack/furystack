import { createComponent, Shade } from '@furystack/shades'
import type { ResultStatus } from '@furystack/shades-common-components'
import {
  Button,
  Icon,
  icons,
  PageContainer,
  PageHeader,
  Paper,
  Result,
  Typography,
} from '@furystack/shades-common-components'

const semanticStatuses: ResultStatus[] = ['success', 'error', 'warning', 'info']

export const ResultPage = Shade({
  shadowDomName: 'shades-result-page',
  render: () => {
    return (
      <PageContainer centered>
        <PageHeader
          icon={<Icon icon={icons.flag} />}
          title="Result"
          description="Result pages are used to provide feedback about an operation outcome, such as success, error, or access restrictions. Supports semantic statuses and HTTP error codes."
        />

        <Paper elevation={3} style={{ padding: '32px', display: 'flex', flexDirection: 'column', gap: '48px' }}>
          <Typography variant="h3" style={{ margin: '0' }}>
            Semantic statuses
          </Typography>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '32px' }}>
            {semanticStatuses.map((status) => (
              <Paper elevation={1} style={{ padding: '16px' }}>
                <Result
                  status={status}
                  title={`${status.charAt(0).toUpperCase()}${status.slice(1)}`}
                  subtitle={`This is a ${status} result. You can include a subtitle to provide additional context.`}
                >
                  <Button variant="contained" onclick={() => alert(`${status} action clicked`)}>
                    Primary Action
                  </Button>
                  <Button variant="outlined" onclick={() => alert('Secondary clicked')}>
                    Secondary
                  </Button>
                </Result>
              </Paper>
            ))}
          </div>

          <Typography variant="h3" style={{ margin: '0' }}>
            HTTP error codes
          </Typography>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '32px' }}>
            <Paper elevation={1} style={{ padding: '16px' }}>
              <Result
                status="403"
                title="403 - Forbidden"
                subtitle="Sorry, you do not have permission to access this page."
              >
                <Button variant="contained" onclick={() => alert('Go Home')}>
                  Go Home
                </Button>
              </Result>
            </Paper>

            <Paper elevation={1} style={{ padding: '16px' }}>
              <Result
                status="404"
                title="404 - Not Found"
                subtitle="The page you are looking for does not exist or has been moved."
              >
                <Button variant="contained" onclick={() => alert('Go Home')}>
                  Go Home
                </Button>
                <Button variant="outlined" onclick={() => alert('Go Back')}>
                  Go Back
                </Button>
              </Result>
            </Paper>

            <Paper elevation={1} style={{ padding: '16px' }}>
              <Result
                status="500"
                title="500 - Internal Server Error"
                subtitle="Something went wrong on our end. Please try again later."
              >
                <Button variant="contained" onclick={() => alert('Retry')}>
                  Retry
                </Button>
              </Result>
            </Paper>
          </div>

          <Typography variant="h3" style={{ margin: '0' }}>
            Custom icon
          </Typography>
          <Paper elevation={1} style={{ padding: '16px' }}>
            <Result
              status="success"
              title="Payment Received"
              subtitle="Your payment of $42.00 has been processed."
              icon={<Icon icon={icons.dollarSign} />}
            >
              <Button variant="contained" onclick={() => alert('View Receipt')}>
                View Receipt
              </Button>
            </Result>
          </Paper>

          <Typography variant="h3" style={{ margin: '0' }}>
            Without actions
          </Typography>
          <Paper elevation={1} style={{ padding: '16px' }}>
            <Result
              status="info"
              title="Verification Email Sent"
              subtitle="We have sent a verification link to your email address. Please check your inbox."
            />
          </Paper>
        </Paper>
      </PageContainer>
    )
  },
})
