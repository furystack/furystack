import { installAllServices } from '../install-steps/install-all-services'
import { selectServiceMenu } from './select-service'
import { terminal } from 'terminal-kit'
import { Injector } from '@furystack/inject'

export const startMenu = async (injector: Injector) => {
  terminal.saveCursor()

  terminal.nextLine(1).white('Start install')

  const result = await terminal.singleColumnMenu(['All services', 'Selected service', 'back']).promise

  terminal.restoreCursor()
  terminal.eraseDisplayBelow()

  switch (result.selectedText) {
    case 'All services':
      await installAllServices(injector, injector.getConfig().options.stepFilters)
      break
    case 'Selected service':
      await selectServiceMenu(injector)
      break
    default:
      break
  }
}
