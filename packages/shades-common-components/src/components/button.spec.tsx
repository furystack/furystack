import { Injector } from '@furystack/inject'
import { createComponent, initializeShadeRoot, Shade } from '@furystack/shades'
import { sleepAsync, usingAsync } from '@furystack/utils'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { Button } from './button.js'

describe('Button', () => {
  beforeEach(() => {
    document.body.innerHTML = '<div id="root"></div>'
  })

  afterEach(() => {
    document.body.innerHTML = ''
  })

  const renderButton = async (props: Parameters<typeof Button>[0] = {}, children?: JSX.Element[]) => {
    const injector = new Injector()
    const root = document.getElementById('root')!
    initializeShadeRoot({
      injector,
      rootElement: root,
      jsxElement: <Button {...props}>{children}</Button>,
    })
    await sleepAsync(50)
    return {
      injector,
      button: root.querySelector('button[is="shade-button"]') as HTMLButtonElement,
    }
  }

  describe('rendering', () => {
    it('should render a button element', async () => {
      const { button } = await renderButton()
      expect(button).toBeTruthy()
      expect(button.tagName.toLowerCase()).toBe('button')
      expect(button.getAttribute('is')).toBe('shade-button')
    })

    it('should render children', async () => {
      const { button } = await renderButton({}, ['Click me'] as unknown as JSX.Element[])
      expect(button.textContent).toContain('Click me')
    })
  })

  describe('variants', () => {
    it('should have no data-variant attribute when variant is not specified (flat default)', async () => {
      const { button } = await renderButton()
      expect(button.getAttribute('data-variant')).toBeNull()
    })

    it('should set data-variant="contained" for contained variant', async () => {
      const { button } = await renderButton({ variant: 'contained' })
      expect(button.getAttribute('data-variant')).toBe('contained')
    })

    it('should set data-variant="outlined" for outlined variant', async () => {
      const { button } = await renderButton({ variant: 'outlined' })
      expect(button.getAttribute('data-variant')).toBe('outlined')
    })

    it('should remove data-variant attribute when variant changes to undefined', async () => {
      await usingAsync(new Injector(), async (injector) => {
        const root = document.getElementById('root')!

        const TestComponent = Shade<{ variant?: 'contained' | 'outlined' }>({
          shadowDomName: 'button-test-variant-wrapper',
          render: ({ props }) => <Button variant={props.variant}>Test</Button>,
        })

        initializeShadeRoot({
          injector,
          rootElement: root,
          jsxElement: <TestComponent variant="contained" />,
        })

        await sleepAsync(50)
        const button = root.querySelector('button[is="shade-button"]') as HTMLButtonElement
        expect(button.getAttribute('data-variant')).toBe('contained')
      })
    })
  })

  describe('colors', () => {
    const colors = ['primary', 'secondary', 'error', 'warning', 'success', 'info'] as const

    colors.forEach((color) => {
      it(`should set CSS custom properties for ${color} color`, async () => {
        const { button } = await renderButton({ color })

        expect(button.style.getPropertyValue('--btn-color-main')).toBe(`var(--shades-theme-palette-${color}-main)`)
        expect(button.style.getPropertyValue('--btn-color-main-contrast')).toBe(
          `var(--shades-theme-palette-${color}-main-contrast)`,
        )
        expect(button.style.getPropertyValue('--btn-color-light')).toBe(`var(--shades-theme-palette-${color}-light)`)
        expect(button.style.getPropertyValue('--btn-color-dark')).toBe(`var(--shades-theme-palette-${color}-dark)`)
        expect(button.style.getPropertyValue('--btn-color-dark-contrast')).toBe(
          `var(--shades-theme-palette-${color}-dark-contrast)`,
        )
      })
    })

    it('should set default color CSS custom properties when no color is specified', async () => {
      const { button } = await renderButton()

      expect(button.style.getPropertyValue('--btn-color-main')).toBe('var(--shades-theme-text-secondary)')
      expect(button.style.getPropertyValue('--btn-color-main-contrast')).toBe('var(--shades-theme-background-default)')
      expect(button.style.getPropertyValue('--btn-color-light')).toBe('var(--shades-theme-text-primary)')
      expect(button.style.getPropertyValue('--btn-color-dark')).toBe('var(--shades-theme-button-disabled-background)')
      expect(button.style.getPropertyValue('--btn-color-dark-contrast')).toBe('var(--shades-theme-text-primary)')
    })
  })

  describe('variant and color combinations', () => {
    it('should apply both contained variant and primary color', async () => {
      const { button } = await renderButton({ variant: 'contained', color: 'primary' })

      expect(button.getAttribute('data-variant')).toBe('contained')
      expect(button.style.getPropertyValue('--btn-color-main')).toBe('var(--shades-theme-palette-primary-main)')
    })

    it('should apply both outlined variant and error color', async () => {
      const { button } = await renderButton({ variant: 'outlined', color: 'error' })

      expect(button.getAttribute('data-variant')).toBe('outlined')
      expect(button.style.getPropertyValue('--btn-color-main')).toBe('var(--shades-theme-palette-error-main)')
    })
  })

  describe('disabled state', () => {
    it('should be enabled by default', async () => {
      const { button } = await renderButton()
      expect(button.disabled).toBe(false)
    })

    it('should be disabled when disabled prop is set', async () => {
      const { button } = await renderButton({ disabled: true })
      expect(button.disabled).toBe(true)
    })
  })

  describe('custom styles', () => {
    it('should apply custom styles from style prop', async () => {
      const { button } = await renderButton({
        style: { margin: '20px', padding: '15px' },
      })

      expect(button.style.margin).toBe('20px')
      expect(button.style.padding).toBe('15px')
    })

    it('should merge custom styles with component defaults', async () => {
      const { button } = await renderButton({
        color: 'primary',
        style: { fontSize: '18px' },
      })

      expect(button.style.fontSize).toBe('18px')
      expect(button.style.getPropertyValue('--btn-color-main')).toBe('var(--shades-theme-palette-primary-main)')
    })
  })

  describe('event handling', () => {
    it('should trigger onclick handler when clicked', async () => {
      const handleClick = vi.fn()
      const { button } = await renderButton({ onclick: handleClick })

      button.click()

      expect(handleClick).toHaveBeenCalledTimes(1)
    })

    it('should not trigger onclick when disabled', async () => {
      const handleClick = vi.fn()
      const { button } = await renderButton({ onclick: handleClick, disabled: true })

      button.click()

      expect(handleClick).not.toHaveBeenCalled()
    })
  })

  describe('HTML button attributes', () => {
    it('should support type attribute', async () => {
      const { button } = await renderButton({ type: 'submit' })
      expect(button.type).toBe('submit')
    })

    it('should support name attribute', async () => {
      const { button } = await renderButton({ name: 'my-button' })
      expect(button.name).toBe('my-button')
    })
  })
})
