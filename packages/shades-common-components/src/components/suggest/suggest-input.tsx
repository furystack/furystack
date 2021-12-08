import { Shade, createComponent } from '@furystack/shades'
import { SuggestManager } from './suggest-manager'

export const SuggestInput = Shade<{ manager: SuggestManager<any> }, { isOpened: boolean }>({
  getInitialState: ({ props }) => ({ isOpened: props.manager.isOpened.getValue() }),
  resources: ({ element, props }) => [
    props.manager.isOpened.subscribe(async (isOpened) => {
      const input = element.firstChild as HTMLInputElement
      if (isOpened) {
        input.focus()
      } else {
        input.value = ''
      }
    }),
  ],
  shadowDomName: 'shades-suggest-input',
  render: ({ element }) => {
    element.style.width = '100%' //manager.isOpened.getValue() ? '100%' : '0%'
    element.style.overflow = 'hidden'
    return (
      <input
        autofocus
        style={{
          color: 'white',
          outline: 'none',
          padding: '1em',
          background: 'transparent',
          border: 'none',
          display: 'inline-flex',
          width: 'calc(100% - 2em)',
        }}
      />
    )
  },
})
