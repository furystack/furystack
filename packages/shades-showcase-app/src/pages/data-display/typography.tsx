import { createComponent, Shade } from '@furystack/shades'
import type { TypographyVariant } from '@furystack/shades-common-components'
import { PageContainer, PageHeader, Paper, Typography } from '@furystack/shades-common-components'

const allVariants: TypographyVariant[] = [
  'h1',
  'h2',
  'h3',
  'h4',
  'h5',
  'h6',
  'subtitle1',
  'subtitle2',
  'body1',
  'body2',
  'caption',
  'overline',
]

export const TypographyPage = Shade({
  shadowDomName: 'shades-typography-page',
  render: () => {
    return (
      <PageContainer maxWidth="900px" centered>
        <PageHeader
          icon="🔤"
          title="Typography"
          description="Typography uses consistent text styles across the UI. It maps semantic variants to HTML tags, supports palette and text colors, ellipsis truncation, copyable text, and alignment."
        />

        <Paper elevation={3} style={{ padding: '32px', display: 'flex', flexDirection: 'column', gap: '24px' }}>
          <Typography variant="h3" style={{ margin: '0' }}>
            Variants
          </Typography>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {allVariants.map((variant) => (
              <Typography variant={variant} gutterBottom>
                {variant} — The quick brown fox jumps over the lazy dog
              </Typography>
            ))}
          </div>
        </Paper>

        <Paper elevation={3} style={{ padding: '32px', display: 'flex', flexDirection: 'column', gap: '24px' }}>
          <Typography variant="h3" style={{ margin: '0' }}>
            Colors
          </Typography>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            <Typography color="textPrimary">textPrimary (default)</Typography>
            <Typography color="textSecondary">textSecondary</Typography>
            <Typography color="textDisabled">textDisabled</Typography>
            <Typography color="primary">primary</Typography>
            <Typography color="secondary">secondary</Typography>
            <Typography color="error">error</Typography>
            <Typography color="warning">warning</Typography>
            <Typography color="success">success</Typography>
            <Typography color="info">info</Typography>
          </div>
        </Paper>

        <Paper elevation={3} style={{ padding: '32px', display: 'flex', flexDirection: 'column', gap: '24px' }}>
          <Typography variant="h3" style={{ margin: '0' }}>
            Ellipsis (single line)
          </Typography>
          <div style={{ maxWidth: '300px' }}>
            <Typography ellipsis>
              This is a very long text that should be truncated with an ellipsis when it overflows the container width.
            </Typography>
          </div>

          <Typography variant="h3" style={{ margin: '0' }}>
            Ellipsis (multi-line, max 2 lines)
          </Typography>
          <div style={{ maxWidth: '300px' }}>
            <Typography ellipsis={2}>
              This is a longer text that should be clamped after two lines. It keeps going and going to demonstrate the
              multi-line ellipsis behavior using CSS line-clamp. Eventually the text gets cut off.
            </Typography>
          </div>
        </Paper>

        <Paper elevation={3} style={{ padding: '32px', display: 'flex', flexDirection: 'column', gap: '24px' }}>
          <Typography variant="h3" style={{ margin: '0' }}>
            Copyable
          </Typography>
          <Typography copyable>Click the copy icon to copy this text.</Typography>
          <Typography variant="h5" copyable>
            Copyable heading
          </Typography>
        </Paper>

        <Paper elevation={3} style={{ padding: '32px', display: 'flex', flexDirection: 'column', gap: '24px' }}>
          <Typography variant="h3" style={{ margin: '0' }}>
            Alignment
          </Typography>
          <Typography align="left">Left aligned text</Typography>
          <Typography align="center">Center aligned text</Typography>
          <Typography align="right">Right aligned text</Typography>
          <Typography align="justify">
            Justified text spreads words evenly across each full line of the paragraph so the left and right edges are
            both straight.
          </Typography>
        </Paper>
      </PageContainer>
    )
  },
})
