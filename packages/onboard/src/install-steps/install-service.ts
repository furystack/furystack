import { join } from 'path'
import { terminal } from 'terminal-kit'
import { Injector } from '@furystack/inject'
import { ServiceModel } from '../models/service'
import { CheckPrerequisitesService } from '../services/check-prerequisites'
import { execInstallStep } from './exec-install-step'
import { getStepDisplayNames } from './get-step-display-names'

const getServiceDir = (service: ServiceModel, workDir: string) => {
  return join(workDir, service.appName)
}

export const installService = async (injector: Injector, service: ServiceModel, workdir: string, inputDir: string) => {
  const checks = await injector.getInstance(CheckPrerequisitesService).checkPrerequisiteForServices(service)
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

  const progress = terminal.progressBar({
    title: `Installing ${service.appName}...`,
    items: service.installSteps.length,
    percent: true,
    eta: true,
  })

  const installServiceInjector = injector.createChild({ owner: service })

  for (const step of service.installSteps) {
    const stepName = getStepDisplayNames(step)
    progress.startItem(stepName)
    try {
      await execInstallStep(installServiceInjector, step, {
        rootDir: workdir,
        serviceDir: getServiceDir(service, workdir),
        service,
        inputDir,
      })
    } catch (error) {
      terminal
        .nextLine(1)
        .red(error.toString())
        .nextLine(2)
      process.exit(1)
    }
    progress.itemDone(stepName)

    await installServiceInjector.dispose()
  }
}
