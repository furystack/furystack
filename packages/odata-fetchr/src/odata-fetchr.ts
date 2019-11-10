import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'fs'
import { join } from 'path'
import { Injector } from '@furystack/inject'
import { ConsoleLogger } from '@furystack/logging'
import { usingAsync } from '@furystack/utils'
import { JSDOM } from 'jsdom'
import { terminal } from 'terminal-kit'
import { EntityCollectionWriter } from './entity-collection-writer'
import { EntityTypeWriter } from './entity-type-writer'
import { MetadataParser } from './metadata-parser'
import { Configuration } from './models/configuration'
import { OdataContextWriter } from './odata-context-writer'
;(async () => {
  await usingAsync(new Injector(), async injector => {
    const progressBar = terminal.progressBar({
      title: 'Overall progress',
      percent: true,
      eta: true,
      items: 7,
    })

    injector.useLogging(ConsoleLogger)
    const logger = injector.logger.withScope('@furystack/odata-fetchr/')
    const logVerbose = (message: string) => logger.verbose({ message })

    progressBar.itemDone('initializing')

    const ensureDirectoryExists = (dir: string) => {
      if (!existsSync(dir)) {
        logVerbose(`Directory '${dir}' not exists, creating...`)
        mkdirSync(dir)
      }
      return dir
    }

    progressBar.itemDone('checking directories')

    logVerbose(`Script path: ${__dirname}`)
    logVerbose(`Current working directory: ${process.cwd()}`)

    const packageJson = JSON.parse(readFileSync(join(__dirname, '..', 'package.json')).toString())
    logVerbose(`Version: ${packageJson.name}@${packageJson.version}`)

    progressBar.itemDone('parsing package.json')

    const localConfigPath = join(process.cwd(), 'odata-fetchr.config.js')
    const hasLocalConfig = existsSync(localConfigPath)

    progressBar.itemDone('reading config')
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

      progressBar.itemDone('parsing metadata')

      logVerbose('Creating required directories...')
      ensureDirectoryExists(join(process.cwd(), localCfg.outputPath))
      ensureDirectoryExists(join(process.cwd(), localCfg.outputPath, localCfg.entityTypePath))
      ensureDirectoryExists(join(process.cwd(), localCfg.outputPath, localCfg.entityCollectionServicesPath))

      progressBar.itemDone('creating required directories')

      if (localCfg.writeDump) {
        const dumpPath = join(process.cwd(), localCfg.outputPath, 'dump.json')
        logVerbose(`Writing dump to ${dumpPath}`)
        writeFileSync(dumpPath, JSON.stringify(endpoint))
      }

      progressBar.itemDone('writing dump')

      injector.getInstance(OdataContextWriter).writeContext(endpoint)

      injector.getInstance(EntityTypeWriter).writeEntityTypes(endpoint.entityTypes)
      injector.getInstance(EntityCollectionWriter).writeEntityCollections(endpoint)
    } else {
      logVerbose('Local config not found. Falling back to CLI mode')
    }
  })
})()
