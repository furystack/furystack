import { Shade, createComponent } from '@furystack/shades'
import { ThemeProviderService } from '../services/theme-provider-service'

export const AppBar = Shade({
  shadowDomName: 'shade-app-bar',
  resources: ({ element, injector }) => [
    injector.getInstance(ThemeProviderService).theme.subscribe((t) => {
      ;(element.children[0] as HTMLElement).style.color = t.text.secondary
    }, true), // TODO: Check TRUE
  ],
  constructed: ({ element }) => {
    const container = element.children[0] as HTMLElement
    requestAnimationFrame(() => {
      container.style.padding = '8px 8px'
      container.style.opacity = '1'
    })
  },
  render: ({ children }) => {
    return (
      <div
        style={{
          width: '100%',
          background: 'rgba(128,128,128,0.2)',
          backdropFilter: 'blur(15px)',
          display: 'flex',
          justifyContent: 'flex-start',
          alignItems: 'center',
          boxShadow: '0 0 12px rgba(0,0,0,0.6)',
          transition:
            'opacity .35s cubic-bezier(0.550, 0.085, 0.680, 0.530), padding .2s cubic-bezier(0.550, 0.085, 0.680, 0.530)',
          padding: '6px 16px',
          opacity: '0',
          position: 'fixed',
          zIndex: '1',
        }}
      >
        {children}
      </div>
    )
  },
})
