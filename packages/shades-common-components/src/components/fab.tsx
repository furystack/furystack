import { Shade, createComponent } from '@furystack/shades'

export const Fab = Shade({
  shadowDomName: 'shade-fab',
  elementBase: HTMLButtonElement,
  elementBaseName: 'button',
  css: {
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
    border: 'none',
    transition: 'transform 0.2s ease, box-shadow 0.2s ease',
    '&:hover': {
      transform: 'scale(1.05)',
      boxShadow: '3px 3px 6px rgba(0,0,0,0.4)',
    },
    '&:active': {
      transform: 'scale(0.95)',
    },
  },
  render: ({ children }) => {
    return <>{children}</>
  },
})
