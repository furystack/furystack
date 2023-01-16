import { Shade, createComponent } from '@furystack/shades'
import type { ObservableValue } from '@furystack/utils'

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
  resources: ({ props, element, useState }) => [
    props.isVisible.subscribe(async (visible) => {
      const [, setVisible] = useState('isVisible')
      if (visible) {
        setVisible(visible)
        await props.showAnimation?.(element)
      } else {
        props.hideAnimation
          ? await props.hideAnimation?.(element).finally(() => setVisible(visible))
          : setVisible(visible)
      }
    }),
  ],

  render: ({ props, useState, children }) => {
    const [isVisible] = useState('isVisible')
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
