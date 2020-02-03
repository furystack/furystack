import { terminal } from 'terminal-kit'
import { Injector } from '@furystack/inject'
import { installService } from '../install-steps/install-service'

export const selectServiceMenu = async (injector: Injector) => {
  terminal.saveCursor()

  terminal.nextLine(1).white('Select a service to install')

  const cfg = injector.getConfig().getConfigData()
  cfg.services.map(s => s.appName)

  const result = await terminal.gridMenu([...cfg.services.map(s => s.appName), 'back']).promise
  terminal.restoreCursor()
  terminal.eraseDisplayBelow()

  const serviceToInstall = cfg.services.find(s => s.appName === result.selectedText)
  if (serviceToInstall) {
    await installService({
      injector,
      service: serviceToInstall,
      workdir: cfg.directories.output,
      inputDir: cfg.directories.input,
      stepFilters: injector.getConfig().options.stepFilters,
    })
  }

  terminal.restoreCursor()
  terminal.eraseDisplayBelow()
}
