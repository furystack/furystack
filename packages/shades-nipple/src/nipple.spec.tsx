import { Injector } from '@furystack/inject'
import { createComponent, initializeShadeRoot } from '@furystack/shades'
import type { NippleComponentProps } from './nipple.js'
import { NippleComponent } from './nipple.js'
import { beforeEach, afterEach, describe, expect, it, vi } from 'vitest'

describe('Nipple', () => {
  beforeEach(() => {
    document.body.innerHTML = '<div id="root"></div>'
  })

  afterEach(() => {
    document.body.innerHTML = ''
  })
  it('Should render with the default settings', () => {
    const injector = new Injector()
    const rootElement = document.getElementById('root') as HTMLDivElement

    initializeShadeRoot({
      injector,
      rootElement,
      jsxElement: <NippleComponent managerOptions={{}} />,
    })
    expect(document.body.innerHTML).toBe('<div id="root"><shade-nipple></shade-nipple></div>')
  })

  it('Should attach event properties', async () => {
    const injector = new Injector()
    const rootElement = document.getElementById('root') as HTMLDivElement

    const onStart = vi.fn()
    const onDir = vi.fn()
    const onMove = vi.fn()
    const onEnd = vi.fn()

    initializeShadeRoot({
      injector,
      rootElement,
      jsxElement: <NippleComponent onStart={onStart} onDir={onDir} onMove={onMove} onEnd={onEnd} managerOptions={{}} />,
    })
    expect(document.body.innerHTML).toBe('<div id="root"><shade-nipple></shade-nipple></div>')
    const nipple = document.querySelector('shade-nipple') as JSX.Element<NippleComponentProps>

    expect(nipple.props.onDir).toBe(onDir)
    expect(nipple.props.onEnd).toBe(onEnd)
    expect(nipple.props.onMove).toBe(onMove)
    expect(nipple.props.onStart).toBe(onStart)

    // TODO: Check for pointer events
  })
})
