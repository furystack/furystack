import { Shade, createComponent } from '@furystack/shades'

export const Modal = Shade<{ isVisible: boolean; onClose?: () => void }>({
  shadowDomName: 'shade-modal',
  render: ({ props, children }) => {
    return props.isVisible ? (
      <div
        className="shade-backdrop"
        onclick={() => props.onClose?.()}
        style={{
          width: '100%',
          height: '100%',
          display: 'block',
          position: 'fixed',
          top: '0',
          left: '0',
        }}>
        {children}
      </div>
    ) : (
      <div />
    )
  },
})
