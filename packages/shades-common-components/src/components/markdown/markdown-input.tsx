import { Shade, createComponent } from '@furystack/shades'
import { cssVariableTheme } from '../../services/css-variable-theme.js'

const DEFAULT_MAX_IMAGE_SIZE = 256 * 1024

export type MarkdownInputProps = {
  /** The current Markdown string */
  value: string
  /** Called when the value changes */
  onValueChange?: (newValue: string) => void
  /** Maximum image file size in bytes for base64 paste. Defaults to 256KB. */
  maxImageSizeBytes?: number
  /** Whether the textarea is read-only */
  readOnly?: boolean
  /** Whether the textarea is disabled */
  disabled?: boolean
  /** Placeholder text */
  placeholder?: string
  /** Label shown above the textarea */
  labelTitle?: string
  /** Number of visible text rows */
  rows?: number
}

/**
 * Markdown text input with base64 image paste support.
 * When the user pastes an image below the configured size limit,
 * it is inlined as a `![pasted image](data:...)` Markdown image.
 */
export const MarkdownInput = Shade<MarkdownInputProps>({
  shadowDomName: 'shade-markdown-input',
  css: {
    display: 'block',
    marginBottom: '1em',

    '& label': {
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'flex-start',
      fontSize: cssVariableTheme.typography.fontSize.xs,
      color: cssVariableTheme.text.secondary,
      padding: '1em',
      borderRadius: cssVariableTheme.shape.borderRadius.md,
      border: `1px solid ${cssVariableTheme.action.subtleBorder}`,
      transition: `color ${cssVariableTheme.transitions.duration.slow} ${cssVariableTheme.transitions.easing.default}`,
    },

    '&[data-disabled] label': {
      color: cssVariableTheme.text.disabled,
    },

    '&:focus-within label': {
      color: cssVariableTheme.palette.primary.main,
    },

    '& textarea': {
      border: 'none',
      backgroundColor: 'transparent',
      outline: 'none',
      fontSize: cssVariableTheme.typography.fontSize.sm,
      fontFamily: 'monospace',
      width: '100%',
      resize: 'vertical',
      color: cssVariableTheme.text.primary,
      boxShadow: '0px 0px 0px rgba(128,128,128,0.1)',
      transition: `box-shadow ${cssVariableTheme.transitions.duration.normal} ease`,
      lineHeight: cssVariableTheme.typography.lineHeight.relaxed,
      padding: `${cssVariableTheme.spacing.sm} 0`,
    },

    '&:focus-within textarea': {
      boxShadow: `0px 3px 0px ${cssVariableTheme.palette.primary.main}`,
    },
  },
  render: ({ props, useHostProps, useRef }) => {
    const maxSize = props.maxImageSizeBytes ?? DEFAULT_MAX_IMAGE_SIZE
    const textareaRef = useRef<HTMLTextAreaElement>('textarea')

    useHostProps({
      'data-disabled': props.disabled ? '' : undefined,
    })

    const handleInput = (ev: Event) => {
      const target = ev.target as HTMLTextAreaElement
      props.onValueChange?.(target.value)
    }

    const handlePaste = (ev: ClipboardEvent) => {
      const items = ev.clipboardData?.items
      if (!items) return

      for (let i = 0; i < items.length; i++) {
        const item = items[i]
        if (item.type.startsWith('image/')) {
          const file = item.getAsFile()
          if (!file || file.size > maxSize) continue

          ev.preventDefault()

          const reader = new FileReader()
          reader.onload = () => {
            const base64 = reader.result as string
            const textarea = textareaRef.current
            if (!textarea) return

            const start = textarea.selectionStart
            const end = textarea.selectionEnd
            const before = textarea.value.slice(0, start)
            const after = textarea.value.slice(end)
            const imageMarkdown = `![pasted image](${base64})`
            const newValue = before + imageMarkdown + after

            textarea.value = newValue
            const cursorPos = start + imageMarkdown.length
            textarea.setSelectionRange(cursorPos, cursorPos)
            props.onValueChange?.(newValue)
          }
          reader.readAsDataURL(file)
          return
        }
      }
    }

    return (
      <label>
        {props.labelTitle ? <span>{props.labelTitle}</span> : null}
        <textarea
          ref={textareaRef}
          value={props.value}
          oninput={handleInput}
          onpaste={handlePaste}
          readOnly={props.readOnly}
          disabled={props.disabled}
          placeholder={props.placeholder}
          rows={props.rows ?? 10}
        />
      </label>
    )
  },
})
