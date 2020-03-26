import { terminal } from 'terminal-kit'
import { Injector } from '@furystack/inject'
import { installService } from '../install-steps/install-service'

export const selectServiceMenu = async (injector: Injector) => {
  terminal.saveCursor()

  terminal.nextLine(1).white('Select a service to install')

  const cfg = injector.getConfig()
  const cfgData = cfg.getConfigData()
  const filteredServices = cfgData.services
    .filter((s) => !cfg.options.services || cfg.options.services.includes(s.appName))
    .map((s) => s.appName)

  const result = await terminal.gridMenu([...filteredServices, 'back']).promise
  terminal.restoreCursor()
  terminal.eraseDisplayBelow()

  const serviceToInstall = cfgData.services.find((s) => s.appName === result.selectedText)
  if (serviceToInstall) {
    await installService({
      injector,
      service: serviceToInstall,
      workdir: cfgData.directories.output,
      inputDir: cfgData.directories.input,
      stepFilters: injector.getConfig().options.stepFilters,
    })
  }

  terminal.restoreCursor()
  terminal.eraseDisplayBelow()
}
