import { Injector } from '@furystack/inject'
import { usingAsync } from '@sensenet/client-utils'
import '../src'
import { ElevatedUserContext, SchemaSeeder, SystemContent } from '../src'
import { ContentSeeder } from '../src/Seeders/ContentSeeder'

describe('ContentSeeder', () => {
  it('Can be constructed with default parameters', async () => {
    await usingAsync(new Injector({ parent: undefined }), async i => {
      const s = i.getInstance(ContentSeeder)
      expect(s).toBeInstanceOf(ContentSeeder)
    })
  })

  it('Seed can be triggered', async () => {
    await usingAsync(new Injector({ parent: undefined }), async i => {
      const systemContent = i.getInstance(SystemContent)
      await usingAsync(ElevatedUserContext.create(i), async () => {
        const ss = i.getInstance(SchemaSeeder)
        await ss.seedBuiltinEntries()
        const s = i.getInstance(ContentSeeder)
        await s.seedSystemContent()
        expect(systemContent.visitorUser.username).toEqual('Visitor')
        expect(systemContent.visitorRole.name).toEqual('Visitor')
      })
    })
  })
})
