import { join } from 'path'
import { terminal } from 'terminal-kit'
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
  const checks = await options.injector
    .getInstance(CheckPrerequisitesService)
    .checkPrerequisiteForSteps({ steps: options.service.installSteps, stepFilters: options.stepFilters })

  if (checks.length) {
    terminal
      .nextLine(2)
      .red('The following prerequisites has not been met:')
      .nextLine(1)
    for (const req of checks) {
      terminal.red(req).nextLine(1)
    }
    await terminal.singleColumnMenu(['Ok, go back :(']).promise
    terminal.restoreCursor()
    terminal.eraseDisplayBelow()
    return
  }
  const steps = options.service.installSteps.filter(step =>
    options.stepFilters && options.stepFilters.length ? options.stepFilters.includes(step.type) : true,
  )

  const progress = terminal.progressBar({
    title: `Installing ${options.service.appName}...`,
    items: steps.length,
    percent: true,
    eta: true,
  })

  const installServiceInjector = options.injector.createChild({ owner: options.service })

  for (const step of steps) {
    const stepName = getStepDisplayNames(step)
    progress.startItem(stepName)
    try {
      await execInstallStep(installServiceInjector, step, {
        rootDir: options.workdir,
        serviceDir: getServiceDir(options.service, options.workdir),
        service: options.service,
        inputDir: options.inputDir,
      })
    } catch (error) {
      terminal
        .nextLine(1)
        .red(error.toString())
        .nextLine(2)
      process.exit(1)
    }
    progress.itemDone(stepName)
  }
  await installServiceInjector.dispose()
}
