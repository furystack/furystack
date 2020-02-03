import { createComponent, initializeShadeRoot } from '@furystack/shades'
import { Injector } from '@furystack/inject'
import { VerboseConsoleLogger } from '@furystack/logging'
import { Layout } from './components/layout'

const injector = new Injector().useLogging(VerboseConsoleLogger)

const rootElement: HTMLDivElement = document.getElementById('root') as HTMLDivElement

initializeShadeRoot({
  injector,
  rootElement,
  jsxElement: <Layout />,
})
