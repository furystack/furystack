import { terminal } from 'terminal-kit'
import { Injector } from '@furystack/inject'
import '@furystack/logging'
import './config'
import { mainMenu } from './menus/main'
import { InMemoryLogging } from './in-memory-logging'
import { CheckPrerequisitesService, genericPrerequisites } from './services/check-prerequisites'

export const injector = new Injector().useLogging(InMemoryLogging).useConfig({})
;(async () => {
  await injector.getConfig().init()

  terminal
    .windowTitle('OnBoard v0.0.1')
    .clear()
    .defaultColor('-------------')
    .white('OnBoard v0.0.1')
    .defaultColor('-------------')
    .nextLine(1)

  const prereqChecks = await injector
    .getInstance(CheckPrerequisitesService)
    .check(...injector.getConfig().prerequisites, ...genericPrerequisites)

  if (prereqChecks.length) {
    terminal
      .nextLine(1)
      .red('The following prerequisites has not been met:')
      .nextLine(2)
    prereqChecks.map(msg => terminal.red(msg).nextLine(1))
  }

  const run = true
  while (run) {
    await mainMenu(injector)
  }
})()
