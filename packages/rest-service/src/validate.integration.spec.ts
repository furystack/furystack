import { RequestAction, RestApi } from '@furystack/rest'

export interface ValidationApi extends RestApi {
  GET: {
    '/validate-query': RequestAction<{ query: { foo: string; bar: number; baz: boolean }; result: unknown }>
    '/validate-url/:id': RequestAction<{ urlParams: { id: number }; result: unknown }>
    '/validate-headers': RequestAction<{ headers: { foo: string; bar: number; baz: boolean }; result: unknown }>
  }
  POST: {
    '/validate-body': RequestAction<{ body: { foo: string; bar: number; baz: boolean }; result: unknown }>
  }
}

describe('Validation integration tests', () => {
  it.todo('Should validate query')
  it.todo('Should validate url')
  it.todo('Should validate headers')
  it.todo('Should validate body')
})
