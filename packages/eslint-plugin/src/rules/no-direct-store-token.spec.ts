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

/**
 * The fixtures below mirror the production type shape exactly:
 *
 * - `Token<T>` carries the phantom `__type?: T` property used by the rule's
 *   resolved-value discriminator.
 * - `StoreToken<T, PK>` resolves to `PhysicalStore<T, PK>` and adds `model`
 *   + `primaryKey` brand fields.
 * - `DataSetToken<T, PK>` resolves to `DataSet<T, PK>` and **also** carries
 *   `model` + `primaryKey` (mirrored from the backing store) — this is the
 *   exact false-positive shape the original rule failed to handle.
 */
const HEADER = [
  'declare class Injector { get<T>(token: any): T; getAsync<T>(token: any): Promise<T> }',
  'declare class Model {}',
  'declare class PhysicalStore<T, PK extends keyof T> { add(...entries: T[]): Promise<void>; readonly model: any; readonly primaryKey: PK }',
  'declare class DataSet<T, PK extends keyof T> { add(injector: Injector, ...entries: T[]): Promise<void>; readonly primaryKey: PK }',
  'type Token<T> = { id: symbol; name: string; lifetime: "singleton"; isAsync: false; factory: () => T; readonly __type?: T }',
  'type StoreToken<T, PK extends keyof T> = Token<PhysicalStore<T, PK>> & { readonly model: any; readonly primaryKey: PK }',
  'type DataSetToken<T, PK extends keyof T> = Token<DataSet<T, PK>> & { readonly model: any; readonly primaryKey: PK }',
  'declare const injector: Injector',
  'declare const UserStore: StoreToken<{ id: number }, "id">',
  'declare const UserDataSet: DataSetToken<{ id: number }, "id">',
  'declare const Logger: Token<{ log: (m: string) => void }>',
].join('\n')

tester.run('no-direct-store-token', noDirectStoreToken, {
  valid: [
    {
      name: 'resolving a plain service token is allowed',
      filename: 'my-service.ts',
      code: [HEADER, 'const logger = injector.get(Logger)'].join('\n'),
    },
    {
      name: 'resolving a DataSetToken (carrying the same model/primaryKey brand) is allowed',
      filename: 'my-service.ts',
      code: [HEADER, 'const users = injector.get(UserDataSet)'].join('\n'),
    },
    {
      name: 'awaiting a DataSetToken via getAsync is allowed',
      filename: 'my-service.ts',
      code: [HEADER, 'async function run() { const users = await injector.getAsync(UserDataSet) }'].join('\n'),
    },
    {
      name: 'resolving a DataSetToken via a property access (mirrors http-user-context.ts) is allowed',
      filename: 'my-service.ts',
      code: [
        HEADER,
        'declare const settings: { userDataSet: DataSetToken<{ id: number }, "id"> }',
        'const users = injector.get(settings.userDataSet)',
      ].join('\n'),
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
    {
      name: 'a property-access StoreToken is also reported',
      filename: 'my-service.ts',
      code: [
        HEADER,
        'declare const settings: { primaryStore: StoreToken<{ id: number }, "id"> }',
        'const store = injector.get(settings.primaryStore)',
      ].join('\n'),
      errors: [{ messageId: 'noStoreTokenResolve' }],
    },
  ],
})
