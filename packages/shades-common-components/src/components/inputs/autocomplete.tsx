import { Shade, createComponent } from '@furystack/shades'
import type { TextInputProps } from './input.js'
import { Input } from './input.js'

export const Autocomplete = Shade<{
  inputProps?: TextInputProps
  suggestions: string[]
  strict?: boolean
  onchange?: (value: string) => void
}>({
  shadowDomName: 'shade-autocomplete',
  render: ({ props, useState, useDisposable, useRef }) => {
    const wrapperRef = useRef<HTMLDivElement>('wrapper')

    useDisposable('datalist-binding', () => {
      const timer = setTimeout(() => {
        const [dataListId] = useState('dataListId', (Math.random() + 1).toString(36).substring(3))
        wrapperRef.current?.querySelector('input')?.setAttribute('list', dataListId)
      }, 0)
      return { [Symbol.dispose]: () => clearTimeout(timer) }
    })

    const [dataListId] = useState('dataListId', (Math.random() + 1).toString(36).substring(3))

    return (
      <div ref={wrapperRef} style={{ display: 'contents' }}>
        <Input
          {...props.inputProps}
          onchange={(ev) => {
            const { value } = ev.target as HTMLInputElement
            if (props.strict) {
              if (!props.suggestions.includes(value)) {
                ;(ev.target as HTMLInputElement).setCustomValidity('Please select a valid entry!')
                return
              }
            }
            props.onchange?.(value)
          }}
        />
        <datalist id={dataListId}>
          {props.suggestions.map((s) => (
            <option value={s} />
          ))}
        </datalist>
      </div>
    )
  },
})
