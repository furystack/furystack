import { Shade } from '../shade.js'
import type { PartialElement } from '../models/partial-element.js'
import { LocationService } from '../services/location-service.js'
import { attachProps, createComponent } from '../shade-component.js'

export type RouteLinkProps = PartialElement<Omit<HTMLAnchorElement, 'onclick'>>

export const RouteLink = Shade<RouteLinkProps>({
  shadowDomName: 'route-link',
  elementBase: HTMLAnchorElement,
  elementBaseName: 'a',
  render: ({ children, props, injector, element }) => {
    attachProps(element, {
      ...props,
      style: {
        color: 'inherit',
        textDecoration: 'inherit',
        ...props.style,
      },
      onclick: (ev: MouseEvent) => {
        ev.preventDefault()
        history.pushState('', props.title || '', props.href)
        injector.getInstance(LocationService).updateState()
      },
    })
    return <>{children}</>
  },
})
