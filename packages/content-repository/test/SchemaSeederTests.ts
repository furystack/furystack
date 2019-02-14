import { Injector } from '@furystack/inject'
import { usingAsync } from '@sensenet/client-utils'
import '../src'
import { SchemaSeeder } from '../src/Seeders/SchemaSeeder'

describe('Seeder', () => {
  it('Can be constructed with default parameters', async () => {
    await usingAsync(new Injector({ parent: undefined }), async i => {
      const s = i.getInstance(SchemaSeeder)
      expect(s).toBeInstanceOf(SchemaSeeder)
    })
  })

  it('Seed can be triggered', async () => {
    await usingAsync(new Injector({ parent: undefined }), async i => {
      const s = i.getInstance(SchemaSeeder)
      try {
        await s.seedBuiltinEntries()
      } catch (error) {
        throw error
      }
    })
  })
})
