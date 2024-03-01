import type { ChildrenList, Route } from '@furystack/shades'
import { Shade, createComponent, attachProps } from '@furystack/shades'
import { compile } from 'path-to-regexp'

export type LinkToRouteProps<T extends object> = {
  route: Pick<Route<T>, 'url'>
  params: T
} & Omit<JSX.IntrinsicElements['a'], 'href'>

export const LinkToRoute: <T extends object>(props: LinkToRouteProps<T>, children: ChildrenList) => JSX.Element = Shade(
  {
    shadowDomName: 'pi-rat-route-link',
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
