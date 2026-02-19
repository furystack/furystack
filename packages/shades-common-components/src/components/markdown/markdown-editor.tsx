import { Shade, createComponent } from '@furystack/shades'
import { cssVariableTheme } from '../../services/css-variable-theme.js'
import { Tabs } from '../tabs.js'
import { MarkdownDisplay } from './markdown-display.js'
import { MarkdownInput } from './markdown-input.js'

export type MarkdownEditorLayout = 'side-by-side' | 'tabs' | 'above-below'

export type MarkdownEditorProps = {
  /** The current Markdown string */
  value: string
  /** Called when the value changes (from either the input or checkbox toggle) */
  onValueChange?: (newValue: string) => void
  /** Layout mode for the editor. Defaults to 'side-by-side'. */
  layout?: MarkdownEditorLayout
  /** Maximum image file size in bytes for base64 paste */
  maxImageSizeBytes?: number
  /** When true, the editor is read-only */
  readOnly?: boolean
  /** Inline styles applied to the host element */
  style?: Partial<CSSStyleDeclaration>
}

type TabType = 'edit' | 'preview'

/**
 * Combined Markdown editor with an input pane and a live preview pane.
 * Supports three layouts: side-by-side, tabs (Edit/Preview), or above-below.
 */
export const MarkdownEditor = Shade<MarkdownEditorProps>({
  shadowDomName: 'shade-markdown-editor',
  css: {
    display: 'flex',
    flexDirection: 'column',
    border: `1px solid ${cssVariableTheme.action.subtleBorder}`,
    borderRadius: cssVariableTheme.shape.borderRadius.md,
    overflow: 'hidden',
    minHeight: '0',

    '& .md-editor-split': {
      display: 'flex',
      flex: '1',
      minHeight: '0',
    },

    '& .md-editor-split[data-layout="side-by-side"]': {
      flexDirection: 'row',
    },

    '& .md-editor-split[data-layout="above-below"]': {
      flexDirection: 'column',
    },

    '& .md-editor-pane': {
      flex: '1',
      minWidth: '0',
      minHeight: '0',
      overflow: 'auto',
      display: 'flex',
      flexDirection: 'column',
    },

    '& .md-editor-pane-input': {
      borderRight: 'none',
    },

    '& .md-editor-split[data-layout="side-by-side"] .md-editor-pane-input': {
      borderRight: `1px solid ${cssVariableTheme.action.subtleBorder}`,
    },

    '& .md-editor-split[data-layout="above-below"] .md-editor-pane-input': {
      borderBottom: `1px solid ${cssVariableTheme.action.subtleBorder}`,
    },

    '& .md-editor-pane-preview': {
      padding: cssVariableTheme.spacing.md,
    },

    '& shade-markdown-input': {
      marginBottom: '0',
      flex: '1',
      display: 'flex',
      flexDirection: 'column',
    },
    '& shade-markdown-input label': {
      border: 'none',
      borderRadius: '0',
      flex: '1',
      display: 'flex',
      flexDirection: 'column',
    },
    '& shade-markdown-input textarea': {
      flex: '1',
      resize: 'none',
    },

    '& shade-tabs': {
      flex: '1',
      minHeight: '0',
    },

    '& .md-editor-tab-content': {
      padding: cssVariableTheme.spacing.md,
      overflow: 'auto',
    },
  },
  render: ({ props, useState, useHostProps }) => {
    const layout = props.layout ?? 'side-by-side'

    useHostProps({
      ...(props.style ? { style: props.style as Record<string, string> } : {}),
    })

    const [activeTab, setActiveTab] = useState<TabType>('activeTab', 'edit')

    const inputPane = (
      <MarkdownInput
        value={props.value}
        onValueChange={props.onValueChange}
        maxImageSizeBytes={props.maxImageSizeBytes}
        readOnly={props.readOnly}
      />
    )

    const previewPane = <MarkdownDisplay content={props.value} readOnly={false} onChange={props.onValueChange} />

    if (layout === 'tabs') {
      return (
        <Tabs
          activeKey={activeTab}
          onTabChange={(key) => setActiveTab(key as TabType)}
          tabs={[
            {
              header: <>Edit</>,
              hash: 'edit',
              component: <div className="md-editor-tab-content">{inputPane}</div>,
            },
            {
              header: <>Preview</>,
              hash: 'preview',
              component: <div className="md-editor-tab-content">{previewPane}</div>,
            },
          ]}
        />
      )
    }

    return (
      <div className="md-editor-split" data-layout={layout}>
        <div className="md-editor-pane md-editor-pane-input">{inputPane}</div>
        <div className="md-editor-pane md-editor-pane-preview">{previewPane}</div>
      </div>
    )
  },
})
