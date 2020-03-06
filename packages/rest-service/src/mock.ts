import { Injector } from '@furystack/inject'
import { RestApi, RequestAction, JsonResult } from '@furystack/rest'
import { implementApi } from './implement-api'

interface MyApi extends RestApi {
  GET: {
    '/alma': RequestAction<{ foo: number }>
  }
}

console.log('Starting Mock...')

const injector = new Injector()

implementApi<MyApi>({
  port: 9999,
  injector,
  api: {
    GET: {
      '/alma': async () => JsonResult({ foo: 3 }, 200, {}),
    },
  },
})
