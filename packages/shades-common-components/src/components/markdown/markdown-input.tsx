import { Shade, createComponent } from '@furystack/shades'
import { cssVariableTheme } from '../../services/css-variable-theme.js'
import type { InputValidationResult } from '../inputs/input.js'
import { FormService } from '../form.js'

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
  /** Form field name for FormService integration */
  name?: string
  /** Whether the field is required */
  required?: boolean
  /** Custom validation callback */
  getValidationResult?: (options: { value: string }) => InputValidationResult
  /** Optional helper text callback */
  getHelperText?: (options: { value: string; validationResult?: InputValidationResult }) => JSX.Element | string
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

    '&[data-invalid] label': {
      borderColor: cssVariableTheme.palette.error.main,
      color: cssVariableTheme.palette.error.main,
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

    '&[data-invalid]:focus-within textarea': {
      boxShadow: `0px 3px 0px ${cssVariableTheme.palette.error.main}`,
    },

    '& .helperText': {
      fontSize: cssVariableTheme.typography.fontSize.xs,
      marginTop: '6px',
      opacity: '0.85',
      lineHeight: '1.4',
    },
  },
  render: ({ props, injector, useDisposable, useHostProps, useRef }) => {
    const maxSize = props.maxImageSizeBytes ?? DEFAULT_MAX_IMAGE_SIZE
    const textareaRef = useRef<HTMLTextAreaElement>('textarea')

    useDisposable('form-registration', () => {
      const formService = injector.cachedSingletons.has(FormService) ? injector.getInstance(FormService) : null
      if (formService) {
        queueMicrotask(() => {
          if (textareaRef.current) formService.inputs.add(textareaRef.current as unknown as HTMLInputElement)
        })
      }
      return {
        [Symbol.dispose]: () => {
          if (textareaRef.current && formService)
            formService.inputs.delete(textareaRef.current as unknown as HTMLInputElement)
        },
      }
    })

    const validationResult = props.getValidationResult?.({ value: props.value })
    const isRequired = props.required && !props.value
    const isInvalid = validationResult?.isValid === false || isRequired

    if (injector.cachedSingletons.has(FormService) && props.name) {
      const formService = injector.getInstance(FormService)
      const fieldResult: InputValidationResult = isRequired
        ? { isValid: false, message: 'Value is required' }
        : validationResult || { isValid: true }
      const validity = textareaRef.current?.validity ?? ({} as ValidityState)
      formService.setFieldState(props.name as keyof unknown, fieldResult, validity)
    }

    useHostProps({
      'data-disabled': props.disabled ? '' : undefined,
      'data-invalid': isInvalid ? '' : undefined,
    })

    const helperNode =
      (validationResult?.isValid === false && validationResult?.message) ||
      (isRequired && 'Value is required') ||
      props.getHelperText?.({ value: props.value, validationResult }) ||
      ''

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
          reader.onerror = () => {
            console.warn('Failed to read pasted image file')
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
          name={props.name}
          required={props.required}
          value={props.value}
          oninput={handleInput}
          onpaste={handlePaste}
          readOnly={props.readOnly}
          disabled={props.disabled}
          placeholder={props.placeholder}
          rows={props.rows ?? 10}
        />
        {helperNode ? <span className="helperText">{helperNode}</span> : null}
      </label>
    )
  },
})
