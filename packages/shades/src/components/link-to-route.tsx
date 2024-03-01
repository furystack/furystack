import { compile } from 'path-to-regexp'
import type { Route } from './router.js'
import { Shade } from '../shade.js'
import type { ChildrenList } from '../models/children-list.js'
import { attachProps, createComponent } from '../shade-component.js'

export type LinkToRouteProps<T extends object> = {
  route: Pick<Route<T>, 'url'>
  params: T
} & Omit<JSX.IntrinsicElements['a'], 'href'>

export const LinkToRoute: <T extends object>(props: LinkToRouteProps<T>, children: ChildrenList) => JSX.Element = Shade(
  {
    shadowDomName: 'link-to-route',
    elementBase: HTMLAnchorElement,
    elementBaseName: 'a',
    render: ({ props, element, children }) => {
      const { route, params, ...aProps } = props

      const url = compile(route.url)(params)

      attachProps(element, { ...aProps, href: url })

      return <>{children}</>
    },
  },
)
