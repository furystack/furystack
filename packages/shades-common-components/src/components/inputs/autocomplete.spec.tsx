import { Injector } from '@furystack/inject'
import { createComponent, initializeShadeRoot } from '@furystack/shades'
import { sleepAsync, usingAsync } from '@furystack/utils'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { Autocomplete } from './autocomplete.js'

describe('Autocomplete component', () => {
  beforeEach(() => {
    document.body.innerHTML = '<div id="root"></div>'
  })

  afterEach(() => {
    document.body.innerHTML = ''
  })

  it('should render an input with datalist suggestions', async () => {
    await usingAsync(new Injector(), async (injector) => {
      const rootElement = document.getElementById('root') as HTMLDivElement
      const suggestions = ['apple', 'banana', 'cherry']

      initializeShadeRoot({
        injector,
        rootElement,
        jsxElement: <Autocomplete suggestions={suggestions} />,
      })

      await sleepAsync(50)

      const autocomplete = document.querySelector('shade-autocomplete')
      expect(autocomplete).not.toBeNull()

      const input = autocomplete?.querySelector('input')
      expect(input).not.toBeNull()

      const datalist = autocomplete?.querySelector('datalist')
      expect(datalist).not.toBeNull()

      const options = datalist?.querySelectorAll('option')
      expect(options?.length).toBe(3)
      expect(options?.[0].value).toBe('apple')
      expect(options?.[1].value).toBe('banana')
      expect(options?.[2].value).toBe('cherry')
    })
  })

  it('should link the input to the datalist via list attribute', async () => {
    await usingAsync(new Injector(), async (injector) => {
      const rootElement = document.getElementById('root') as HTMLDivElement

      initializeShadeRoot({
        injector,
        rootElement,
        jsxElement: <Autocomplete suggestions={['option1', 'option2']} />,
      })

      await sleepAsync(50)

      const autocomplete = document.querySelector('shade-autocomplete')
      const input = autocomplete?.querySelector('input')
      const datalist = autocomplete?.querySelector('datalist')

      expect(input).not.toBeNull()
      expect(datalist).not.toBeNull()
      expect(input?.getAttribute('list')).toBe(datalist?.id)
    })
  })

  it('should call onchange callback with valid value', async () => {
    await usingAsync(new Injector(), async (injector) => {
      const rootElement = document.getElementById('root') as HTMLDivElement
      const onchange = vi.fn()
      const suggestions = ['foo', 'bar', 'baz']

      initializeShadeRoot({
        injector,
        rootElement,
        jsxElement: <Autocomplete suggestions={suggestions} onchange={onchange} />,
      })

      await sleepAsync(50)

      const autocomplete = document.querySelector('shade-autocomplete')
      const input = autocomplete?.querySelector('input') as HTMLInputElement
      expect(input).not.toBeNull()

      input.value = 'foo'
      const changeEvent = new Event('change', { bubbles: true })
      input.dispatchEvent(changeEvent)

      await sleepAsync(50)

      expect(onchange).toHaveBeenCalledWith('foo')
    })
  })

  it('should call onchange callback with any value when not in strict mode', async () => {
    await usingAsync(new Injector(), async (injector) => {
      const rootElement = document.getElementById('root') as HTMLDivElement
      const onchange = vi.fn()
      const suggestions = ['foo', 'bar']

      initializeShadeRoot({
        injector,
        rootElement,
        jsxElement: <Autocomplete suggestions={suggestions} onchange={onchange} />,
      })

      await sleepAsync(50)

      const autocomplete = document.querySelector('shade-autocomplete')
      const input = autocomplete?.querySelector('input') as HTMLInputElement

      input.value = 'custom-value'
      const changeEvent = new Event('change', { bubbles: true })
      input.dispatchEvent(changeEvent)

      await sleepAsync(50)

      expect(onchange).toHaveBeenCalledWith('custom-value')
    })
  })

  it('should set custom validity when strict mode is enabled and value is not in suggestions', async () => {
    await usingAsync(new Injector(), async (injector) => {
      const rootElement = document.getElementById('root') as HTMLDivElement
      const onchange = vi.fn()
      const suggestions = ['valid1', 'valid2']

      initializeShadeRoot({
        injector,
        rootElement,
        jsxElement: <Autocomplete suggestions={suggestions} strict={true} onchange={onchange} />,
      })

      await sleepAsync(50)

      const autocomplete = document.querySelector('shade-autocomplete')
      const input = autocomplete?.querySelector('input') as HTMLInputElement

      const setCustomValiditySpy = vi.spyOn(input, 'setCustomValidity')

      input.value = 'invalid-value'
      const changeEvent = new Event('change', { bubbles: true })
      input.dispatchEvent(changeEvent)

      await sleepAsync(50)

      expect(setCustomValiditySpy).toHaveBeenCalledWith('Please select a valid entry!')
      // Verify that onchange was not called with the invalid string value
      // (The Input component may call the underlying handler with the event object,
      // but the Autocomplete's strict validation should prevent calling onchange with the value)
      expect(onchange).not.toHaveBeenCalledWith('invalid-value')
    })
  })

  it('should call onchange when strict mode is enabled and value is in suggestions', async () => {
    await usingAsync(new Injector(), async (injector) => {
      const rootElement = document.getElementById('root') as HTMLDivElement
      const onchange = vi.fn()
      const suggestions = ['valid1', 'valid2']

      initializeShadeRoot({
        injector,
        rootElement,
        jsxElement: <Autocomplete suggestions={suggestions} strict={true} onchange={onchange} />,
      })

      await sleepAsync(50)

      const autocomplete = document.querySelector('shade-autocomplete')
      const input = autocomplete?.querySelector('input') as HTMLInputElement

      input.value = 'valid1'
      const changeEvent = new Event('change', { bubbles: true })
      input.dispatchEvent(changeEvent)

      await sleepAsync(50)

      expect(onchange).toHaveBeenCalledWith('valid1')
    })
  })

  it('should pass inputProps to the underlying Input component', async () => {
    await usingAsync(new Injector(), async (injector) => {
      const rootElement = document.getElementById('root') as HTMLDivElement

      initializeShadeRoot({
        injector,
        rootElement,
        jsxElement: (
          <Autocomplete
            suggestions={['a', 'b']}
            inputProps={{
              placeholder: 'Select an option',
              disabled: true,
              name: 'autocomplete-field',
            }}
          />
        ),
      })

      await sleepAsync(50)

      const autocomplete = document.querySelector('shade-autocomplete')
      const input = autocomplete?.querySelector('input') as HTMLInputElement

      expect(input.placeholder).toBe('Select an option')
      expect(input.disabled).toBe(true)
      expect(input.name).toBe('autocomplete-field')
    })
  })

  it('should render with empty suggestions', async () => {
    await usingAsync(new Injector(), async (injector) => {
      const rootElement = document.getElementById('root') as HTMLDivElement

      initializeShadeRoot({
        injector,
        rootElement,
        jsxElement: <Autocomplete suggestions={[]} />,
      })

      await sleepAsync(50)

      const autocomplete = document.querySelector('shade-autocomplete')
      expect(autocomplete).not.toBeNull()

      const datalist = autocomplete?.querySelector('datalist')
      expect(datalist).not.toBeNull()

      const options = datalist?.querySelectorAll('option')
      expect(options?.length).toBe(0)
    })
  })

  it('should work without onchange callback', async () => {
    await usingAsync(new Injector(), async (injector) => {
      const rootElement = document.getElementById('root') as HTMLDivElement

      initializeShadeRoot({
        injector,
        rootElement,
        jsxElement: <Autocomplete suggestions={['test']} />,
      })

      await sleepAsync(50)

      const autocomplete = document.querySelector('shade-autocomplete')
      const input = autocomplete?.querySelector('input') as HTMLInputElement

      input.value = 'test'
      const changeEvent = new Event('change', { bubbles: true })

      // Should not throw when onchange is not provided
      expect(() => input.dispatchEvent(changeEvent)).not.toThrow()
    })
  })
})
