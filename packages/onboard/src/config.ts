import { join, dirname } from 'path'
import { readFileSync, realpathSync, existsSync } from 'fs'
import { Injector } from '@furystack/inject/dist/Injector'
import { validateSchema } from './validate-schema'
import { Config as ConfigModel } from './models/config'
import { Prerequisite } from './services/check-prerequisites'

export const configSchemaPath = join(dirname(realpathSync(__filename)), '../config-schema.json')

export interface ConfigOptions {
  workingDir: string
  configFileName: string
}

export const defaultConfigOptions: ConfigOptions = {
  configFileName: 'onboard-config.json',
  workingDir: process.cwd(),
}

export class Config {
  public readonly options: ConfigOptions

  private configData?: ConfigModel
  public getConfigData = () => {
    if (!this.configData) {
      throw new Error('Config not initialized yet!')
    }
    return { ...this.configData }
  }

  public prerequisites: Prerequisite[] = [
    async injector => {
      const outputDir = injector.getConfig().getConfigData().directories.output
      if (!existsSync(outputDir)) {
        return { message: `The output directory '${outputDir}' doesn't exists.`, success: false }
      }
    },
    async injector => {
      const inputDir = injector.getConfig().getConfigData().directories.input
      if (!existsSync(inputDir)) {
        return { message: `The input directory '${inputDir}' doesn't exists.`, success: false }
      }
    },
  ]

  public getConfigFilePath = () => join(this.options.workingDir, this.options.configFileName)

  public async init() {
    const configFilePath = this.getConfigFilePath()
    const configFileString = readFileSync(configFilePath)
    const configData = JSON.parse(configFileString.toString()) as ConfigModel

    const schema = JSON.parse(readFileSync(configSchemaPath).toString())
    const validate = validateSchema({ data: configData, schema })
    if (validate.errors) {
      throw Error(
        `${validate.errors.map(e => `${e.message} - ${e.dataPath} / ${JSON.stringify(e.params)}`).join('\r\n')}`,
      )
    }
    this.configData = configData
  }
  constructor(options: Partial<ConfigOptions>) {
    this.options = { ...defaultConfigOptions, ...options }
  }
}

declare module '@furystack/inject/dist/Injector' {
  interface Injector {
    useConfig: (config: Partial<ConfigOptions>) => Injector
    getConfig(): Config
  }
}

Injector.prototype.useConfig = function(cfg) {
  this.setExplicitInstance(new Config(cfg), Config)
  return this
}

Injector.prototype.getConfig = function() {
  return this.getInstance(Config)
}
