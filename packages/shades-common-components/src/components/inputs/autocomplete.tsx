import { Shade, createComponent } from '@furystack/shades'
import { Input, TextInputProps } from './input'

export const Autocomplete = Shade<
  { inputProps?: TextInputProps; suggestions: string[]; strict?: boolean; onchange?: (value: string) => void },
  { dataListId: string }
>({
  getInitialState: () => ({
    dataListId: (Math.random() + 1).toString(36).substring(3),
  }),
  constructed: ({ getState, element }) => {
    const { dataListId } = getState()
    const input = element.querySelector('input')
    if (input) {
      input.setAttribute('list', dataListId)
    }
  },
  shadowDomName: 'shade-autocomplete',
  render: ({ props, getState }) => {
    const { dataListId } = getState()
    return (
      <div>
        <Input
          {...props.inputProps}
          onchange={(ev) => {
            const { value } = ev.target as any
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
