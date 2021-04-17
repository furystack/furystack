import {
  DeleteEndpoint,
  GetCollectionEndpoint,
  GetEntityEndpoint,
  PatchEndpoint,
  PostEndpoint,
  RestApi,
} from '@furystack/rest'

export interface Mock {
  id: string
  value: string
}

export interface ValidateQuery {
  query: { foo: string; bar: number; baz: boolean }
  result: { foo: string; bar: number; baz: boolean }
}
export interface ValidateUrl {
  url: { id: number }
  result: { id: number }
}
export interface ValidateHeaders {
  headers: { foo: string; bar: number; baz: boolean }
  result: { foo: string; bar: number; baz: boolean }
}
export interface ValidateBody {
  body: { foo: string; bar: number; baz: boolean }
  result: { foo: string; bar: number; baz: boolean }
}

export interface ValidationApi extends RestApi {
  GET: {
    '/validate-query': ValidateQuery
    '/validate-url/:id': ValidateUrl
    '/validate-headers': ValidateHeaders
    '/mock': GetCollectionEndpoint<Mock>
    '/mock/:id': GetEntityEndpoint<Mock, 'id'>
  }
  POST: {
    '/validate-body': ValidateBody
    '/mock': PostEndpoint<Mock, 'id'>
  }
  PATCH: {
    '/mock/:id': PatchEndpoint<Mock, 'id'>
  }
  DELETE: {
    '/mock/:id': DeleteEndpoint<Mock, 'id'>
  }
}
