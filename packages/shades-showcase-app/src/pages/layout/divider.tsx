import { createComponent, Shade } from '@furystack/shades'
import {
  Chip,
  Divider,
  Icon,
  icons,
  PageContainer,
  PageHeader,
  Paper,
  Typography,
} from '@furystack/shades-common-components'

export const DividerPage = Shade({
  shadowDomName: 'shades-divider-page',
  render: () => {
    return (
      <PageContainer centered>
        <PageHeader
          icon={<Icon icon={icons.minus} />}
          title="Divider"
          description="Dividers are thin lines that separate content into clear groups. They support horizontal and vertical orientations, different inset variants, and optional text labels."
        />

        <Paper elevation={3} style={{ padding: '32px', display: 'flex', flexDirection: 'column', gap: '24px' }}>
          <Typography variant="h3" style={{ margin: '0' }}>
            Basic horizontal
          </Typography>
          <div>
            <Typography variant="body1" style={{ margin: '0 0 0 0' }}>
              Content above the divider
            </Typography>
            <Divider />
            <Typography variant="body1" style={{ margin: '0' }}>
              Content below the divider
            </Typography>
          </div>

          <Typography variant="h3" style={{ margin: '0' }}>
            Variants
          </Typography>
          <div>
            <Typography variant="body1" style={{ margin: '0' }}>
              Full width (default)
            </Typography>
            <Divider />
            <Typography variant="body1" style={{ margin: '0' }}>
              Inset (indented on the start side)
            </Typography>
            <Divider variant="inset" />
            <Typography variant="body1" style={{ margin: '0' }}>
              Middle (indented on both sides)
            </Typography>
            <Divider variant="middle" />
            <Typography variant="body1" style={{ margin: '0' }}>
              Content continues here
            </Typography>
          </div>

          <Typography variant="h3" style={{ margin: '0' }}>
            With text (center, left, right)
          </Typography>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <Divider>CENTER</Divider>
            <Divider textAlign="left">LEFT</Divider>
            <Divider textAlign="right">RIGHT</Divider>
          </div>

          <Typography variant="h3" style={{ margin: '0' }}>
            With rich content
          </Typography>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <Divider>
              <Chip color="primary" size="small">
                Section
              </Chip>
            </Divider>
            <Divider>OR</Divider>
          </div>

          <Typography variant="h3" style={{ margin: '0' }}>
            Vertical orientation
          </Typography>
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0px',
              height: '40px',
            }}
          >
            <span>Item 1</span>
            <Divider orientation="vertical" />
            <span>Item 2</span>
            <Divider orientation="vertical" />
            <span>Item 3</span>
          </div>

          <Typography variant="h3" style={{ margin: '0' }}>
            Vertical with text
          </Typography>
          <div
            style={{
              display: 'flex',
              gap: '0px',
              height: '120px',
              alignItems: 'stretch',
            }}
          >
            <span style={{ display: 'flex', alignItems: 'center' }}>Left</span>
            <Divider orientation="vertical">OR</Divider>
            <span style={{ display: 'flex', alignItems: 'center' }}>Right</span>
          </div>

          <Typography variant="h3" style={{ margin: '0' }}>
            In a list context
          </Typography>
          <div
            style={{
              display: 'flex',
              flexDirection: 'column',
              border: `1px solid var(--shades-theme-divider)`,
              borderRadius: '8px',
              padding: '0',
            }}
          >
            <div style={{ padding: '12px 16px' }}>List item 1</div>
            <Divider />
            <div style={{ padding: '12px 16px' }}>List item 2</div>
            <Divider />
            <div style={{ padding: '12px 16px' }}>List item 3</div>
          </div>
        </Paper>
      </PageContainer>
    )
  },
})
