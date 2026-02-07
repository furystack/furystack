import { Injector } from '@furystack/inject'
import { createComponent, initializeShadeRoot } from '@furystack/shades'
import { sleepAsync, usingAsync } from '@furystack/utils'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { RadioGroup } from './radio-group.js'
import { Radio } from './radio.js'

describe('RadioGroup', () => {
  beforeEach(() => {
    document.body.innerHTML = '<div id="root"></div>'
  })

  afterEach(() => {
    document.body.innerHTML = ''
    vi.restoreAllMocks()
  })

  it('should render with shadow DOM', async () => {
    await usingAsync(new Injector(), async (injector) => {
      const rootElement = document.getElementById('root') as HTMLDivElement

      initializeShadeRoot({
        injector,
        rootElement,
        jsxElement: (
          <RadioGroup name="test-group">
            <Radio value="option1" labelTitle="Option 1" />
            <Radio value="option2" labelTitle="Option 2" />
          </RadioGroup>
        ),
      })

      await sleepAsync(50)

      const group = document.querySelector('shade-radio-group')
      expect(group).not.toBeNull()
    })
  })

  it('should set the radiogroup role', async () => {
    await usingAsync(new Injector(), async (injector) => {
      const rootElement = document.getElementById('root') as HTMLDivElement

      initializeShadeRoot({
        injector,
        rootElement,
        jsxElement: (
          <RadioGroup name="test-group">
            <Radio value="option1" />
          </RadioGroup>
        ),
      })

      await sleepAsync(50)

      const group = document.querySelector('shade-radio-group') as HTMLElement
      expect(group.getAttribute('role')).toBe('radiogroup')
    })
  })

  it('should render the label title', async () => {
    await usingAsync(new Injector(), async (injector) => {
      const rootElement = document.getElementById('root') as HTMLDivElement

      initializeShadeRoot({
        injector,
        rootElement,
        jsxElement: (
          <RadioGroup name="test-group" labelTitle="Pick an option">
            <Radio value="option1" />
          </RadioGroup>
        ),
      })

      await sleepAsync(50)

      const label = document.querySelector('shade-radio-group .radio-group-label') as HTMLElement
      expect(label).not.toBeNull()
      expect(label.textContent).toBe('Pick an option')
    })
  })

  it('should not render label span when labelTitle is not provided', async () => {
    await usingAsync(new Injector(), async (injector) => {
      const rootElement = document.getElementById('root') as HTMLDivElement

      initializeShadeRoot({
        injector,
        rootElement,
        jsxElement: (
          <RadioGroup name="test-group">
            <Radio value="option1" />
          </RadioGroup>
        ),
      })

      await sleepAsync(50)

      const label = document.querySelector('shade-radio-group .radio-group-label')
      expect(label).toBeNull()
    })
  })

  describe('orientation', () => {
    it('should default to vertical orientation', async () => {
      await usingAsync(new Injector(), async (injector) => {
        const rootElement = document.getElementById('root') as HTMLDivElement

        initializeShadeRoot({
          injector,
          rootElement,
          jsxElement: (
            <RadioGroup name="test-group">
              <Radio value="option1" />
            </RadioGroup>
          ),
        })

        await sleepAsync(50)

        const group = document.querySelector('shade-radio-group') as HTMLElement
        expect(group.getAttribute('data-orientation')).toBe('vertical')
      })
    })

    it('should set horizontal orientation', async () => {
      await usingAsync(new Injector(), async (injector) => {
        const rootElement = document.getElementById('root') as HTMLDivElement

        initializeShadeRoot({
          injector,
          rootElement,
          jsxElement: (
            <RadioGroup name="test-group" orientation="horizontal">
              <Radio value="option1" />
            </RadioGroup>
          ),
        })

        await sleepAsync(50)

        const group = document.querySelector('shade-radio-group') as HTMLElement
        expect(group.getAttribute('data-orientation')).toBe('horizontal')
      })
    })
  })

  describe('name propagation', () => {
    it('should set the name attribute on child radio inputs', async () => {
      await usingAsync(new Injector(), async (injector) => {
        const rootElement = document.getElementById('root') as HTMLDivElement

        initializeShadeRoot({
          injector,
          rootElement,
          jsxElement: (
            <RadioGroup name="fruit-group">
              <Radio value="apple" labelTitle="Apple" />
              <Radio value="banana" labelTitle="Banana" />
            </RadioGroup>
          ),
        })

        await sleepAsync(100)

        const inputs = document.querySelectorAll('shade-radio input[type="radio"]')
        inputs.forEach((input) => {
          expect((input as HTMLInputElement).name).toBe('fruit-group')
        })
      })
    })
  })

  describe('value selection', () => {
    it('should set the correct radio as checked based on value prop', async () => {
      await usingAsync(new Injector(), async (injector) => {
        const rootElement = document.getElementById('root') as HTMLDivElement

        initializeShadeRoot({
          injector,
          rootElement,
          jsxElement: (
            <RadioGroup name="test-group" value="option2">
              <Radio value="option1" labelTitle="Option 1" />
              <Radio value="option2" labelTitle="Option 2" />
              <Radio value="option3" labelTitle="Option 3" />
            </RadioGroup>
          ),
        })

        await sleepAsync(100)

        const inputs = document.querySelectorAll('shade-radio input[type="radio"]')
        expect((inputs[0] as HTMLInputElement).checked).toBe(false)
        expect((inputs[1] as HTMLInputElement).checked).toBe(true)
        expect((inputs[2] as HTMLInputElement).checked).toBe(false)
      })
    })

    it('should set the correct radio as checked based on defaultValue prop', async () => {
      await usingAsync(new Injector(), async (injector) => {
        const rootElement = document.getElementById('root') as HTMLDivElement

        initializeShadeRoot({
          injector,
          rootElement,
          jsxElement: (
            <RadioGroup name="test-group" defaultValue="option3">
              <Radio value="option1" labelTitle="Option 1" />
              <Radio value="option2" labelTitle="Option 2" />
              <Radio value="option3" labelTitle="Option 3" />
            </RadioGroup>
          ),
        })

        await sleepAsync(100)

        const inputs = document.querySelectorAll('shade-radio input[type="radio"]')
        expect((inputs[0] as HTMLInputElement).checked).toBe(false)
        expect((inputs[1] as HTMLInputElement).checked).toBe(false)
        expect((inputs[2] as HTMLInputElement).checked).toBe(true)
      })
    })
  })

  describe('disabled state', () => {
    it('should disable all radio inputs when group is disabled', async () => {
      await usingAsync(new Injector(), async (injector) => {
        const rootElement = document.getElementById('root') as HTMLDivElement

        initializeShadeRoot({
          injector,
          rootElement,
          jsxElement: (
            <RadioGroup name="test-group" disabled>
              <Radio value="option1" labelTitle="Option 1" />
              <Radio value="option2" labelTitle="Option 2" />
            </RadioGroup>
          ),
        })

        await sleepAsync(100)

        const inputs = document.querySelectorAll('shade-radio input[type="radio"]')
        inputs.forEach((input) => {
          expect((input as HTMLInputElement).disabled).toBe(true)
        })
      })
    })
  })

  describe('onchange callback', () => {
    it('should call onchange when a radio is selected', async () => {
      await usingAsync(new Injector(), async (injector) => {
        const rootElement = document.getElementById('root') as HTMLDivElement
        const onchange = vi.fn()

        initializeShadeRoot({
          injector,
          rootElement,
          jsxElement: (
            <RadioGroup name="test-group" onValueChange={onchange}>
              <Radio value="option1" labelTitle="Option 1" />
              <Radio value="option2" labelTitle="Option 2" />
            </RadioGroup>
          ),
        })

        await sleepAsync(100)

        const input = document.querySelectorAll('shade-radio input[type="radio"]')[1] as HTMLInputElement
        input.checked = true
        input.dispatchEvent(new Event('change', { bubbles: true }))

        await sleepAsync(50)

        expect(onchange).toHaveBeenCalledWith('option2')
      })
    })
  })
})
