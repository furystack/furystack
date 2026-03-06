import { RuleTester } from '@typescript-eslint/rule-tester'
import { afterAll, describe, it } from 'vitest'
import { noDirectGetValueInRender } from './no-direct-get-value-in-render.js'
import { noDirectPhysicalStore } from './no-direct-physical-store.js'
import { noManualSubscribeInRender } from './no-manual-subscribe-in-render.js'
import { requireDisposableForObservableOwner } from './require-disposable-for-observable-owner.js'

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
        declare function Shade(opts: { shadowDomName: string; render: () => any }): any
        declare class FormField<T> { getValue(): T }
        declare const field: FormField<string>
        Shade({
          shadowDomName: 'my-comp',
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
        declare function Shade(opts: { shadowDomName: string; render: () => any }): any
        declare class ObservableValue<T> { getValue(): T; setValue(v: T): void }
        declare const obs: ObservableValue<boolean>
        Shade({
          shadowDomName: 'my-comp',
          render: () => {
            return <div>{obs.getValue() ? 'yes' : 'no'}</div>
          }
        })
      `,
      errors: [{ messageId: 'noDirectGetValue' }],
    },
  ],
})

typedTester.run('no-direct-physical-store (typed)', noDirectPhysicalStore, {
  valid: [
    {
      name: '.getStoreFor() on non-StoreManager is ignored when type info is available',
      code: `
        declare class ConfigManager { getStoreFor(key: string): unknown }
        declare const cfg: ConfigManager
        const store = cfg.getStoreFor('settings')
      `,
    },
  ],
  invalid: [
    {
      name: '.getStoreFor() on StoreManager is still reported with type info',
      code: `
        declare class StoreManager { getStoreFor(model: unknown, pk: string): unknown }
        declare const sm: StoreManager
        const store = sm.getStoreFor(MyModel, 'id')
      `,
      errors: [{ messageId: 'noGetStoreFor' }],
    },
  ],
})

typedTester.run('no-manual-subscribe-in-render (typed)', noManualSubscribeInRender, {
  valid: [
    {
      name: '.subscribe() on EventTarget is ignored when type info is available',
      filename: 'test.tsx',
      code: `
        declare function Shade(opts: { shadowDomName: string; render: () => any }): any
        declare class EventEmitter { subscribe(cb: () => void): void }
        declare const emitter: EventEmitter
        Shade({
          shadowDomName: 'my-comp',
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
        declare function Shade(opts: { shadowDomName: string; render: () => any }): any
        declare class ObservableValue<T> { subscribe(cb: (v: T) => void): { dispose(): void }; getValue(): T }
        declare const obs: ObservableValue<string>
        Shade({
          shadowDomName: 'my-comp',
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
