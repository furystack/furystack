import { Shade, createComponent } from '@furystack/shades'
import { cssVariableTheme } from '../services/css-variable-theme.js'

export type ModalProps = {
  backdropStyle?: Partial<CSSStyleDeclaration>
  isVisible: boolean
  onClose?: () => void
  showAnimation?: (el: Element | null) => Promise<unknown>
  hideAnimation?: (el: Element | null) => Promise<unknown>
}

export const Modal = Shade<ModalProps>({
  customElementName: 'shade-modal',
  css: {
    fontFamily: cssVariableTheme.typography.fontFamily,
    '& .shade-backdrop': {
      width: '100%',
      height: '100%',
      display: 'block',
      position: 'fixed',
      top: '0',
      left: '0',
    },
  },
  render: ({ props, children, useRef }) => {
    const { isVisible } = props
    const backdropRef = useRef<HTMLDivElement>('backdrop')

    if (isVisible) {
      queueMicrotask(() => {
        void props.showAnimation?.(backdropRef.current)
      })
    }

    return isVisible ? (
      <div
        ref={backdropRef}
        className="shade-backdrop"
        onclick={async () => {
          await props.hideAnimation?.(backdropRef.current)
          props.onClose?.()
        }}
        style={props.backdropStyle}
      >
        {children}
      </div>
    ) : null
  },
})
