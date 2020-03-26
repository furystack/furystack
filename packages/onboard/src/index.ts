import { writeFileSync } from 'fs'
import { join } from 'path'
import './config'
import yargs from 'yargs'
import { Injector } from '@furystack/inject'
import { ConsoleLogger, VerboseConsoleLogger } from '@furystack/logging'
import got from 'got'
import { mainMenu } from './menus/main'
import { InMemoryLogging } from './in-memory-logging'
import { CheckPrerequisitesService, genericPrerequisites } from './services/check-prerequisites'
import { defaultConfig } from './default-config'
import { installAllServices } from './install-steps/install-all-services'
import { InstallStep } from './models/install-step'
const injector = new Injector().useLogging(InMemoryLogging)

export interface ArgType {
  'download-config': string
  config: string
  parallel: number
  stepFilters?: Array<InstallStep['type']>
  services?: string[]
  verbose?: boolean
}

const initConfig = async (args: ArgType) => {
  args.verbose ? injector.useLogging(VerboseConsoleLogger) : injector.useLogging(ConsoleLogger)
  const logger = injector.logger.withScope('InitConfig')
  if (args['download-config']) {
    logger.information({
      message: 'Downloading remote config...',
      data: { download: args.config, config: args.config },
    })
    const result = await got(args['download-config'])
    writeFileSync(args.config, result.body)
  }
  injector.useConfig({
    configSource: args.config as string,
    workingDir: process.cwd(),
    stepFilters: args.stepFilters,
    services: args.services,
    parallel: args.parallel,
  })

  await injector.getConfig().init()

  const prereqChecks = await injector
    .getInstance(CheckPrerequisitesService)
    .check(...injector.getConfig().prerequisites, ...genericPrerequisites)

  if (prereqChecks.length) {
    logger.error({ message: `The prerequisites has not been met`, data: prereqChecks })
    throw Error(`The prerequisites has not been met`)
  }
}

const cmd = yargs
  .scriptName('onboard')
  .showHelpOnFail(false, 'Specify --help for available options')
  .command(
    'init',
    'initializes the onboard service with a default config file',
    () => {
      /** */
    },
    (args) => {
      try {
        const cfg = JSON.stringify(defaultConfig, undefined, 2)
        writeFileSync(join(process.cwd(), args.config as string), cfg)
      } catch (error) {
        injector.getInstance(InMemoryLogging).flushToFile()
      }
    },
  )
  .command(
    'start',
    'start the selected installations (all services without the --service option)',
    () => {
      /** */
    },
    async (args) => {
      try {
        await initConfig(args as any)
        await installAllServices(injector, injector.getConfig().options.stepFilters)
      } catch (error) {
        injector.getInstance(InMemoryLogging).flushToFile()
      }
      process.exit(0)
    },
  )
  .command(
    '*',
    'starts the ui',
    () => {
      /** */
    },
    async (args) => {
      let run = true
      while (run) {
        try {
          await initConfig(args as any)
          await mainMenu(injector)
        } catch (error) {
          run = false
          injector.logger.error({
            scope: '@furystack/onboard',
            message: `Operation failed: ${error.toString()}`,
            data: { error },
          })
          injector.getInstance(InMemoryLogging).flushToFile()
          process.exit(1)
        }
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
  .option('services', {
    type: 'array',
    description: 'a list of services to install',
  })
  .option('stepFilters', {
    type: 'array',
    desciption:
      'a list of types of steps to execute (e.g. if you only want to exec GIT pull(s) and PM2 ADD(s) on each repo',
  })

export default cmd.argv
