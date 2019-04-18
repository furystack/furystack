import { Injector } from '@furystack/inject'
import { ConsoleLogger } from '@furystack/logging'
import { usingAsync } from '@sensenet/client-utils'
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'fs'
import { JSDOM } from 'jsdom'
import { join } from 'path'
import { EntityTypeWriter } from './entity-type-writer'
import { MetadataParser } from './metadata-parser'
import { Configuration } from './models/configuration'
import { OdataContextWriter } from './odata-context-writer'
import { EntityCollectionWriter } from './entity-collection-writer'
;(async () => {
  await usingAsync(new Injector(), async injector => {
    injector.useLogging(ConsoleLogger)
    const logger = injector.logger.withScope('@furystack/odata-fetchr/')
    const logVerbose = (message: string) => logger.verbose({ message })

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

      const localCfg = Object.assign(new Configuration(), userConfig) // { ...new Configuration(), ...userConfig }

      injector.setExplicitInstance(localCfg, Configuration)

      logVerbose('Getting metadata...')
      const xmlString = await localCfg.getMetadataXml()
      logVerbose('Parsing metadata...')
      const endpoint = injector
        .getInstance(MetadataParser)
        .parseMetadataXml(new JSDOM(xmlString).window.document, localCfg.path)
      logVerbose('Parsing finished.')

      logVerbose('Creating required directories...')
      ensureDirectoryExists(join(process.cwd(), localCfg.outputPath))
      ensureDirectoryExists(join(process.cwd(), localCfg.outputPath, localCfg.entityTypePath))
      ensureDirectoryExists(join(process.cwd(), localCfg.outputPath, localCfg.entityCollectionServicesPath))

      if (localCfg.writeDump) {
        const dumpPath = join(process.cwd(), localCfg.outputPath, 'dump.json')
        logVerbose(`Writing dump to ${dumpPath}`)
        writeFileSync(dumpPath, JSON.stringify(endpoint))
      }

      injector.getInstance(OdataContextWriter).writeContext(endpoint)

      injector.getInstance(EntityTypeWriter).writeEntityTypes(endpoint.entityTypes)
      injector.getInstance(EntityCollectionWriter).writeEntityCollections(endpoint.entitySets)
    } else {
      logVerbose('Local config not found. Falling back to CLI mode')
    }
  })
})()
