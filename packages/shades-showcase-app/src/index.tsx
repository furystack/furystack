/// <reference types="vite/client" />

import { Injector } from '@furystack/inject'
import { LocationService, createComponent, initializeShadeRoot } from '@furystack/shades'
import { defaultLightTheme, ThemeProviderService, useThemeCssVariables } from '@furystack/shades-common-components'
import { App } from './app.js'
import './style.css'

export const shadesInjector = new Injector()

shadesInjector.getInstance(ThemeProviderService)

useThemeCssVariables(defaultLightTheme)

const el = document.querySelector('#root') as HTMLDivElement

initializeShadeRoot({
  injector: shadesInjector,
  rootElement: el,
  jsxElement: <App />,
})

shadesInjector
  .getInstance(LocationService)
  .useSearchParam('searchValue', 'default value')
  .subscribe((value) => {
    console.log('searchValue param changed', value)
  })
