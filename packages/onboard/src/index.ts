import { writeFileSync } from 'fs'
import { join } from 'path'
import { terminal } from 'terminal-kit'
import { Injector } from '@furystack/inject'
import '@furystack/logging'
import './config'
import yargs from 'yargs'
import { mainMenu } from './menus/main'
import { InMemoryLogging } from './in-memory-logging'
import { CheckPrerequisitesService, genericPrerequisites } from './services/check-prerequisites'
import { defaultConfig } from './default-config'
import { ConfigDownloaderService } from './services/config-downloader'
import { installAllServices } from './install-steps/install-all-services'
import { InstallStep } from './models/install-step'

const injector = new Injector().useLogging(InMemoryLogging)

export interface ArgType {
  'download-config': string
  config: string
  parallel: number
  stepFilters?: string
}

const initConfig = async (args: ArgType, userInput: boolean) => {
  if (args['download-config']) {
    terminal
      .nextLine(1)
      .white('Downloading remote config...')
      .nextLine(1)
    await injector
      .getInstance(ConfigDownloaderService)
      .download(args['download-config'] as string, args.config as string)
  }
  injector.useConfig({
    configSource: args.config as string,
    workingDir: process.cwd(),
    userInput,
    stepFilters: (args.stepFilters || '').split(',').filter(f => f && f.length) as Array<InstallStep['type']>,
    parallel: args.parallel,
  })

  await injector.getConfig().init()

  const prereqChecks = await injector
    .getInstance(CheckPrerequisitesService)
    .check(...injector.getConfig().prerequisites, ...genericPrerequisites)

  if (prereqChecks.length) {
    terminal
      .nextLine(1)
      .red('The following prerequisites has not been met:')
      .nextLine(2)
    prereqChecks.map(msg => terminal.red(msg).nextLine(1))
    process.exit(1)
  }
}

terminal.setNice(5)
terminal
  .windowTitle('OnBoard ')
  .clear()
  .defaultColor('----====')
  .white(' | OnBoard | ')
  .defaultColor('====----')
  .nextLine(1)

const cmd = yargs
  .scriptName('onboard')
  .command(
    'init',
    'initializes the onboard service with a default config file',
    () => {
      /** */
    },
    args => {
      const cfg = JSON.stringify(defaultConfig, undefined, 2)
      writeFileSync(join(process.cwd(), args.config as string), cfg)
    },
  )
  .command(
    'start-all',
    'start all services with the config from the given URL',
    () => {
      /** */
    },
    async args => {
      await initConfig(args as any, false)
      await installAllServices(injector, injector.getConfig().options.stepFilters)
      process.exit(0)
    },
  )
  .command(
    '*',
    'starts the ui',
    () => {
      /** */
    },
    async args => {
      await initConfig(args as any, true)
      const run = true
      while (run) {
        await mainMenu(injector)
      }
    },
  )
  .option('verbose', {
    alias: 'v',
    type: 'boolean',
    description: 'Run with verbose logging',
  })
  .option('config', {
    alias: 'cfg',
    type: 'string',
    description: 'The config file path (relative to CWD)',
    default: './onboard-config.json',
  })
  .option('download-config', {
    alias: 'dlc',
    type: 'string',
    description: 'downloads a config file from a specified URL',
  })
  .option('parallel', {
    type: 'number',
    description: 'how many installs can run parallelly',
    default: 1,
  })
  .option('stepFilters', {
    type: 'string',
    desciption:
      'a list of types of steps to execute (e.g. if you only want to exec GIT pull(s) and PM2 ADD(s) on each repo',
  })

export default cmd.argv
