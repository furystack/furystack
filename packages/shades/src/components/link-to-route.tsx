import { compileRoute } from '../compile-route.js'
import type { ChildrenList } from '../models/children-list.js'
import { createComponent } from '../shade-component.js'
import { Shade } from '../shade.js'
import type { Route } from './router.js'

/** @deprecated Use `NestedRouteLinkProps` from `nested-route-link` instead */
export type LinkToRouteProps<T extends object> = {
  route: Route<T>
  params: T
} & Omit<JSX.IntrinsicElements['a'], 'href'>

/** @deprecated Use `NestedRouteLink` from `nested-route-link` instead */
export const LinkToRoute: <T extends object>(props: LinkToRouteProps<T>, children?: ChildrenList) => JSX.Element =
  Shade({
    tagName: 'link-to-route',
    elementBase: HTMLAnchorElement,
    elementBaseName: 'a',
    render: ({ props, element, children }) => {
      const { route, params } = props

      const url = compileRoute(route.url, params)
      element.setAttribute('href', url)
      return <>{children}</>
    },
  })
