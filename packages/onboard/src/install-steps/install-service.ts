import { join } from 'path'
import { sleepAsync } from '@furystack/utils'
import { Injector } from '@furystack/inject'
import { ServiceModel } from '../models/service'
import { CheckPrerequisitesService } from '../services/check-prerequisites'
import { InstallStep } from '../models/install-step'
import { execInstallStep } from './exec-install-step'
import { getStepDisplayNames } from './get-step-display-names'

const getServiceDir = (service: ServiceModel, workDir: string) => {
  return join(workDir, service.appName)
}

export const installService = async (options: {
  injector: Injector
  service: ServiceModel
  workdir: string
  inputDir: string
  stepFilters?: Array<InstallStep['type']>
}) => {
  const logger = options.injector.logger.withScope(`installService/${options.service.appName}`)

  const checks = await options.injector
    .getInstance(CheckPrerequisitesService)
    .checkPrerequisiteForSteps({ steps: options.service.installSteps, stepFilters: options.stepFilters })

  if (checks.length) {
    logger.error({
      message: `Some prerequisites has not been met`,
      data: { ...options, checks },
    })
  }
  const steps = options.service.installSteps.filter(step =>
    options.stepFilters && options.stepFilters.length ? options.stepFilters.includes(step.type) : true,
  )

  if (steps && steps.length) {
    logger.information({
      message: `Installing service ${options.service.appName}...`,
      data: { steps },
    })

    const installServiceInjector = options.injector.createChild({ owner: options.service })

    for (const step of steps) {
      const stepName = getStepDisplayNames(step)
      logger.information({
        message: `Executing step in service '${options.service.appName}': ${stepName}`,
        data: {
          step,
          service: options.service,
        },
      })
      try {
        await execInstallStep(installServiceInjector, step, {
          rootDir: options.workdir,
          serviceDir: getServiceDir(options.service, options.workdir),
          service: options.service,
          inputDir: options.inputDir,
        })
      } catch (error) {
        logger.error({
          scope: `installService/${step.type}`,
          message: 'There was an error installing the service',
          data: { service: options.service, step, error, errorString: error.toString() },
        })
        throw error
      }
    }
    await installServiceInjector.dispose()
  } else {
    await sleepAsync(1000)
  }
}
