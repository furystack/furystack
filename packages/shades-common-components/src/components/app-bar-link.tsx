import type { RouteLinkProps } from '@furystack/shades'
import { createComponent, LocationService, RouteLink, Shade } from '@furystack/shades'
import { match } from 'path-to-regexp'
import { ThemeProviderService } from '../services'

export const AppBarLink = Shade<RouteLinkProps, { isActive: boolean }>({
  getInitialState: () => ({ isActive: false }),
  resources: ({ injector, props, updateState, element, getState }) => {
    const updateColor = () => {
      const { isActive } = getState()
      const themeProviderService = injector.getInstance(ThemeProviderService)
      const theme = themeProviderService.theme.getValue()
      const el = element.querySelector('a') as HTMLElement
      const backgroundColor = isActive ? theme.button.active : 'rgba(128, 128, 128, 0.05)'

      el.style.backgroundColor = backgroundColor
      el.style.color = themeProviderService.getTextColor(backgroundColor)
    }
    return [
      injector.getInstance(LocationService).onLocationChanged.subscribe(async (currentUrl) => {
        const isActive = !!match(props.href as string)(currentUrl)
        updateState({ isActive }, false)
        updateColor()
      }, true),
    ]
  },
  shadowDomName: 'shade-app-bar-link',
  render: ({ children, props }) => {
    return (
      <RouteLink
        style={{
          display: 'flex',
          height: '100%',
          textDecoration: 'none',
          alignItems: 'center',
          padding: '0 8px',
          ...props.style,
        }}
        {...props}
      >
        {children}
      </RouteLink>
    )
  },
})
