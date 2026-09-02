import { createComponent, Shade } from '@furystack/shades'
import { cssVariableTheme, Icon, icons, PageContainer, PageHeader } from '@furystack/shades-common-components'
import { CodeMirrorJsExample } from './code-mirror-js-example.tsx'
import { CodeMirrorJsonSchemaExample } from './code-mirror-json-schema-example.tsx'

export const CodeMirrorPage = Shade({
  customElementName: 'code-mirror-page',
  render: () => {
    return (
      <PageContainer>
        <PageHeader
          icon={<Icon icon={icons.code} />}
          title="CodeMirror Editor"
          description={
            <>
              <a href="https://codemirror.net/" target="_blank" style={{ color: cssVariableTheme.text.primary }}>
                CodeMirror
              </a>
              &nbsp; is a lightweight and extensible editor code editor that can be integrated in the web
            </>
          }
        />
        <CodeMirrorJsExample />
        <CodeMirrorJsonSchemaExample />
      </PageContainer>
    )
  },
})
