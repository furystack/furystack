import { DeepPartial } from '@sensenet/client-utils'
import { Shade } from '../shade'
import { createComponent } from '..'

export const RouteLink = Shade<DeepPartial<HTMLAnchorElement>, undefined>({
  initialState: undefined,
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
