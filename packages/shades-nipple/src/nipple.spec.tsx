import { Injector } from '@furystack/inject'
import { createComponent, initializeShadeRoot } from '@furystack/shades'
import type { NippleComponentProps } from './nipple'
import { NippleComponent } from './nipple'

describe('Nipple', () => {
  beforeEach(() => (document.body.innerHTML = '<div id="root"></div>'))
  afterEach(() => (document.body.innerHTML = ''))
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

    const onStart = jest.fn()
    const onDir = jest.fn()
    const onMove = jest.fn()
    const onEnd = jest.fn()

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
