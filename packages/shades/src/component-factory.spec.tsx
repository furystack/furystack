import { createComponent } from './shade-component'
import './jsx'
import { Shade } from './shade'
import { Injector } from '@furystack/inject'

describe('Shades Component Factory', () => {
  describe('HTML Elements', () => {
    it('Should create a simple component', () => {
      const component = <div>test</div>
      expect(component).toBeInstanceOf(HTMLDivElement)
      expect(component.innerHTML).toBe('test')
      expect(component.outerHTML).toBe('<div>test</div>')
    })

    it('Should apply styles', () => {
      const component = <div style={{ color: 'red' }}>a</div>
      expect(component).toBeInstanceOf(HTMLDivElement)
      expect(component.style.color).toBe('red')
    })

    it('Should apply data attributes', () => {
      const component = <div data-testid="asd-123">a</div>
      expect(component).toBeInstanceOf(HTMLDivElement)
      expect(component.getAttribute('data-testid')).toBe('asd-123')
    })

    it('Should create a nested component', () => {
      const component = (
        <div style={{ display: 'flex' }}>
          <h1>Hi, I'm a header</h1>
          <p>paragraph... {['a', 'b', 'c']}</p>
          <a target="_blank" href="https://google.com">
            link
          </a>
        </div>
      )
      expect(component).toBeInstanceOf(HTMLDivElement)
      expect(component.childElementCount).toBe(3)
      expect(component.innerHTML).toBe(
        `<h1>Hi, I'm a header</h1><p>paragraph... abc</p><a target="_blank" href="https://google.com">link</a>`,
      )
    })

    it('Should attach listeners', () => {
      const onclick = jest.fn()
      const component = <div onclick={onclick}></div>
      expect(component.onclick).toBe(onclick)
    })
  })

  describe('Shade components', () => {
    it('Should render a basic component', () => {
      const Example = Shade({ shadowDomName: 'example-basic', render: () => <div /> })

      const component = (
        <div>
          <Example />
        </div>
      )

      const shade = component.firstElementChild as JSX.Element
      expect(shade.props).toBe(null)
      expect(shade.state).toBe(undefined)
      expect(shade.shadeChildren).toStrictEqual([])
    })

    it('Should render a component with props', () => {
      const Example = Shade<{ foo: string; injector: Injector }>({
        shadowDomName: 'example-with-props',
        render: ({ props }) => <div>{props.foo}</div>,
      })

      const component = (
        <div>
          <Example foo="example" injector={new Injector()} />
        </div>
      )

      const shade = component.firstElementChild as JSX.Element

      shade.callConstructed()

      expect(shade.props.foo).toStrictEqual('example')
      expect(shade.state).toBe(undefined)
      expect(shade.shadeChildren).toStrictEqual([])

      expect(shade.innerHTML).toBe('<div>example</div>')
    })

    it('Should render a component with state', () => {
      const Example = Shade<unknown, { foo: string }>({
        getInitialState: () => ({ foo: 'example' }),
        shadowDomName: 'example-with-state',
        render: () => <div />,
      })

      const component = (
        <div>
          <Example injector={new Injector()} />
        </div>
      )

      const shade = component.firstElementChild as JSX.Element
      shade.callConstructed()
      expect(shade.state).toStrictEqual({ foo: 'example' })
      expect(shade.shadeChildren).toStrictEqual([])
    })
  })
})
