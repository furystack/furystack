import { createComponent, Shade } from '@furystack/shades'
import { Button, PageContainer, PageHeader, Paper, Typography } from '@furystack/shades-common-components'

export const ButtonsPage = Shade({
  shadowDomName: 'buttons-page',
  render: ({ useSearchState }) => {
    const [isEnabledObject, setIsEnabledObject] = useSearchState('disabled', { isEnabled: false })

    const txt = 'Button Text'
    const onclick = () => {
      /** */
    }

    return (
      <PageContainer maxWidth="800px" centered>
        <PageHeader
          icon="🔘"
          title="Buttons"
          description="The Button component provides clickable elements with multiple visual variants, sizes, and states. Choose from text, outlined, or contained styles, each available in primary, secondary, error, and default colors. Buttons support disabled states, loading indicators, danger mode, icons, and size variations."
        />
        <Paper elevation={3} style={{ padding: '32px', display: 'flex', flexDirection: 'column', gap: '24px' }}>
          {/* Variants */}
          <Typography variant="h3">Variants</Typography>
          <div>
            <div>
              <Button onclick={onclick} disabled={!isEnabledObject.isEnabled}>
                {txt}
              </Button>
              <Button onclick={onclick} disabled={!isEnabledObject.isEnabled} color="primary">
                {txt}
              </Button>
              <Button onclick={onclick} disabled={!isEnabledObject.isEnabled} color="secondary">
                {txt}
              </Button>
              <Button onclick={onclick} disabled={!isEnabledObject.isEnabled} color="error">
                {txt}
              </Button>
            </div>
            <div>
              <Button onclick={onclick} disabled={!isEnabledObject.isEnabled} variant="outlined">
                {txt}
              </Button>
              <Button onclick={onclick} disabled={!isEnabledObject.isEnabled} variant="outlined" color="primary">
                {txt}
              </Button>
              <Button onclick={onclick} disabled={!isEnabledObject.isEnabled} variant="outlined" color="secondary">
                {txt}
              </Button>
              <Button onclick={onclick} disabled={!isEnabledObject.isEnabled} variant="outlined" color="error">
                {txt}
              </Button>
            </div>
            <div>
              <Button onclick={onclick} disabled={!isEnabledObject.isEnabled} variant="contained">
                {txt}
              </Button>
              <Button onclick={onclick} disabled={!isEnabledObject.isEnabled} variant="contained" color="primary">
                {txt}
              </Button>
              <Button onclick={onclick} disabled={!isEnabledObject.isEnabled} variant="contained" color="secondary">
                {txt}
              </Button>
              <Button onclick={onclick} disabled={!isEnabledObject.isEnabled} variant="contained" color="error">
                {txt}
              </Button>
            </div>
            <div>
              <Button onclick={onclick} disabled={!isEnabledObject.isEnabled} variant="text">
                {txt}
              </Button>
              <Button onclick={onclick} disabled={!isEnabledObject.isEnabled} variant="text" color="primary">
                {txt}
              </Button>
              <Button onclick={onclick} disabled={!isEnabledObject.isEnabled} variant="text" color="secondary">
                {txt}
              </Button>
              <Button onclick={onclick} disabled={!isEnabledObject.isEnabled} variant="text" color="error">
                {txt}
              </Button>
            </div>
          </div>

          {/* Sizes */}
          <Typography variant="h3">Sizes</Typography>
          <div style={{ display: 'flex', alignItems: 'center', flexWrap: 'wrap' }}>
            <Button onclick={onclick} variant="contained" color="primary" size="small">
              Small
            </Button>
            <Button onclick={onclick} variant="contained" color="primary" size="medium">
              Medium
            </Button>
            <Button onclick={onclick} variant="contained" color="primary" size="large">
              Large
            </Button>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', flexWrap: 'wrap' }}>
            <Button onclick={onclick} variant="outlined" color="primary" size="small">
              Small
            </Button>
            <Button onclick={onclick} variant="outlined" color="primary" size="medium">
              Medium
            </Button>
            <Button onclick={onclick} variant="outlined" color="primary" size="large">
              Large
            </Button>
          </div>

          {/* Danger */}
          <Typography variant="h3">Danger</Typography>
          <div style={{ display: 'flex', alignItems: 'center', flexWrap: 'wrap' }}>
            <Button onclick={onclick} danger>
              Danger Text
            </Button>
            <Button onclick={onclick} danger variant="outlined">
              Danger Outlined
            </Button>
            <Button onclick={onclick} danger variant="contained">
              Danger Contained
            </Button>
          </div>

          {/* Loading */}
          <Typography variant="h3">Loading</Typography>
          <div style={{ display: 'flex', alignItems: 'center', flexWrap: 'wrap' }}>
            <Button loading>Loading</Button>
            <Button loading variant="outlined" color="primary">
              Loading
            </Button>
            <Button loading variant="contained" color="primary">
              Loading
            </Button>
            <Button loading variant="contained" color="secondary">
              Loading
            </Button>
          </div>

          {/* Icons */}
          <Typography variant="h3">Icons</Typography>
          <div style={{ display: 'flex', alignItems: 'center', flexWrap: 'wrap' }}>
            <Button onclick={onclick} variant="contained" color="primary" startIcon={<span>⬅</span>}>
              Start Icon
            </Button>
            <Button onclick={onclick} variant="contained" color="primary" endIcon={<span>➡</span>}>
              End Icon
            </Button>
            <Button
              onclick={onclick}
              variant="outlined"
              color="secondary"
              startIcon={<span>⬅</span>}
              endIcon={<span>➡</span>}
            >
              Both Icons
            </Button>
          </div>

          {/* Toggle + Custom */}
          <Button
            onclick={() => {
              setIsEnabledObject({
                isEnabled: !isEnabledObject.isEnabled,
              })
            }}
          >
            Disable All
          </Button>

          <Button
            style={{
              width: '150px',
              alignSelf: 'center',
              textAlign: 'center',
              fontFamily: 'monospace',
              fontSize: '20px',
              border: '3px dashed red',
              padding: '1em',
            }}
            title="A button with attached custom CSS attributes"
          >
            Custom Style
          </Button>
        </Paper>
      </PageContainer>
    )
  },
})
