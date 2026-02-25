/// <reference types="vite/client" />

import { Injector } from '@furystack/inject'
import { createComponent, initializeShadeRoot, LocationService } from '@furystack/shades'
import {
  defaultDarkTheme,
  defaultLightTheme,
  ThemeProviderService,
  useThemeCssVariables,
} from '@furystack/shades-common-components'
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

Object.assign(window, {
  useTheme: async (themeName: 'dark' | 'light' | 'paladin' | 'chieftain') => {
    const themeProvider = shadesInjector.getInstance(ThemeProviderService)
    switch (themeName) {
      case 'dark':
        themeProvider.setAssignedTheme(defaultDarkTheme)
        break
      case 'light':
        themeProvider.setAssignedTheme(defaultLightTheme)
        break
      case 'paladin': {
        const { paladinTheme } = await import('@furystack/shades-common-components/themes/paladin')
        themeProvider.setAssignedTheme(paladinTheme)
        console.log('Cheat Enabled, You Wascally Wabbit!')
        break
      }
      case 'chieftain': {
        const { chieftainTheme } = await import('@furystack/shades-common-components/themes/chieftain')
        themeProvider.setAssignedTheme(chieftainTheme)
        console.log('It is a good day to die!')
        break
      }
      default:
        break
    }
  },
})
