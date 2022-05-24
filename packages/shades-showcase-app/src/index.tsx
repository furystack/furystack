import { Injector } from '@furystack/inject'
import { createComponent, initializeShadeRoot } from '@furystack/shades'
import { defaultLightTheme, ThemeProviderService } from '@furystack/shades-common-components'
import { App } from './app'

export const shadesInjector = new Injector()

shadesInjector.getInstance(ThemeProviderService).theme.setValue(defaultLightTheme)

const el = document.querySelector('#root') as HTMLDivElement

initializeShadeRoot({
  injector: shadesInjector,
  rootElement: el,
  jsxElement: <App />,
})
