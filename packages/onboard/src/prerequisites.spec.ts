import { usingAsync } from '@furystack/utils'
import { Injector } from '@furystack/inject'
import { CheckPrerequisitesService } from './services/check-prerequisites'

describe('Onboad Prerequisites', () => {
  it('Should check an array of prerequisites', async () => {
    await usingAsync(new Injector(), async i => {
      const service = i.getInstance(CheckPrerequisitesService)
      expect(service).toBeInstanceOf(CheckPrerequisitesService)
    })
  })

  it.todo('Should check prerequisite results')

  it.todo('Should exclude prerequisites from step filters')

  it.todo('Should check an array of prerequisites for an array of services')

  it.todo('Should check an array of prerequisites for a Service')
})
