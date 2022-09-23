import { Shade, createComponent } from '@furystack/shades'
import { ObservableValue } from '@furystack/utils'

export type ModalProps = {
  backdropStyle?: Partial<CSSStyleDeclaration>
  isVisible: ObservableValue<boolean>
  onClose?: () => void
  showAnimation?: (el: Element | null) => Promise<unknown>
  hideAnimation?: (el: Element | null) => Promise<unknown>
}

export const Modal = Shade<ModalProps, { isVisible?: boolean }>({
  getInitialState: ({ props }) => ({ isVisible: props.isVisible.getValue() }),
  shadowDomName: 'shade-modal',
  resources: ({ props, element, updateState }) => [
    props.isVisible.subscribe(async (visible) => {
      if (visible) {
        updateState({ isVisible: visible })
        await props.showAnimation?.(element)
      } else {
        await props.hideAnimation?.(element).finally(() => updateState({ isVisible: visible }))
      }
    }),
  ],

  render: ({ props, getState, children }) => {
    const { isVisible } = getState()
    return isVisible ? (
      <div
        className="shade-backdrop"
        onclick={() => {
          props.onClose?.()
        }}
        style={{
          width: '100%',
          height: '100%',
          display: 'block',
          position: 'fixed',
          top: '0',
          left: '0',
          ...props.backdropStyle,
        }}
      >
        {children}
      </div>
    ) : null
  },
})
