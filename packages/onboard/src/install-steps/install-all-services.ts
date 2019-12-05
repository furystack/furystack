import { terminal } from 'terminal-kit'
import { sleepAsync } from '@furystack/utils'
import { Injector } from '@furystack/inject'
import Semaphore from 'semaphore-async-await'
import { CheckPrerequisitesService } from '../services/check-prerequisites'
import { installService } from './install-service'

export const installAllServices = async (injector: Injector) => {
  const config = injector.getConfig()
  const { parallel } = config.options

  const lock = new Semaphore(parallel)

  const cfg = config.getConfigData()

  const checks = await injector.getInstance(CheckPrerequisitesService).checkPrerequisiteForServices(...cfg.services)
  if (checks.length) {
    terminal
      .nextLine(2)
      .red('The following prerequisites has not been met:')
      .nextLine(2)
    for (const req of checks) {
      terminal.red(` - ${req}`).nextLine(1)
    }
    await terminal.singleColumnMenu(['Ok, go back :(']).promise
    terminal.restoreCursor()
    terminal.eraseDisplayBelow()
    return
  }

  terminal.saveCursor()

  const servicesProgress = terminal.progressBar({
    title: 'Installing services...',
    items: cfg.services.length,
    eta: true,
    percent: true,
  })
  terminal.saveCursor()

  const promises = cfg.services.map(async (service, index) => {
    await lock.acquire()
    await sleepAsync(index * 100)
    terminal.restoreCursor()
    terminal.nextLine(1)
    servicesProgress.startItem(service.appName)
    installService(injector, service, cfg.directories.output, cfg.directories.input).then(() => {
      servicesProgress.itemDone(service.appName)
      lock.release()
    })
  })

  await Promise.all(promises)

  await sleepAsync(100)

  terminal.restoreCursor()
  terminal.previousLine(1)
  terminal.eraseDisplayBelow()
}
