import { Shade, createComponent } from '@furystack/shades'
import type { ObservableValue } from '@furystack/utils'

export type ModalProps = {
  backdropStyle?: Partial<CSSStyleDeclaration>
  isVisible: ObservableValue<boolean>
  onClose?: () => void
  showAnimation?: (el: Element | null) => Promise<unknown>
  hideAnimation?: (el: Element | null) => Promise<unknown>
}

export const Modal = Shade<ModalProps>({
  tagName: 'shade-modal',
  css: {
    '& .shade-backdrop': {
      width: '100%',
      height: '100%',
      display: 'block',
      position: 'fixed',
      top: '0',
      left: '0',
    },
  },
  render: ({ props, children, useObservable, element }) => {
    const [isVisible] = useObservable('isVisible', props.isVisible)

    if (isVisible) {
      void props.showAnimation?.(element)
    }

    return isVisible ? (
      <div
        className="shade-backdrop"
        onclick={async () => {
          await props.hideAnimation?.(element)
          props.onClose?.()
        }}
        style={props.backdropStyle}
      >
        {children}
      </div>
    ) : null
  },
})
