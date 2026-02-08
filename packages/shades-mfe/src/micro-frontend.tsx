import { Shade } from '@furystack/shades'
import type { CreateMicroFrontendService } from './create-microfrontend-service.js'

type MicroFrontendProps<TApi> = {
  api: TApi
  loaderCallback: () => Promise<CreateMicroFrontendService<TApi>>
  loader?: JSX.Element
  error?: (error: unknown, retry: () => Promise<void>) => JSX.Element
}

export const MicroFrontend: <TApi>(props: MicroFrontendProps<TApi>) => JSX.Element = Shade({
  shadowDomName: 'shade-micro-frontend',
  render: ({ props, element, injector, useDisposable }) => {
    useDisposable('mfe-loader', () => {
      let destroyFn: (() => void) | undefined

      const tryCreateComponent = async () => {
        const creatorService = await props.loaderCallback()

        const childInjector = injector.createChild({
          owner: creatorService,
        })

        element.innerHTML = ''

        creatorService.create({
          api: props.api,
          rootElement: element,
          injector: childInjector,
        })

        destroyFn = () => creatorService.destroy?.({ api: props.api, injector: childInjector })
      }

      tryCreateComponent().catch((error: unknown) => {
        if (props.error) {
          element.appendChild(
            props.error(error, async () => {
              await tryCreateComponent()
            }),
          )
        }
      })

      return {
        [Symbol.asyncDispose]: async () => destroyFn?.(),
      }
    })

    return props.loader || null
  },
})
