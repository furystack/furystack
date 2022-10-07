import { Shade } from '../shade.js'
import type { PartialElement } from '../models/partial-element.js'
import { LocationService } from '../services/location-service.js'
import { createComponent } from '../shade-component.js'

export type RouteLinkProps = PartialElement<HTMLAnchorElement>

export const RouteLink = Shade<RouteLinkProps>({
  shadowDomName: 'route-link',
  render: ({ children, props, injector }) => {
    return (
      <a
        {...props}
        onclick={(ev: MouseEvent) => {
          ev.preventDefault()
          history.pushState('', props.title || '', props.href)
          injector.getInstance(LocationService).updateState()
        }}
      >
        {children}
      </a>
    )
  },
})
