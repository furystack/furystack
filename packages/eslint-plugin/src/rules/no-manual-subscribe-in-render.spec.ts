import { RuleTester } from '@typescript-eslint/rule-tester'
import { afterAll, describe, it } from 'vitest'
import { noManualSubscribeInRender } from './no-manual-subscribe-in-render.js'

RuleTester.afterAll = afterAll
RuleTester.it = it
RuleTester.describe = describe

const tester = new RuleTester({
  languageOptions: {
    parserOptions: { ecmaFeatures: { jsx: true } },
  },
})

const typedTester = new RuleTester({
  languageOptions: {
    parserOptions: {
      projectService: { allowDefaultProject: ['*.ts', '*.tsx'] },
      ecmaFeatures: { jsx: true },
    },
  },
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

tester.run('no-manual-subscribe-in-render', noManualSubscribeInRender, {
  valid: [
    {
      name: '.subscribe() wrapped in useDisposable',
      code: `
        Shade({
          shadowDomName: 'my-comp',
          render: ({ useDisposable }) => {
            useDisposable('sub', () => someObservable.subscribe(() => {}))
            return <div />
          }
        })
      `,
    },
    {
      name: '.subscribe() outside of Shade render is ignored',
      code: `
        function setup() {
          someObservable.subscribe(() => {})
        }
      `,
    },
    {
      name: 'non-subscribe member call in render is ignored',
      code: `
        Shade({
          shadowDomName: 'my-comp',
          render: () => {
            const data = service.getData()
            return <div>{data}</div>
          }
        })
      `,
    },
    {
      name: '.subscribe() inside helper function called from useDisposable',
      code: `
        Shade({
          shadowDomName: 'my-comp',
          render: ({ useDisposable }) => {
            const setupListener = () => {
              return someObservable.subscribe(() => {})
            }
            useDisposable('listener', () => setupListener())
            return <div />
          }
        })
      `,
    },
  ],
  invalid: [
    {
      name: 'direct .subscribe() in Shade render',
      code: `
        Shade({
          shadowDomName: 'my-comp',
          render: () => {
            someObservable.subscribe(() => {})
            return <div />
          }
        })
      `,
      errors: [{ messageId: 'noManualSubscribe' }],
    },
    {
      name: '.subscribe() assigned to variable but not in useDisposable',
      code: `
        Shade({
          shadowDomName: 'my-comp',
          render: () => {
            const sub = observable.subscribe((val) => console.log(val))
            return <div />
          }
        })
      `,
      errors: [{ messageId: 'noManualSubscribe' }],
    },
  ],
})
