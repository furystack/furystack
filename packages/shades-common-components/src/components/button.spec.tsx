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
    document.querySelector('style[data-shades-button-spinner]')?.remove()
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
      [Symbol.asyncDispose]: () => injector[Symbol.asyncDispose](),
    }
  }

  describe('rendering', () => {
    it('should render a button element', async () => {
      await usingAsync(await renderButton(), async ({ button }) => {
        expect(button).toBeTruthy()
        expect(button.tagName.toLowerCase()).toBe('button')
        expect(button.getAttribute('is')).toBe('shade-button')
      })
    })

    it('should render children', async () => {
      await usingAsync(await renderButton({}, ['Click me'] as unknown as JSX.Element[]), async ({ button }) => {
        expect(button.textContent).toContain('Click me')
      })
    })
  })

  describe('variants', () => {
    it('should have no data-variant attribute when variant is not specified (flat default)', async () => {
      await usingAsync(await renderButton(), async ({ button }) => {
        expect(button.getAttribute('data-variant')).toBeNull()
      })
    })

    it('should set data-variant="contained" for contained variant', async () => {
      await usingAsync(await renderButton({ variant: 'contained' }), async ({ button }) => {
        expect(button.getAttribute('data-variant')).toBe('contained')
      })
    })

    it('should set data-variant="outlined" for outlined variant', async () => {
      await usingAsync(await renderButton({ variant: 'outlined' }), async ({ button }) => {
        expect(button.getAttribute('data-variant')).toBe('outlined')
      })
    })

    it('should have no data-variant for text variant (same as default)', async () => {
      await usingAsync(await renderButton({ variant: 'text' }), async ({ button }) => {
        expect(button.getAttribute('data-variant')).toBeNull()
      })
    })

    it('should remove data-variant attribute when variant changes to undefined', async () => {
      await usingAsync(new Injector(), async (injector) => {
        const root = document.getElementById('root')!

        const TestComponent = Shade<{ variant?: 'contained' | 'outlined' }>({
          tagName: 'button-test-variant-wrapper',
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
        await usingAsync(await renderButton({ color }), async ({ button }) => {
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
    })

    it('should set default color CSS custom properties when no color is specified', async () => {
      await usingAsync(await renderButton(), async ({ button }) => {
        expect(button.style.getPropertyValue('--btn-color-main')).toBe('var(--shades-theme-text-secondary)')
        expect(button.style.getPropertyValue('--btn-color-main-contrast')).toBe(
          'var(--shades-theme-background-default)',
        )
        expect(button.style.getPropertyValue('--btn-color-light')).toBe('var(--shades-theme-text-primary)')
        expect(button.style.getPropertyValue('--btn-color-dark')).toBe('var(--shades-theme-button-disabled-background)')
        expect(button.style.getPropertyValue('--btn-color-dark-contrast')).toBe('var(--shades-theme-text-primary)')
      })
    })
  })

  describe('variant and color combinations', () => {
    it('should apply both contained variant and primary color', async () => {
      await usingAsync(await renderButton({ variant: 'contained', color: 'primary' }), async ({ button }) => {
        expect(button.getAttribute('data-variant')).toBe('contained')
        expect(button.style.getPropertyValue('--btn-color-main')).toBe('var(--shades-theme-palette-primary-main)')
      })
    })

    it('should apply both outlined variant and error color', async () => {
      await usingAsync(await renderButton({ variant: 'outlined', color: 'error' }), async ({ button }) => {
        expect(button.getAttribute('data-variant')).toBe('outlined')
        expect(button.style.getPropertyValue('--btn-color-main')).toBe('var(--shades-theme-palette-error-main)')
      })
    })
  })

  describe('disabled state', () => {
    it('should be enabled by default', async () => {
      await usingAsync(await renderButton(), async ({ button }) => {
        expect(button.disabled).toBe(false)
      })
    })

    it('should be disabled when disabled prop is set', async () => {
      await usingAsync(await renderButton({ disabled: true }), async ({ button }) => {
        expect(button.disabled).toBe(true)
      })
    })
  })

  describe('custom styles', () => {
    it('should apply custom styles from style prop', async () => {
      await usingAsync(
        await renderButton({
          style: { margin: '20px', padding: '15px' },
        }),
        async ({ button }) => {
          expect(button.style.margin).toBe('20px')
          expect(button.style.padding).toBe('15px')
        },
      )
    })

    it('should merge custom styles with component defaults', async () => {
      await usingAsync(
        await renderButton({
          color: 'primary',
          style: { fontSize: '18px' },
        }),
        async ({ button }) => {
          expect(button.style.fontSize).toBe('18px')
          expect(button.style.getPropertyValue('--btn-color-main')).toBe('var(--shades-theme-palette-primary-main)')
        },
      )
    })
  })

  describe('event handling', () => {
    it('should trigger onclick handler when clicked', async () => {
      const handleClick = vi.fn()
      await usingAsync(await renderButton({ onclick: handleClick }), async ({ button }) => {
        button.click()

        expect(handleClick).toHaveBeenCalledTimes(1)
      })
    })

    it('should not trigger onclick when disabled', async () => {
      const handleClick = vi.fn()
      await usingAsync(await renderButton({ onclick: handleClick, disabled: true }), async ({ button }) => {
        button.click()

        expect(handleClick).not.toHaveBeenCalled()
      })
    })
  })

  describe('HTML button attributes', () => {
    it('should support type attribute', async () => {
      await usingAsync(await renderButton({ type: 'submit' }), async ({ button }) => {
        expect(button.type).toBe('submit')
      })
    })

    it('should support name attribute', async () => {
      await usingAsync(await renderButton({ name: 'my-button' }), async ({ button }) => {
        expect(button.name).toBe('my-button')
      })
    })
  })

  describe('size', () => {
    it('should not set data-size when size is not specified', async () => {
      await usingAsync(await renderButton(), async ({ button }) => {
        expect(button.getAttribute('data-size')).toBeNull()
      })
    })

    it('should not set data-size for medium size (default)', async () => {
      await usingAsync(await renderButton({ size: 'medium' }), async ({ button }) => {
        expect(button.getAttribute('data-size')).toBeNull()
      })
    })

    it('should set data-size="small" for small size', async () => {
      await usingAsync(await renderButton({ size: 'small' }), async ({ button }) => {
        expect(button.getAttribute('data-size')).toBe('small')
      })
    })

    it('should set data-size="large" for large size', async () => {
      await usingAsync(await renderButton({ size: 'large' }), async ({ button }) => {
        expect(button.getAttribute('data-size')).toBe('large')
      })
    })
  })

  describe('danger', () => {
    it('should use error palette colors when danger is true', async () => {
      await usingAsync(await renderButton({ danger: true }), async ({ button }) => {
        expect(button.style.getPropertyValue('--btn-color-main')).toBe('var(--shades-theme-palette-error-main)')
        expect(button.style.getPropertyValue('--btn-color-main-contrast')).toBe(
          'var(--shades-theme-palette-error-main-contrast)',
        )
      })
    })

    it('should override color prop when danger is true', async () => {
      await usingAsync(await renderButton({ danger: true, color: 'primary' }), async ({ button }) => {
        expect(button.style.getPropertyValue('--btn-color-main')).toBe('var(--shades-theme-palette-error-main)')
      })
    })

    it('should use specified color when danger is false', async () => {
      await usingAsync(await renderButton({ danger: false, color: 'primary' }), async ({ button }) => {
        expect(button.style.getPropertyValue('--btn-color-main')).toBe('var(--shades-theme-palette-primary-main)')
      })
    })
  })

  describe('loading', () => {
    it('should set data-loading attribute when loading is true', async () => {
      await usingAsync(await renderButton({ loading: true }), async ({ button }) => {
        expect(button.hasAttribute('data-loading')).toBe(true)
      })
    })

    it('should disable the button when loading is true', async () => {
      await usingAsync(await renderButton({ loading: true }), async ({ button }) => {
        expect(button.disabled).toBe(true)
      })
    })

    it('should render a spinner element when loading', async () => {
      await usingAsync(await renderButton({ loading: true }), async ({ button }) => {
        const spinner = button.querySelector('.shade-btn-spinner')
        expect(spinner).toBeTruthy()
      })
    })

    it('should not render a spinner when not loading', async () => {
      await usingAsync(await renderButton({ loading: false }), async ({ button }) => {
        const spinner = button.querySelector('.shade-btn-spinner')
        expect(spinner).toBeNull()
      })
    })

    it('should inject spinner keyframes stylesheet', async () => {
      await usingAsync(await renderButton({ loading: true }), async () => {
        const style = document.querySelector('style[data-shades-button-spinner]')
        expect(style).toBeTruthy()
        expect(style?.textContent).toContain('shade-btn-spin')
      })
    })

    it('should not set data-loading when loading is false', async () => {
      await usingAsync(await renderButton({ loading: false }), async ({ button }) => {
        expect(button.hasAttribute('data-loading')).toBe(false)
      })
    })
  })

  describe('startIcon and endIcon', () => {
    it('should render startIcon before children', async () => {
      const icon = (<span className="test-start-icon">★</span>) as unknown as JSX.Element
      await usingAsync(
        await renderButton({ startIcon: icon }, ['Label'] as unknown as JSX.Element[]),
        async ({ button }) => {
          const startIcon = button.querySelector('.shade-btn-start-icon')
          expect(startIcon).toBeTruthy()
          expect(startIcon?.querySelector('.test-start-icon')).toBeTruthy()
          expect(button.textContent).toContain('Label')
        },
      )
    })

    it('should render endIcon after children', async () => {
      const icon = (<span className="test-end-icon">→</span>) as unknown as JSX.Element
      await usingAsync(
        await renderButton({ endIcon: icon }, ['Label'] as unknown as JSX.Element[]),
        async ({ button }) => {
          const endIcon = button.querySelector('.shade-btn-end-icon')
          expect(endIcon).toBeTruthy()
          expect(endIcon?.querySelector('.test-end-icon')).toBeTruthy()
        },
      )
    })

    it('should not render startIcon when loading', async () => {
      const icon = (<span className="test-start-icon">★</span>) as unknown as JSX.Element
      await usingAsync(await renderButton({ startIcon: icon, loading: true }), async ({ button }) => {
        expect(button.querySelector('.shade-btn-start-icon')).toBeNull()
        expect(button.querySelector('.shade-btn-spinner')).toBeTruthy()
      })
    })

    it('should not render endIcon when loading', async () => {
      const icon = (<span className="test-end-icon">→</span>) as unknown as JSX.Element
      await usingAsync(await renderButton({ endIcon: icon, loading: true }), async ({ button }) => {
        expect(button.querySelector('.shade-btn-end-icon')).toBeNull()
      })
    })
  })

  describe('combined features', () => {
    it('should support size with variant and color', async () => {
      await usingAsync(
        await renderButton({ size: 'small', variant: 'contained', color: 'primary' }),
        async ({ button }) => {
          expect(button.getAttribute('data-size')).toBe('small')
          expect(button.getAttribute('data-variant')).toBe('contained')
          expect(button.style.getPropertyValue('--btn-color-main')).toBe('var(--shades-theme-palette-primary-main)')
        },
      )
    })

    it('should support danger with contained variant', async () => {
      await usingAsync(await renderButton({ danger: true, variant: 'contained' }), async ({ button }) => {
        expect(button.getAttribute('data-variant')).toBe('contained')
        expect(button.style.getPropertyValue('--btn-color-main')).toBe('var(--shades-theme-palette-error-main)')
      })
    })

    it('should support loading with variant and size', async () => {
      await usingAsync(
        await renderButton({ loading: true, variant: 'outlined', size: 'large' }),
        async ({ button }) => {
          expect(button.hasAttribute('data-loading')).toBe(true)
          expect(button.getAttribute('data-variant')).toBe('outlined')
          expect(button.getAttribute('data-size')).toBe('large')
          expect(button.disabled).toBe(true)
        },
      )
    })
  })
})
