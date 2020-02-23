import './services/exec-async'
import { usingAsync } from '@furystack/utils'
import { Injector } from '@furystack/inject'
describe('Onboard Exec Async', () => {
  it('Should execute a command', async () => {
    await usingAsync(new Injector(), async i => {
      const result = await i.execAsync('echo alma', {})
      expect(result).toContain('alma')
    })
  })

  it('Should execute commands in parallel', async () => {
    await usingAsync(new Injector(), async i => {
      const arr = [1, 2, 3, 4, 5]
      await Promise.all(
        arr.map(async v => {
          const result = await i.execAsync(`echo alma${v}`, {})
          expect(result).toContain(`alma${v}`)
        }),
      )
    })
  })

  it('Should reject if a command fails', async () => {
    await usingAsync(new Injector(), async i => {
      await expect(i.execAsync('alma', {})).rejects.toThrow()
    })
  })
})
