import { Shade, createComponent } from '@furystack/shades'

export const Fab = Shade({
  shadowDomName: 'shade-fab',
  elementBase: HTMLButtonElement,
  elementBaseName: 'button',
  style: {
    position: 'fixed',
    bottom: '32px',
    right: '32px',
    background: 'gray',
    width: '64px',
    height: '64px',
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: '50%',
    boxShadow: '2px 2px 4px rgba(0,0,0,0.3)',
    cursor: 'pointer',
  },
  render: ({ children }) => {
    return <>{children}</>
  },
})
