import { existsSync, writeFileSync, unlinkSync } from 'fs'
import { spawnSync } from 'child_process'
import { defaultConfig } from '../default-config'
import { terminal } from 'terminal-kit'
import { Injector } from '@furystack/inject'

const getCommandLine = () => {
  switch (process.platform) {
    case 'darwin':
      return 'open'
    case 'win32':
      return 'start'
    default:
      return 'xdg-open'
  }
}

export const openCfgFile = (cfgFile: string) => {
  try {
    return spawnSync(getCommandLine(), [cfgFile], { stdio: 'ignore' })
  } catch (error) {
    terminal.red(error.toString())
  }
}

export const configMenu = async (injector: Injector) => {
  const cfgFile = injector.getConfig().getConfigFilePath()
  const hasConfig = existsSync(cfgFile)
  terminal.saveCursor()

  try {
    await injector.getConfig().init()
  } catch (error) {
    terminal
      .nextLine(1)
      .red('There was an error reading / parsing the current Config file')
      .nextLine(2)
      .red(error.toString())
      .nextLine(1)
  }

  const result = await terminal.singleColumnMenu([
    hasConfig ? 'Edit Config file' : 'Create and edit custom config',
    ...(hasConfig ? ['Reset to defaults', 'Remove custom config'] : []),
    'Back',
  ]).promise

  switch (result.selectedText) {
    case 'Create and edit custom config':
      writeFileSync(cfgFile, JSON.stringify(defaultConfig, undefined, 2))
      openCfgFile(cfgFile)
      break
    case 'Remove custom config':
      unlinkSync(cfgFile)
      terminal.nextLine(2).defaultColor('Config file removed.')
      break
    case 'Reset to defaults':
      writeFileSync(cfgFile, JSON.stringify(defaultConfig, undefined, 2))
      break
    case 'Edit Config file':
      openCfgFile(cfgFile)
      break
    default:
      break
  }

  terminal.restoreCursor()
  terminal.eraseDisplayBelow()
}
