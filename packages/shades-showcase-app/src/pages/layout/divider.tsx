import { createComponent, Shade } from '@furystack/shades'
import { Chip, Divider, PageContainer, PageHeader, Paper } from '@furystack/shades-common-components'

export const DividerPage = Shade({
  shadowDomName: 'shades-divider-page',
  render: () => {
    return (
      <PageContainer maxWidth="900px" centered>
        <PageHeader
          icon="➖"
          title="Divider"
          description="Dividers are thin lines that separate content into clear groups. They support horizontal and vertical orientations, different inset variants, and optional text labels."
        />

        <Paper elevation={3} style={{ padding: '32px', display: 'flex', flexDirection: 'column', gap: '24px' }}>
          <h3 style={{ margin: '0' }}>Basic horizontal</h3>
          <div>
            <p style={{ margin: '0 0 0 0' }}>Content above the divider</p>
            <Divider />
            <p style={{ margin: '0' }}>Content below the divider</p>
          </div>

          <h3 style={{ margin: '0' }}>Variants</h3>
          <div>
            <p style={{ margin: '0' }}>Full width (default)</p>
            <Divider />
            <p style={{ margin: '0' }}>Inset (indented on the start side)</p>
            <Divider variant="inset" />
            <p style={{ margin: '0' }}>Middle (indented on both sides)</p>
            <Divider variant="middle" />
            <p style={{ margin: '0' }}>Content continues here</p>
          </div>

          <h3 style={{ margin: '0' }}>With text (center, left, right)</h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <Divider>CENTER</Divider>
            <Divider textAlign="left">LEFT</Divider>
            <Divider textAlign="right">RIGHT</Divider>
          </div>

          <h3 style={{ margin: '0' }}>With rich content</h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <Divider>
              <Chip color="primary" size="small">
                Section
              </Chip>
            </Divider>
            <Divider>OR</Divider>
          </div>

          <h3 style={{ margin: '0' }}>Vertical orientation</h3>
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

          <h3 style={{ margin: '0' }}>Vertical with text</h3>
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

          <h3 style={{ margin: '0' }}>In a list context</h3>
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
