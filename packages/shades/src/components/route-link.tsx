import { Shade } from '../shade'
import { PartialElement } from '../models'
import { createComponent } from '..'

export const RouteLink = Shade<PartialElement<HTMLAnchorElement>>({
  shadowDomName: 'route-link',
  render: ({ children, props }) => {
    return (
      <a
        {...props}
        onclick={(ev: MouseEvent) => {
          ev.preventDefault()
          history.pushState('', props.title || '', props.href)
        }}>
        {children}
      </a>
    )
  },
})
