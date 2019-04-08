import { Injector } from '@furystack/inject'
import { ConsoleLogger } from '@furystack/logging'
import { usingAsync } from '@sensenet/client-utils'
import { existsSync } from 'fs'
import { join } from 'path'
import { Configuration } from './models/configuration'

const logScope = '@furystack/odata-fetchr'
;(async () => {
  await usingAsync(new Injector(), async injector => {
    injector.useLogging(ConsoleLogger)

    const logVerbose = (message: string) => injector.logger.verbose({ scope: logScope, message })
    logVerbose(`dirname: ${__dirname}`)
    logVerbose(`cwd: ${process.cwd()}`)

    const hasLocalConfig = existsSync(join(process.cwd(), 'odata-fetchr.config.js'))
    if (hasLocalConfig) {
      logVerbose('Local config has been found. Starting to evaluate config.')
      const localCfg: Configuration = (await import(join(process.cwd(), 'odata-fetchr.config.js'))).default
      console.log(localCfg)
    } else {
      logVerbose('Local config not found. Falling back to CLI mode')
    }
  })
})()
