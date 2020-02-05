import { existsSync, unlinkSync, realpathSync } from 'fs'
import { join } from 'path'
import { using, usingAsync } from '@furystack/utils'
import { Injector } from '@furystack/inject'
import { Config } from '../src/config'
import { defaultConfig } from '../src/default-config'

describe('Onboard Config', () => {
  it('Default config should match the snapshot', () => {
    expect(defaultConfig).toMatchSnapshot()
  })

  it('Should extend the Injector with useConfig()', () => {
    using(new Injector(), i => {
      i.useConfig({
        configSource: '',
        parallel: 1,
        workingDir: process.cwd(),
      })
      expect(i.getConfig()).toBeInstanceOf(Config)
    })
  })

  it('Should throw if try to get config data before initialization', () => {
    usingAsync(new Injector(), async i => {
      const cfg = i
        .useConfig({ parallel: 1, configSource: 'onboard-config.json', workingDir: process.cwd() })
        .getConfig()

      expect(() => cfg.getConfigData()).toThrowError()
    })
  })

  it('Should be initialized with a default value', async () => {
    await usingAsync(new Injector(), async i => {
      await i
        .useConfig({
          parallel: 1,
          configSource: 'onboard-config.json',
          workingDir: join(__dirname, '..'),
        })
        .getConfig()
        .init()
      expect(i.getConfig().getConfigData()).toMatchSnapshot()
    })
  })

  it('Should re-create the JSON Schema file during init if not exists', async () => {
    const schemaPath = join(__dirname, '..', 'config-schema.json')
    if (existsSync(schemaPath)) {
      unlinkSync(schemaPath)
    }
    await usingAsync(new Injector(), async i => {
      await i
        .useConfig({
          parallel: 1,
          configSource: 'onboard-config.json',
          workingDir: join(realpathSync(__dirname), '..'),
        })
        .getConfig()
        .init()
      expect(existsSync(schemaPath))
    })
  })
})
