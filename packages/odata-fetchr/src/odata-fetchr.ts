import { Injector } from '@furystack/inject'
import { ConsoleLogger } from '@furystack/logging'
import { usingAsync } from '@sensenet/client-utils'
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'fs'
import { JSDOM } from 'jsdom'
import { join } from 'path'
import { EntityTypeWriter } from './entity-type-writer'
import { MetadataParser } from './metadata-parser'
import { Configuration } from './models/configuration'

const logScope = '@furystack/odata-fetchr'
;(async () => {
  await usingAsync(new Injector(), async injector => {
    injector.useLogging(ConsoleLogger)
    const logVerbose = (message: string) => injector.logger.verbose({ scope: logScope, message })

    const ensureDirectoryExists = (dir: string) => {
      if (!existsSync(dir)) {
        logVerbose(`Directory '${dir}' not exists, creating...`)
        mkdirSync(dir)
      }
      return dir
    }

    logVerbose(`Script path: ${__dirname}`)
    logVerbose(`Current working directory: ${process.cwd()}`)

    const packageJson = JSON.parse(readFileSync(join(__dirname, '..', 'package.json')).toString())
    logVerbose(`Version: ${packageJson.name}@${packageJson.version}`)

    const localConfigPath = join(process.cwd(), 'odata-fetchr.config.js')
    const hasLocalConfig = existsSync(localConfigPath)
    if (hasLocalConfig) {
      logVerbose(`Config file has been found at '${localConfigPath}'. Starting to evaluate config.`)
      const userConfig: Configuration = (await import(join(process.cwd(), 'odata-fetchr.config.js'))).default

      const localCfg = { ...new Configuration(), ...userConfig }

      injector.setExplicitInstance(localCfg)

      logVerbose('Getting metadata...')
      const xmlString = await localCfg.getMetadataXml()
      logVerbose('Parsing metadata...')
      const endpoint = injector.getInstance(MetadataParser).parseMetadataXml(new JSDOM(xmlString).window.document)
      logVerbose('Parsing finished.')

      logVerbose('Creating required directories...')
      ensureDirectoryExists(join(process.cwd(), localCfg.outputPath))
      ensureDirectoryExists(join(process.cwd(), localCfg.outputPath, localCfg.entityTypePath))

      if (localCfg.writeDump) {
        const dumpPath = join(process.cwd(), localCfg.outputPath, 'dump.json')
        logVerbose(`Writing dump to ${dumpPath}`)
        writeFileSync(dumpPath, JSON.stringify(endpoint))
      }

      injector.getInstance(EntityTypeWriter).writeEntityTypes(endpoint.entityTypes)
    } else {
      logVerbose('Local config not found. Falling back to CLI mode')
    }
  })
})()
