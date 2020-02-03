import { CheckPrerequisitesService } from '../services/check-prerequisites'
import { InstallStep } from '../models/install-step'
import { installService } from './install-service'
import { sleepAsync } from '@furystack/utils'
import { Injector } from '@furystack/inject'
import Semaphore from 'semaphore-async-await'

export const installAllServices = async (injector: Injector, stepFilters?: Array<InstallStep['type']>) => {
  const config = injector.getConfig()
  const logger = injector.logger.withScope('installAllServices')
  const { parallel } = config.options

  const lock = new Semaphore(parallel)

  const cfg = config.getConfigData()

  const checks = await injector
    .getInstance(CheckPrerequisitesService)
    .checkPrerequisiteForServices({ services: cfg.services, stepFilters })
  if (checks.length) {
    logger.error({ message: `Some prerequisites has not been met`, data: { checks, ...cfg } })
    return
  }
  const services = cfg.services.filter(
    service =>
      service.installSteps.filter(step => (stepFilters && stepFilters.length ? stepFilters.includes(step.type) : true))
        .length > 0,
  )

  if (!services) {
    return
  }

  const promises = services.map(async (service, index) => {
    await lock.acquire()
    await sleepAsync(index * 100)
    await installService({
      injector,
      service,
      workdir: cfg.directories.output,
      inputDir: cfg.directories.input,
      stepFilters,
    })
    logger.information({
      message: `Finished service installation: ${service.appName}`,
      data: { service, stepFilters },
    })
    lock.release()
  })

  await Promise.all(promises)

  for (let index = 0; index < parallel; index++) {
    await lock.acquire()
  }

  await sleepAsync(100)
}
