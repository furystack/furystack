import { Shade } from '../shade'
import type { PartialElement } from '../models'
import { LocationService } from '../services'
import { createComponent } from '..'

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
