import { RuleTester } from '@typescript-eslint/rule-tester'
import { afterAll, describe, it } from 'vitest'
import { noDirectStoreToken } from './no-direct-store-token.js'

RuleTester.afterAll = afterAll
RuleTester.it = it
RuleTester.describe = describe

const tester = new RuleTester({
  languageOptions: {
    parserOptions: {
      projectService: { allowDefaultProject: ['*.ts', '*.tsx'] },
      ecmaFeatures: { jsx: true },
    },
  },
})

const HEADER = [
  'declare class Injector { get<T>(token: any): T; getAsync<T>(token: any): Promise<T> }',
  'declare class Store {}',
  'declare class Model {}',
  'declare const injector: Injector',
  // StoreToken-shaped (Token with extra `model` + `primaryKey` metadata)
  'declare const UserStore: { id: symbol; name: string; lifetime: "singleton"; isAsync: false; factory: () => Store; readonly model: typeof Model; readonly primaryKey: "id" }',
  // Plain service token (no model / primaryKey)
  'declare const Logger: { id: symbol; name: string; lifetime: "singleton"; isAsync: false; factory: () => { log: (m: string) => void } }',
  // DataSetToken-shaped (no model brand on the token itself)
  'declare const UserDataSet: { id: symbol; name: string; lifetime: "singleton"; isAsync: false; factory: () => { add: (e: unknown) => void } }',
].join('\n')

tester.run('no-direct-store-token', noDirectStoreToken, {
  valid: [
    {
      name: 'resolving a plain service token is allowed',
      filename: 'my-service.ts',
      code: [HEADER, 'const logger = injector.get(Logger)'].join('\n'),
    },
    {
      name: 'resolving a DataSetToken (no store metadata) is allowed',
      filename: 'my-service.ts',
      code: [HEADER, 'const users = injector.get(UserDataSet)'].join('\n'),
    },
    {
      name: 'resolving a StoreToken inside a spec file is allowed',
      filename: 'my-service.spec.ts',
      code: [HEADER, 'const store = injector.get(UserStore)'].join('\n'),
    },
  ],
  invalid: [
    {
      name: 'resolving a StoreToken in application code is reported',
      filename: 'my-service.ts',
      code: [HEADER, 'const store = injector.get(UserStore)'].join('\n'),
      errors: [{ messageId: 'noStoreTokenResolve' }],
    },
    {
      name: 'async resolution is also reported',
      filename: 'my-service.ts',
      code: [HEADER, 'async function run() { const store = await injector.getAsync(UserStore) }'].join('\n'),
      errors: [{ messageId: 'noStoreTokenResolve' }],
    },
  ],
})
