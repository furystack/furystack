import { Shade, createComponent } from '@furystack/shades'
import type { CreateMicroFrontendService } from './create-microfrontend-service.js'

type MicroFrontendProps<TApi> = {
  api: TApi
  loaderCallback: () => Promise<CreateMicroFrontendService<TApi>>
  loader?: JSX.Element
  error?: (error: unknown, retry: () => Promise<void>) => JSX.Element
}

export const MicroFrontend: <TApi>(props: MicroFrontendProps<TApi>) => JSX.Element = Shade({
  shadowDomName: 'shade-micro-frontend',
  render: ({ props, injector, useDisposable, useRef }) => {
    const containerRef = useRef<HTMLDivElement>('mfeContainer')

    useDisposable('mfe-loader', () => {
      let destroyFn: (() => void) | undefined

      const tryCreateComponent = async () => {
        const container = containerRef.current
        if (!container) return

        const creatorService = await props.loaderCallback()

        const childInjector = injector.createChild({
          owner: creatorService,
        })

        container.innerHTML = ''

        creatorService.create({
          api: props.api,
          rootElement: container,
          injector: childInjector,
        })

        destroyFn = () => creatorService.destroy?.({ api: props.api, injector: childInjector })
      }

      queueMicrotask(() => {
        tryCreateComponent().catch((error: unknown) => {
          if (props.error && containerRef.current) {
            containerRef.current.appendChild(
              props.error(error, async () => {
                await tryCreateComponent()
              }),
            )
          }
        })
      })

      return {
        [Symbol.asyncDispose]: async () => destroyFn?.(),
      }
    })

    return (
      <div ref={containerRef} style={{ display: 'contents' }}>
        {props.loader || null}
      </div>
    )
  },
})
