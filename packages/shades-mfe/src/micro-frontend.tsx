import { Shade } from '@furystack/shades'
import type { CreateMicroFrontendService } from './create-microfrontend-service.js'

type MicroFrontendProps<TApi> = {
  api: TApi
  loaderCallback: () => Promise<CreateMicroFrontendService<TApi>>
  loader?: JSX.Element
  error?: (error: unknown, retry: () => Promise<void>) => JSX.Element
}

export const MicroFrontend: <TApi>(props: MicroFrontendProps<TApi>) => JSX.Element = Shade({
  tagName: 'shade-micro-frontend',
  render: ({ props, element, injector, useDisposable }) => {
    useDisposable('mfe-loader', () => {
      let cleanup: (() => void) | undefined

      void (async () => {
        const tryCreateComponent = async () => {
          const creatorService = await props.loaderCallback()
          // TODO: Think about type checking
          // if (!(creatorService instanceof CreateMicroFrontendService)) {
          //   throw new Error('Invalid creator service')
          // }

          const childInjector = injector.createChild({
            owner: creatorService,
          })

          element.innerHTML = ''

          creatorService.create({
            api: props.api,
            rootElement: element,
            injector: childInjector,
          })

          cleanup = () => creatorService.destroy?.({ api: props.api, injector: childInjector })
        }

        try {
          await tryCreateComponent()
        } catch (error) {
          if (props.error) {
            element.appendChild(
              props.error(error, async () => {
                await tryCreateComponent()
              }),
            )
          }
        }
      })()

      return { [Symbol.dispose]: () => cleanup?.() }
    })

    return props.loader || null
  },
})
