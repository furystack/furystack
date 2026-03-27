import { Injector } from '@furystack/inject'
import { createComponent, initializeShadeRoot } from '@furystack/shades'
import { usingAsync } from '@furystack/utils'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import type { NippleComponentProps, NippleManagerEvent, NippleManagerEventHandler } from './nipple.js'
import { NippleComponent } from './nipple.js'

const { createMock, managerMock, managerEventHandlers } = vi.hoisted(() => {
  const handlers: Partial<Record<'start' | 'end' | 'dir' | 'move', (event: unknown) => void>> = {}
  const manager = {
    on: vi.fn((event: 'start' | 'end' | 'dir' | 'move', handler: (event: unknown) => void) => {
      handlers[event] = handler
      return manager
    }),
    destroy: vi.fn(),
  }
  return {
    createMock: vi.fn(() => manager),
    managerMock: manager,
    managerEventHandlers: handlers,
  }
})

vi.mock('nipplejs', () => ({
  default: {
    create: createMock,
  },
}))

describe('Nipple', () => {
  beforeEach(() => {
    document.body.innerHTML = '<div id="root"></div>'
    createMock.mockClear()
    managerMock.on.mockClear()
    managerMock.destroy.mockClear()
    delete managerEventHandlers.start
    delete managerEventHandlers.end
    delete managerEventHandlers.dir
    delete managerEventHandlers.move
  })
  afterEach(() => {
    document.body.innerHTML = ''
  })
  it('Should render with the default settings', async () => {
    await usingAsync(new Injector(), async (injector) => {
      const rootElement = document.getElementById('root') as HTMLDivElement

      initializeShadeRoot({
        injector,
        rootElement,
        jsxElement: <NippleComponent managerOptions={{}} />,
      })
      expect(document.body.innerHTML).toBe('<div id="root"><shade-nipple><div></div></shade-nipple></div>')
    })
  })

  it('Should attach event properties', async () => {
    await usingAsync(new Injector(), async (injector) => {
      const rootElement = document.getElementById('root') as HTMLDivElement

      const onStart: NippleManagerEventHandler = vi.fn()
      const onDir: NippleManagerEventHandler = vi.fn()
      const onMove: NippleManagerEventHandler = vi.fn()
      const onEnd: NippleManagerEventHandler = vi.fn()

      initializeShadeRoot({
        injector,
        rootElement,
        jsxElement: (
          <NippleComponent onStart={onStart} onDir={onDir} onMove={onMove} onEnd={onEnd} managerOptions={{}} />
        ),
      })
      expect(document.body.innerHTML).toBe('<div id="root"><shade-nipple><div></div></shade-nipple></div>')
      const nipple = document.querySelector('shade-nipple') as JSX.Element<NippleComponentProps>

      expect(nipple.props.onDir).toBe(onDir)
      expect(nipple.props.onEnd).toBe(onEnd)
      expect(nipple.props.onMove).toBe(onMove)
      expect(nipple.props.onStart).toBe(onStart)
    })
  })

  it('Should pass runtime move events as single event payload object', async () => {
    await usingAsync(new Injector(), async (injector) => {
      const rootElement = document.getElementById('root') as HTMLDivElement
      const onMoveSpy = vi.fn((_: NippleManagerEvent) => undefined)
      const onMove: NippleManagerEventHandler = onMoveSpy

      initializeShadeRoot({
        injector,
        rootElement,
        jsxElement: <NippleComponent managerOptions={{}} onMove={onMove} />,
      })

      await Promise.resolve()

      expect(createMock).toHaveBeenCalledTimes(1)
      expect(managerMock.on).toHaveBeenCalledWith('move', onMove)

      const moveHandler = managerEventHandlers.move
      expect(moveHandler).toBeTypeOf('function')

      const runtimeEvent = {
        data: {
          direction: { angle: 'up' },
          distance: 24,
          force: 0.75,
        },
      }
      moveHandler?.(runtimeEvent)

      expect(onMoveSpy).toHaveBeenCalledTimes(1)
      expect(onMoveSpy).toHaveBeenCalledWith(runtimeEvent)
      expect(onMoveSpy).toHaveBeenLastCalledWith(
        expect.objectContaining<NippleManagerEvent>({
          data: expect.objectContaining({
            force: 0.75,
          }),
        }),
      )
    })
  })
})
