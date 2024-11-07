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
  constructed: async ({ props, element, injector }) => {
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

    return () => creatorService.destroy?.({ api: props.api, injector: childInjector })
  },
  render: ({ props }) => {
    return props.loader || null
  },
})
