import { RuleTester } from '@typescript-eslint/rule-tester'
import { afterAll, describe, it } from 'vitest'
import { noDirectGetValueInRender } from './no-direct-get-value-in-render.js'
import { noManualSubscribeInRender } from './no-manual-subscribe-in-render.js'
import { requireDisposableForObservableOwner } from './require-disposable-for-observable-owner.js'
import { restNoTypeCast } from './rest-no-type-cast.js'
import { routerNoTypeCast } from './router-no-type-cast.js'

RuleTester.afterAll = afterAll
RuleTester.it = it
RuleTester.describe = describe

const typedTester = new RuleTester({
  languageOptions: {
    parserOptions: {
      projectService: { allowDefaultProject: ['*.ts', '*.tsx'] },
      ecmaFeatures: { jsx: true },
    },
  },
})

typedTester.run('no-direct-get-value-in-render (typed)', noDirectGetValueInRender, {
  valid: [
    {
      name: '.getValue() on non-ObservableValue is ignored when type info is available',
      filename: 'test.tsx',
      code: `
        declare function Shade(opts: { customElementName: string; render: () => any }): any
        declare class FormField<T> { getValue(): T }
        declare const field: FormField<string>
        Shade({
          customElementName: 'my-comp',
          render: () => {
            return <div>{field.getValue()}</div>
          }
        })
      `,
    },
  ],
  invalid: [
    {
      name: '.getValue() on ObservableValue is still reported with type info',
      filename: 'test.tsx',
      code: `
        declare function Shade(opts: { customElementName: string; render: () => any }): any
        declare class ObservableValue<T> { getValue(): T; setValue(v: T): void }
        declare const obs: ObservableValue<boolean>
        Shade({
          customElementName: 'my-comp',
          render: () => {
            return <div>{obs.getValue() ? 'yes' : 'no'}</div>
          }
        })
      `,
      errors: [{ messageId: 'noDirectGetValue' }],
    },
  ],
})

typedTester.run('no-manual-subscribe-in-render (typed)', noManualSubscribeInRender, {
  valid: [
    {
      name: '.subscribe() on EventTarget is ignored when type info is available',
      filename: 'test.tsx',
      code: `
        declare function Shade(opts: { customElementName: string; render: () => any }): any
        declare class EventEmitter { subscribe(cb: () => void): void }
        declare const emitter: EventEmitter
        Shade({
          customElementName: 'my-comp',
          render: () => {
            emitter.subscribe(() => {})
            return <div />
          }
        })
      `,
    },
  ],
  invalid: [
    {
      name: '.subscribe() on ObservableValue is still reported with type info',
      filename: 'test.tsx',
      code: `
        declare function Shade(opts: { customElementName: string; render: () => any }): any
        declare class ObservableValue<T> { subscribe(cb: (v: T) => void): { dispose(): void }; getValue(): T }
        declare const obs: ObservableValue<string>
        Shade({
          customElementName: 'my-comp',
          render: () => {
            obs.subscribe(() => {})
            return <div />
          }
        })
      `,
      errors: [{ messageId: 'noManualSubscribe' }],
    },
  ],
})

typedTester.run('require-disposable-for-observable-owner (typed)', requireDisposableForObservableOwner, {
  valid: [],
  invalid: [
    {
      name: 'aliased ObservableValue import is caught via type info',
      code: [
        'declare class ObservableValue<T> { getValue(): T; [Symbol.dispose](): void }',
        'const OV = ObservableValue',
        'class MyService {',
        '  public data = new OV(null)',
        '}',
      ].join('\n'),
      errors: [{ messageId: 'missingDisposable' }],
      output: [
        'declare class ObservableValue<T> { getValue(): T; [Symbol.dispose](): void }',
        'const OV = ObservableValue',
        'class MyService {',
        '  public data = new OV(null)',
        '',
        '  public [Symbol.dispose]() {',
        '    this.data[Symbol.dispose]()',
        '  }',
        '}',
      ].join('\n'),
    },
  ],
})

const REST_HEADER = [
  'declare type Api = {',
  '  GET: { "/users": { result: { id: string; name: string } } }',
  '  POST: { "/users": { result: { id: string }; body: { name: string } } }',
  '}',
  'declare function createClient<T>(opts: { endpointUrl: string }): <M extends keyof T, A extends keyof T[M]>(',
  '  options: { method: M; action: A; body?: any; url?: any; query?: any; headers?: any },',
  ') => Promise<{ response: Response; result: any }>',
  'declare function useRestService<T>(opts: { api: any; injector: any; root: string; port: number }): Promise<void>',
  'const client = createClient<Api>({ endpointUrl: "/" })',
].join('\n')

typedTester.run('rest-no-type-cast', restNoTypeCast, {
  valid: [
    {
      name: 'plain REST client call without casts',
      code: [
        REST_HEADER,
        'async function run() {',
        '  await client({ method: "POST", action: "/users", body: { name: "alice" } })',
        '}',
      ].join('\n'),
    },
    {
      name: '`as const` is allowed',
      code: [
        REST_HEADER,
        'async function run() {',
        '  await client({ method: "POST" as const, action: "/users", body: { name: "alice" } })',
        '}',
      ].join('\n'),
    },
    {
      name: 'satisfies is allowed',
      code: [
        REST_HEADER,
        'async function run() {',
        '  const body = { name: "alice" } satisfies { name: string }',
        '  await client({ method: "POST", action: "/users", body })',
        '}',
      ].join('\n'),
    },
    {
      name: 'cast inside a nested call expression is not flagged',
      code: [
        REST_HEADER,
        'declare function normalise(raw: unknown): { name: string }',
        'async function run(raw: unknown) {',
        '  await client({ method: "POST", action: "/users", body: normalise(raw as any) })',
        '}',
      ].join('\n'),
    },
    {
      name: 'cast on unrelated call is ignored',
      code: [REST_HEADER, 'declare function other(arg: any): any', 'other({ body: {} as any })'].join('\n'),
    },
  ],
  invalid: [
    {
      name: 'cast on body flows directly into typed arg',
      code: [
        REST_HEADER,
        'async function run(raw: unknown) {',
        '  await client({ method: "POST", action: "/users", body: raw as { name: string } })',
        '}',
      ].join('\n'),
      errors: [{ messageId: 'castInArg' }],
    },
    {
      name: 'double cast as unknown as T is flagged',
      code: [
        REST_HEADER,
        'async function run(raw: unknown) {',
        '  await client({ method: "POST", action: "/users", body: raw as unknown as { name: string } })',
        '}',
      ].join('\n'),
      errors: [{ messageId: 'castInArg' }],
    },
    {
      name: 'non-null assertion on arg is flagged',
      code: [
        REST_HEADER,
        'async function run(maybe: { name: string } | undefined) {',
        '  await client({ method: "POST", action: "/users", body: maybe! })',
        '}',
      ].join('\n'),
      errors: [{ messageId: 'castInArg' }],
    },
    {
      name: 'cast on the callee is flagged',
      code: [
        REST_HEADER,
        'async function run() {',
        '  await (client as any)({ method: "GET", action: "/users" })',
        '}',
      ].join('\n'),
      errors: [{ messageId: 'castOnCallee' }],
    },
    {
      name: 'cast on awaited .result is flagged',
      code: [
        REST_HEADER,
        'async function run() {',
        '  const result = (await client({ method: "GET", action: "/users" })).result as { id: string }',
        '}',
      ].join('\n'),
      errors: [{ messageId: 'castOnResult' }],
    },
    {
      name: 'direct cast in useRestService arg is flagged',
      code: [
        'declare function useRestService<T>(opts: any): Promise<void>',
        'declare const injector: any',
        'declare const schema: any',
        'useRestService({ api: {} as any, injector, root: "/", port: 80 })',
      ].join('\n'),
      errors: [{ messageId: 'castInArg' }],
    },
  ],
})

const ROUTER_HEADER = [
  'declare type Routes = { "/users": { id: string } }',
  'declare function createNestedNavigate<T>(): (injector: any, args: { path: keyof T; params?: any; query?: any; hash?: any }) => void',
  'declare function createNestedReplace<T>(): (injector: any, args: { path: keyof T; params?: any; query?: any; hash?: any }) => void',
  'declare function createNestedRouteLink<T>(): (props: { path: keyof T; params?: any; query?: any; hash?: any; children?: any }) => any',
  'declare function createNestedHooks<T>(routes: T): {',
  '  getTypedQuery: (injector: any, path: keyof T) => any',
  '  getTypedHash: (injector: any, path: keyof T) => any',
  '}',
  'declare const injector: any',
  'declare const routes: Routes',
  'const navigate = createNestedNavigate<Routes>()',
  'const replace = createNestedReplace<Routes>()',
  'const Link = createNestedRouteLink<Routes>()',
  'const { getTypedQuery, getTypedHash } = createNestedHooks(routes)',
].join('\n')

typedTester.run('router-no-type-cast', routerNoTypeCast, {
  valid: [
    {
      name: 'plain navigate call without casts',
      filename: 'test.tsx',
      code: [ROUTER_HEADER, 'navigate(injector, { path: "/users", params: { id: "1" } })'].join('\n'),
    },
    {
      name: '`as const` is allowed',
      filename: 'test.tsx',
      code: [ROUTER_HEADER, 'navigate(injector, { path: "/users" as const, params: { id: "1" } })'].join('\n'),
    },
    {
      name: 'getTypedQuery without casts',
      filename: 'test.tsx',
      code: [ROUTER_HEADER, 'getTypedQuery(injector, "/users")'].join('\n'),
    },
    {
      name: 'cast inside nested call in arg is not flagged',
      filename: 'test.tsx',
      code: [
        ROUTER_HEADER,
        'declare function build(raw: unknown): { id: string }',
        'navigate(injector, { path: "/users", params: build(undefined as any) })',
      ].join('\n'),
    },
  ],
  invalid: [
    {
      name: 'cast on params is flagged for navigate',
      filename: 'test.tsx',
      code: [
        ROUTER_HEADER,
        'declare const raw: unknown',
        'navigate(injector, { path: "/users", params: raw as { id: string } })',
      ].join('\n'),
      errors: [{ messageId: 'castInArg' }],
    },
    {
      name: 'cast on params is flagged for replace',
      filename: 'test.tsx',
      code: [
        ROUTER_HEADER,
        'declare const raw: unknown',
        'replace(injector, { path: "/users", params: raw as { id: string } })',
      ].join('\n'),
      errors: [{ messageId: 'castInArg' }],
    },
    {
      name: 'cast in getTypedQuery path arg is flagged',
      filename: 'test.tsx',
      code: [ROUTER_HEADER, 'getTypedQuery(injector, "/users" as any)'].join('\n'),
      errors: [{ messageId: 'castInArg' }],
    },
    {
      name: 'cast on callee is flagged',
      filename: 'test.tsx',
      code: [ROUTER_HEADER, ';(navigate as any)(injector, { path: "/users", params: { id: "1" } })'].join('\n'),
      errors: [{ messageId: 'castOnCallee' }],
    },
    {
      name: 'cast inside JSX prop of nested route link is flagged',
      filename: 'test.tsx',
      code: [
        ROUTER_HEADER,
        'declare const raw: unknown',
        'const node = <Link path="/users" params={raw as { id: string }} />',
      ].join('\n'),
      errors: [{ messageId: 'castInProp' }],
    },
    {
      name: 'non-null assertion on arg is flagged',
      filename: 'test.tsx',
      code: [
        ROUTER_HEADER,
        'declare const maybe: { id: string } | undefined',
        'navigate(injector, { path: "/users", params: maybe! })',
      ].join('\n'),
      errors: [{ messageId: 'castInArg' }],
    },
  ],
})
