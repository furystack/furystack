import type {
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

export type PostMockEndpoint = PostEndpoint<Mock, 'id', Mock>
export type PatchMockEndpoint = PatchEndpoint<Mock, 'id', Mock>
export type DeleteMockEndpoint = DeleteEndpoint<Mock, 'id'>
export type GetMockCollectionEndpoint = GetCollectionEndpoint<Mock>
export type GetMockEntityEndpoint = GetEntityEndpoint<Mock, 'id'>

export interface ValidationApi extends RestApi {
  GET: {
    '/validate-query': ValidateQuery
    '/validate-url/:id': ValidateUrl
    '/validate-headers': ValidateHeaders
    '/mock': GetMockCollectionEndpoint
    '/mock/:id': GetMockEntityEndpoint
  }
  POST: {
    '/validate-body': ValidateBody
    '/mock': PostMockEndpoint
  }
  PATCH: {
    '/mock/:id': PatchMockEndpoint
  }
  DELETE: {
    '/mock/:id': DeleteMockEndpoint
  }
}
