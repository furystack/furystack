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
  constructed({ element, useState }) {
    const [dataListId] = useState('dataListId', (Math.random() + 1).toString(36).substring(3))
    element.querySelector('input')?.setAttribute('list', dataListId)
  },
  render: ({ props, useState }) => {
    const [dataListId] = useState('dataListId', (Math.random() + 1).toString(36).substring(3))

    return (
      <>
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
      </>
    )
  },
})
