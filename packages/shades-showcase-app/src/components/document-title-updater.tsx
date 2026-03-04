import { createComponent, RouteMatchService, Shade, resolveRouteTitles, buildDocumentTitle } from '@furystack/shades'
import type { MatchChainEntry } from '@furystack/shades'

const APP_TITLE = 'FuryStack Shades'

/**
 * Invisible component that updates `document.title` reactively
 * based on the current match chain from `RouteMatchService`.
 */
export const DocumentTitleUpdater = Shade({
  shadowDomName: 'document-title-updater',
  render: ({ injector, useObservable }) => {
    const routeMatchService = injector.getInstance(RouteMatchService)

    const updateTitle = async (chain: MatchChainEntry[]) => {
      const titles = await resolveRouteTitles(chain)
      document.title = buildDocumentTitle(titles, { prefix: APP_TITLE, separator: ' / ' })
    }

    const [matchChain] = useObservable('matchChain', routeMatchService.currentMatchChain, {
      onChange: (chain) => {
        void updateTitle(chain)
      },
    })

    void updateTitle(matchChain)

    return <></>
  },
})
