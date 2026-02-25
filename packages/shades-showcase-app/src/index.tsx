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
  useTheme: async (
    themeName:
      | 'dark'
      | 'light'
      | 'paladin'
      | 'chieftain'
      | 'neon-runner'
      | 'vault-dweller'
      | 'shadow-broker'
      | 'dragonborn'
      | 'plumber'
      | 'auditore'
      | 'replicant'
      | 'sandworm'
      | 'architect'
      | 'wild-hunt'
      | 'black-mesa',
  ) => {
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
      case 'neon-runner': {
        const { neonRunnerTheme } = await import('@furystack/shades-common-components/themes/neon-runner')
        themeProvider.setAssignedTheme(neonRunnerTheme)
        console.log('Wake up, Samurai. We have a city to burn.')
        break
      }
      case 'vault-dweller': {
        const { vaultDwellerTheme } = await import('@furystack/shades-common-components/themes/vault-dweller')
        themeProvider.setAssignedTheme(vaultDwellerTheme)
        console.log('War. War never changes.')
        break
      }
      case 'shadow-broker': {
        const { shadowBrokerTheme } = await import('@furystack/shades-common-components/themes/shadow-broker')
        themeProvider.setAssignedTheme(shadowBrokerTheme)
        console.log("I'm the Shadow Broker. I know everything.")
        break
      }
      case 'dragonborn': {
        const { dragonbornTheme } = await import('@furystack/shades-common-components/themes/dragonborn')
        themeProvider.setAssignedTheme(dragonbornTheme)
        console.log('Fus Ro Dah!')
        break
      }
      case 'plumber': {
        const { plumberTheme } = await import('@furystack/shades-common-components/themes/plumber')
        themeProvider.setAssignedTheme(plumberTheme)
        console.log("It's-a me, Mario!")
        break
      }
      case 'auditore': {
        const { auditoreTheme } = await import('@furystack/shades-common-components/themes/auditore')
        themeProvider.setAssignedTheme(auditoreTheme)
        console.log('Nothing is true, everything is permitted.')
        break
      }
      case 'replicant': {
        const { replicantTheme } = await import('@furystack/shades-common-components/themes/replicant')
        themeProvider.setAssignedTheme(replicantTheme)
        console.log('All those moments will be lost in time, like tears in rain.')
        break
      }
      case 'sandworm': {
        const { sandwormTheme } = await import('@furystack/shades-common-components/themes/sandworm')
        themeProvider.setAssignedTheme(sandwormTheme)
        console.log('The spice must flow.')
        break
      }
      case 'architect': {
        const { architectTheme } = await import('@furystack/shades-common-components/themes/architect')
        themeProvider.setAssignedTheme(architectTheme)
        console.log('There is no spoon.')
        break
      }
      case 'wild-hunt': {
        const { wildHuntTheme } = await import('@furystack/shades-common-components/themes/wild-hunt')
        themeProvider.setAssignedTheme(wildHuntTheme)
        console.log("Wind's howling.")
        break
      }
      case 'black-mesa': {
        const { blackMesaTheme } = await import('@furystack/shades-common-components/themes/black-mesa')
        themeProvider.setAssignedTheme(blackMesaTheme)
        console.log('Rise and shine, Mr. Freeman. Rise and shine.')
        break
      }
      default:
        break
    }
  },
})
