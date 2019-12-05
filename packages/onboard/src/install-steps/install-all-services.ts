import { terminal } from 'terminal-kit'
import { sleepAsync } from '@furystack/utils'
import { Injector } from '@furystack/inject'
import { CheckPrerequisitesService } from '../services/check-prerequisites'
import { installService } from './install-service'

export const installAllServices = async (injector: Injector) => {
  const cfg = injector.getConfig().getConfigData()

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

  terminal.nextLine(1)

  for (const service of cfg.services) {
    servicesProgress.startItem(service.appName)
    await installService(injector, service, cfg.directories.output, cfg.directories.input)
    servicesProgress.itemDone(service.appName)
  }

  await sleepAsync(100)

  terminal.restoreCursor()
  terminal.previousLine(1)
  terminal.eraseDisplayBelow()
}
