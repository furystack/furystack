import { createComponent, Shade } from '@furystack/shades'
import type { Palette } from '@furystack/shades-common-components'
import {
  PageContainer,
  PageHeader,
  Paper,
  Timeline,
  TimelineItem,
  Typography,
} from '@furystack/shades-common-components'

const paletteColors: Array<keyof Palette> = ['primary', 'secondary', 'error', 'warning', 'success', 'info']

export const TimelinePage = Shade({
  tagName: 'shades-timeline-page',
  render: () => {
    return (
      <PageContainer maxWidth="900px" centered>
        <PageHeader
          icon="📅"
          title="Timeline"
          description="Timelines display a list of events in chronological order. Supports left, right, and alternate layout modes with custom colors, dots, labels, and pending state."
        />

        <Paper elevation={3} style={{ padding: '32px', display: 'flex', flexDirection: 'column', gap: '32px' }}>
          <Typography variant="h3" style={{ margin: '0' }}>
            Basic (left mode)
          </Typography>
          <Timeline>
            <TimelineItem>Create a services site</TimelineItem>
            <TimelineItem>Solve initial network problems</TimelineItem>
            <TimelineItem>Technical testing</TimelineItem>
            <TimelineItem>Network problems being solved</TimelineItem>
          </Timeline>

          <Typography variant="h3" style={{ margin: '0' }}>
            Colors
          </Typography>
          <Timeline>
            {paletteColors.map((color, i) => (
              <TimelineItem color={color}>
                {color.charAt(0).toUpperCase() + color.slice(1)} event ({i + 1})
              </TimelineItem>
            ))}
          </Timeline>

          <Typography variant="h3" style={{ margin: '0' }}>
            Custom dots
          </Typography>
          <Timeline>
            <TimelineItem dot={<span>🎉</span>} color="success">
              Project launched
            </TimelineItem>
            <TimelineItem dot={<span>🐛</span>} color="error">
              Bug reported
            </TimelineItem>
            <TimelineItem dot={<span>🔧</span>} color="warning">
              Fix in progress
            </TimelineItem>
            <TimelineItem dot={<span>✅</span>} color="success">
              Bug resolved
            </TimelineItem>
          </Timeline>

          <Typography variant="h3" style={{ margin: '0' }}>
            With labels
          </Typography>
          <Timeline mode="alternate">
            <TimelineItem label="2024-01-15" color="primary">
              Project kickoff meeting
            </TimelineItem>
            <TimelineItem label="2024-02-01" color="info">
              Design phase completed
            </TimelineItem>
            <TimelineItem label="2024-03-10" color="warning">
              Beta release
            </TimelineItem>
            <TimelineItem label="2024-04-20" color="success">
              Production launch
            </TimelineItem>
          </Timeline>

          <Typography variant="h3" style={{ margin: '0' }}>
            Right mode
          </Typography>
          <Timeline mode="right">
            <TimelineItem label="Step 1">Sign up for account</TimelineItem>
            <TimelineItem label="Step 2">Complete profile</TimelineItem>
            <TimelineItem label="Step 3">Start building</TimelineItem>
          </Timeline>

          <Typography variant="h3" style={{ margin: '0' }}>
            Alternate mode
          </Typography>
          <Timeline mode="alternate">
            <TimelineItem color="primary">Morning standup</TimelineItem>
            <TimelineItem color="info">Code review</TimelineItem>
            <TimelineItem color="warning">Design discussion</TimelineItem>
            <TimelineItem color="success">Deploy to staging</TimelineItem>
            <TimelineItem color="secondary">Retrospective</TimelineItem>
          </Timeline>

          <Typography variant="h3" style={{ margin: '0' }}>
            Pending state
          </Typography>
          <Timeline pending="Recording...">
            <TimelineItem color="success">Create account 2024-09-01</TimelineItem>
            <TimelineItem color="success">Complete onboarding 2024-09-02</TimelineItem>
            <TimelineItem color="primary">Deploy first app 2024-09-05</TimelineItem>
          </Timeline>
        </Paper>
      </PageContainer>
    )
  },
})
