import { createComponent, LazyLoad, Shade } from '@furystack/shades'
import { Icon, icons, PageContainer, PageHeader, Paper, Skeleton, Tabs } from '@furystack/shades-common-components'

export const MonacoEditorPage = Shade({
  customElementName: 'monaco-editor-page',
  css: { height: '100%', display: 'block', overflow: 'visible !important' },
  render: () => {
    return (
      <PageContainer>
        <PageHeader
          icon={<Icon icon={icons.code} />}
          title="Monaco Editor"
          description="Monaco Editor is the code editor that powers VS Code, integrated here as a Shades component. It provides syntax highlighting, IntelliSense, and full editor features for TypeScript and many other languages. The editor automatically adapts its layout and supports configuration options like language mode and automatic layout resizing."
        />
        <Paper
          elevation={3}
          style={{ display: 'flex', flexDirection: 'column', flex: '1', minHeight: '0', padding: '16px' }}
        >
          <Tabs
            tabs={[
              {
                hash: '',
                header: <span>Javascript</span>,
                component: (
                  <LazyLoad
                    style={{ height: '100%', width: '100%' }}
                    viewTransition
                    loader={<Skeleton style={{ height: '100%', width: '100%' }} />}
                    component={async () => {
                      const { MonacoJs } = await import('./monaco-js.tsx')
                      return <MonacoJs />
                    }}
                  />
                ),
              },
              {
                hash: 'jsonSchema',
                header: <span>JSON Schema</span>,
                component: (
                  <LazyLoad
                    style={{ height: '100%', width: '100%' }}
                    viewTransition
                    loader={<Skeleton style={{ height: '100%', width: '100%' }} />}
                    component={async () => {
                      const { MonacoJs } = await import('./monaco-js.tsx')
                      return <MonacoJs />
                    }}
                  />
                ),
              },
            ]}
          />
        </Paper>
      </PageContainer>
    )
  },
})
