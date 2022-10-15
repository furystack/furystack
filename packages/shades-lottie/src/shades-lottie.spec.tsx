import { createComponent, Shade } from '@furystack/shades'
import { describe, expect, it } from 'vitest'
import './index.js'
describe('shades-lottie', () => {
  it('should allow to declare lottie animations in JSX', () => {
    const exampleComponent = Shade({
      shadowDomName: 'example-component',
        render: () => {
            return <lottie-player src='' ></lottie-player>
        }
    })

    expect(exampleComponent).toBeDefined()
  })
})
