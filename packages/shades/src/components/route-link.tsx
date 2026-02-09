import type { PartialElement } from '../models/partial-element.js'
import { LocationService } from '../services/location-service.js'
import { createComponent } from '../shade-component.js'
import { Shade } from '../shade.js'

/** @deprecated Use `NestedRouteLinkProps` from `nested-route-link` instead */
export type RouteLinkProps = PartialElement<Omit<HTMLAnchorElement, 'onclick'>>

/** @deprecated Use `NestedRouteLink` from `nested-route-link` instead */
export const RouteLink = Shade<RouteLinkProps>({
  shadowDomName: 'route-link',
  elementBase: HTMLAnchorElement,
  elementBaseName: 'a',
  css: {
    color: 'inherit',
    textDecoration: 'inherit',
  },
  render: ({ children, props, injector, useHostProps }) => {
    useHostProps({
      onclick: (ev: MouseEvent) => {
        ev.preventDefault()
        history.pushState('', props.title || '', props.href)
        injector.getInstance(LocationService).updateState()
      },
    })
    return <>{children}</>
  },
})
