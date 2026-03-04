import { createComponent, RouteMatchService, Shade, resolveRouteTitles } from '@furystack/shades'
import type { MatchChainEntry } from '@furystack/shades'
import { createBreadcrumb, Icon, icons, type BreadcrumbItem } from '@furystack/shades-common-components'

import type { appRoutes } from '../routes.tsx'

const ShowcaseBreadcrumbItem = createBreadcrumb<typeof appRoutes>()

export const ShowcaseBreadcrumbComponent = Shade({
  shadowDomName: 'showcase-breadcrumb-component',
  render: ({ injector, useObservable, useState }) => {
    const routeMatchService = injector.getInstance(RouteMatchService)

    const [resolvedItems, setResolvedItems] = useState<BreadcrumbItem[]>('resolvedItems', [])
    const [initializedRef] = useState<{ current: boolean }>('initialized', { current: false })

    const resolveAndSetTitles = async (chain: MatchChainEntry[]) => {
      const titles = await resolveRouteTitles(chain, injector)
      const items: BreadcrumbItem[] = []
      let accumulatedPath = ''

      for (let i = 0; i < chain.length; i++) {
        const title = titles[i]
        if (!title) continue

        // Skip the root "/" route in breadcrumbs (it's represented by the home icon)
        const matchPath = chain[i].match.path
        if (matchPath === '/') continue

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

    return (
      <ShowcaseBreadcrumbItem
        homeItem={{ path: '/', label: <Icon icon={icons.home} size="small" /> }}
        items={resolvedItems}
        separator=" › "
      />
    )
  },
})
