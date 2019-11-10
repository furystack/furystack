import { createComponent } from '../src/shade-component'
import '../src/jsx'

describe('Shades Component Factory', () => {
  it('Should create a simple component', () => {
    const component = <div>test</div>
    expect(component).toMatchSnapshot()
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
    expect(component).toMatchSnapshot()
  })
})
