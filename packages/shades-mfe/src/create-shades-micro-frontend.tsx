import type { ShadeComponent } from '@furystack/shades'
import { createComponent, initializeShadeRoot } from '@furystack/shades'
import type { CreateMfeCallback } from './create-custom-micro-frontend.js'
import { CreateMicroFrontendService } from './create-microfrontend-service.js'

export const createShadesMicroFrontend = <TApi extends object>(Component: ShadeComponent<TApi>) => {
  const create: CreateMfeCallback<TApi> = ({ api, rootElement, injector }) => {
    const childInjector = injector.createChild({
      owner: createShadesMicroFrontend,
    })
    initializeShadeRoot({
      jsxElement: <Component {...api} />,
      rootElement,
      injector: childInjector,
    })

    rootElement.addEventListener('detach', () => {})
  }
  return new CreateMicroFrontendService(create)
}
