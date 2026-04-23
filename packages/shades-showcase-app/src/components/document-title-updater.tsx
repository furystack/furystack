import { createComponent, RouteMatchService, Shade, resolveRouteTitles, buildDocumentTitle } from '@furystack/shades'
import type { MatchChainEntry } from '@furystack/shades'

const APP_TITLE = 'FuryStack Shades'

/**
 * Invisible component that updates `document.title` reactively
 * based on the current match chain from `RouteMatchService`.
 */
export const DocumentTitleUpdater = Shade({
  customElementName: 'document-title-updater',
  render: ({ injector, useObservable, useState }) => {
    const routeMatchService = injector.get(RouteMatchService)

    const updateTitle = async (chain: MatchChainEntry[]) => {
      const titles = await resolveRouteTitles(chain, injector)
      document.title = buildDocumentTitle(titles, { prefix: APP_TITLE, separator: ' / ' })
    }

    const [initializedRef] = useState<{ current: boolean }>('initialized', { current: false })

    const [matchChain] = useObservable('matchChain', routeMatchService.currentMatchChain, {
      onChange: (chain) => {
        void updateTitle(chain)
      },
    })

    if (!initializedRef.current) {
      initializedRef.current = true
      void updateTitle(matchChain)
    }

    return <></>
  },
})
