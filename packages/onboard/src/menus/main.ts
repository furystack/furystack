import { terminal } from 'terminal-kit'
import { Injector } from '@furystack/inject'
import { configMenu } from './config'
import { startMenu } from './start'

export const mainMenu = async (injector: Injector) => {
  terminal.saveCursor()
  const result = await terminal.singleColumnMenu(['Start install', 'Config', 'Exit']).promise

  terminal.restoreCursor()
  terminal.eraseDisplayBelow()

  switch (result.selectedText) {
    case 'Start install':
      return await startMenu(injector)
    case 'Config':
      return await configMenu(injector)
    case 'Exit':
      terminal
        .nextLine(2)
        .defaultColor('Ok, bye.')
        .nextLine(2)
      process.exit(0)
      break
    default:
      break
  }
}
