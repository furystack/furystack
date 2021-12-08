import { Shade } from '../shade'
import { PartialElement } from '../models'
import { LocationService } from '../services'
import { createComponent } from '..'

export const RouteLink = Shade<PartialElement<HTMLAnchorElement>>({
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
