declare global {
  interface CSSStyleDeclaration {
    backdropFilter: string
  }
}

const glassBox: Partial<CSSStyleDeclaration> = {
  backdropFilter: 'blur(4px)',
  borderRadius: '5px',
  border: '1px solid rgba(128, 128, 128, 0.3)',
  boxShadow: 'rgba(0, 0, 0, 0.3) 2px 2px 2px, 1px 1px 3px -2px rgba(255,255,255,0.3) inset',
}

export const colors = {
  primary: {
    light: '#82e9de',
    main: '#4db6ac',
    dark: '#00867d',
    contrastText: '#000',
  },
  secondary: {
    light: '#62727b',
    main: '#37474f',
    dark: '#102027',
    contrastText: '#fff',
  },
  error: {
    main: 'red',
  },
}

export const styles = {
  glassBox,
}
