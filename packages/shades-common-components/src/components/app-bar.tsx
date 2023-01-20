import { Shade, createComponent, attachProps } from '@furystack/shades'
import { ThemeProviderService } from '../services/theme-provider-service'

export const AppBar = Shade({
  shadowDomName: 'shade-app-bar',
  constructed: ({ element }) => {
    requestAnimationFrame(() => {
      element.style.opacity = '1'
    })
  },
  render: ({ children, injector, element }) => {
    const { theme } = injector.getInstance(ThemeProviderService)
    attachProps(element, {
      style: {
        width: '100%',
        background: 'rgba(128,128,128,0.2)',
        backdropFilter: 'blur(15px)',
        display: 'flex',
        justifyContent: 'flex-start',
        alignItems: 'center',
        boxShadow: '0 0 12px rgba(0,0,0,0.6)',
        transition:
          'opacity .35s cubic-bezier(0.550, 0.085, 0.680, 0.530), padding .2s cubic-bezier(0.550, 0.085, 0.680, 0.530)',
        opacity: '0',
        position: 'fixed',
        zIndex: '1',
        color: theme.text.secondary,
      },
    })
    return <>{children}</>
  },
})
