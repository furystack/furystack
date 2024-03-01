import { compile } from 'path-to-regexp'
import type { Route } from './router.js'
import { Shade } from '../shade.js'
import type { ChildrenList } from '../models/children-list.js'
import { createComponent } from '../shade-component.js'

export type LinkToRouteProps<T extends {}> = {
  route: Route<T>
  params: T
} & Omit<JSX.IntrinsicElements['a'], 'href'>

export const LinkToRoute: <T extends {}>(props: LinkToRouteProps<T>, children?: ChildrenList) => JSX.Element = Shade({
  shadowDomName: 'link-to-route',
  elementBase: HTMLAnchorElement,
  elementBaseName: 'a',
  render: ({ props, element, children }) => {
    const { route, params } = props

    const url = compile(route.url)(params)
    element.setAttribute('href', url)
    return <>{children}</>
  },
})
