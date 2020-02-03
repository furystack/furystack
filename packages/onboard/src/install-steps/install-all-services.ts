import { CheckPrerequisitesService } from '../services/check-prerequisites'
import { InstallStep } from '../models/install-step'
import { installService } from './install-service'
import { terminal } from 'terminal-kit'
import { sleepAsync } from '@furystack/utils'
import { Injector } from '@furystack/inject'
import Semaphore from 'semaphore-async-await'

export const installAllServices = async (injector: Injector, stepFilters?: Array<InstallStep['type']>) => {
  const config = injector.getConfig()
  const { parallel } = config.options

  const lock = new Semaphore(parallel)

  const cfg = config.getConfigData()

  const checks = await injector
    .getInstance(CheckPrerequisitesService)
    .checkPrerequisiteForServices({ services: cfg.services, stepFilters })
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
  const services = cfg.services.filter(
    service =>
      service.installSteps.filter(step => (stepFilters && stepFilters.length ? stepFilters.includes(step.type) : true))
        .length > 0,
  )

  if (!services) {
    return
  }

  const servicesProgress = terminal.progressBar({
    title: 'Installing services...',
    items: services.length,
    eta: true,
    percent: true,
  })

  const promises = services.map(async (service, index) => {
    await lock.acquire()
    await sleepAsync(index * 100)
    terminal.restoreCursor()
    terminal.nextLine(1)
    servicesProgress.startItem(service.appName)
    await installService({
      injector,
      service,
      workdir: cfg.directories.output,
      inputDir: cfg.directories.input,
      stepFilters,
    })
    servicesProgress.itemDone(service.appName)
    lock.release()
  })

  await Promise.all(promises)

  for (let index = 0; index < parallel; index++) {
    await lock.acquire()
  }

  await sleepAsync(100)

  terminal.restoreCursor()
  terminal.previousLine(1)
  terminal.eraseDisplayBelow()
}
