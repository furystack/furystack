import { Shade } from '@furystack/shades'
import { CreateMicroFrontendService } from './create-microfrontend-service.js'

type MicroFrontendProps<TApi> = {
  api: TApi
  url: string
  loader?: JSX.Element
}

export const MicroFrontend: <TApi>(props: MicroFrontendProps<TApi>) => JSX.Element = Shade({
  shadowDomName: 'shade-micro-frontend',
  render: ({ props, injector, element }) => {
    const { api, url, loader } = props
    void import(url).then(({ default: creator }) => {
      // TODO: Type guard instead of runtime check? (e.g. different package versions)
      if (!(creator instanceof CreateMicroFrontendService)) {
        throw new Error('The default export of the entry point must be a an instance of CreateMicroFrontendService')
      }
      element.innerHTML = ''
      creator.create({ api, injector, rootElement: element })

      element.addEventListener('detach', () => {
        creator.destroy?.({ api, injector })
      })
    })

    return loader || null
  },
})
