import { Shade } from '../shade'
import type { PartialElement } from '../models'
import { LocationService } from '../services'
import { attachProps, createComponent } from '..'

export type RouteLinkProps = PartialElement<HTMLAnchorElement>

export const RouteLink = Shade<RouteLinkProps>({
  shadowDomName: 'route-link',
  render: ({ children, props, injector, element }) => {
    attachProps(element, {
      ...props,
      onclick: (ev: MouseEvent) => {
        ev.preventDefault()
        history.pushState('', props.title || '', props.href)
        injector.getInstance(LocationService).updateState()
      },
    })
    return (
      <a href={props.href} style={{ color: 'inherit', textDecoration: 'inherit' }} onclick={(e) => e.preventDefault()}>
        {children}
      </a>
    )
  },
})
