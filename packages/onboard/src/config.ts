import { join, dirname } from 'path'
import { readFileSync, realpathSync, existsSync } from 'fs'
import { Injector } from '@furystack/inject/dist/injector'
import { validateSchema } from './validate-schema'
import { Config as ConfigModel } from './models/config'
import { Prerequisite } from './services/check-prerequisites'
import { createJsonSchema } from './create-json-schema'
import { InstallStep } from './models/install-step'

export const configSchemaPath = join(dirname(realpathSync(__filename)), '../config-schema.json')

export interface ConfigOptions {
  workingDir: string
  configSource: string
  parallel: number
  stepFilters?: Array<InstallStep['type']>
  services?: string[]
}

export class Config {
  private configData?: ConfigModel
  public getConfigData = () => {
    if (!this.configData) {
      throw new Error('Config not initialized yet!')
    }
    return { ...this.configData }
  }

  public prerequisites: Prerequisite[] = [
    async (injector) => {
      const outputDir = injector.getConfig().getConfigData().directories.output
      if (!existsSync(outputDir)) {
        return { message: `The output directory '${outputDir}' doesn't exists.`, success: false }
      }
    },
    async (injector) => {
      const inputDir = injector.getConfig().getConfigData().directories.input
      if (!existsSync(inputDir)) {
        return { message: `The input directory '${inputDir}' doesn't exists.`, success: false }
      }
    },
  ]

  public getConfigFilePath = () => join(this.options.workingDir, this.options.configSource)

  public async init() {
    if (!existsSync(configSchemaPath)) {
      await createJsonSchema({
        inputTsFile: join(realpathSync(dirname(__filename)), '..', './src/models/config.ts'),
        outputJsonFile: configSchemaPath,
        rootType: 'Config',
        schemaName: 'Config',
      })
    }
    const configFilePath = this.getConfigFilePath()
    const configFileString = readFileSync(configFilePath)
    const configData = JSON.parse(configFileString.toString()) as ConfigModel

    const schema = JSON.parse(readFileSync(configSchemaPath).toString())
    const validate = validateSchema({ data: configData, schema })
    if (validate.errors) {
      throw Error(
        `${validate.errors.map((e) => `${e.message} - ${e.dataPath} / ${JSON.stringify(e.params)}`).join('\r\n')}`,
      )
    }
    this.configData = configData
  }
  constructor(public readonly options: ConfigOptions) {}
}

declare module '@furystack/inject/dist/injector' {
  export interface Injector {
    useConfig: (config: ConfigOptions) => Injector
    getConfig(): Config
  }
}

Injector.prototype.useConfig = function (cfg) {
  this.setExplicitInstance(new Config(cfg), Config)
  return this
}

Injector.prototype.getConfig = function () {
  return this.getInstance(Config)
}
