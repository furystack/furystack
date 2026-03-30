import type { MatchChainEntry, PartialElement } from '@furystack/shades'
import { createComponent, RouteMatchService, Shade, resolveRouteTitles } from '@furystack/shades'

import type { BreadcrumbItem } from './breadcrumb.js'
import { Breadcrumb } from './breadcrumb.js'

/**
 * Props for the RouteBreadcrumb component.
 */
export type RouteBreadcrumbProps = {
  homeItem?: BreadcrumbItem
  separator?: string | JSX.Element
  lastItemClickable?: boolean
  /**
   * When true, the root `'/'` path segment is excluded from the generated items.
   * Typically the root is represented by `homeItem` instead.
   * @default true
   */
  skipRootPath?: boolean
} & PartialElement<HTMLElement>

/**
 * Breadcrumb component that automatically derives its items from the current
 * {@link RouteMatchService} match chain. It resolves route titles from
 * `meta.title` (supporting async resolvers) and accumulates path segments
 * to produce the correct `href` for each breadcrumb link.
 *
 * @example
 * ```tsx
 * <RouteBreadcrumb
 *   homeItem={{ path: '/', label: <Icon icon={icons.home} size="small" /> }}
 *   separator=" › "
 * />
 * ```
 */
export const RouteBreadcrumb = Shade<RouteBreadcrumbProps>({
  customElementName: 'shade-route-breadcrumb',
  render: ({ props, injector, useObservable, useState }) => {
    const { skipRootPath = true, ...breadcrumbProps } = props

    const routeMatchService = injector.getInstance(RouteMatchService)

    const [resolvedItems, setResolvedItems] = useState<BreadcrumbItem[]>('resolvedItems', [])
    const [initializedRef] = useState<{ current: boolean }>('initialized', { current: false })
    const [generationRef] = useState<{ current: number }>('generation', { current: 0 })

    const resolveAndSetTitles = async (chain: MatchChainEntry[]) => {
      const generation = ++generationRef.current
      const titles = await resolveRouteTitles(chain, injector)

      if (generation !== generationRef.current) return

      const items: BreadcrumbItem[] = []
      let accumulatedPath = ''

      for (let i = 0; i < chain.length; i++) {
        const title = titles[i]
        if (!title) continue

        const matchPath = chain[i].match.path
        if (skipRootPath && matchPath === '/') continue

        accumulatedPath += matchPath
        items.push({ path: accumulatedPath, label: title })
      }

      setResolvedItems(items)
    }

    const [matchChain] = useObservable('matchChain', routeMatchService.currentMatchChain, {
      onChange: (chain) => {
        void resolveAndSetTitles(chain)
      },
    })

    if (!initializedRef.current) {
      initializedRef.current = true
      void resolveAndSetTitles(matchChain)
    }

    return <Breadcrumb items={resolvedItems} {...breadcrumbProps} />
  },
})
