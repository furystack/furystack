import { Injector } from '@furystack/inject'
import { createComponent, initializeShadeRoot } from '@furystack/shades'
import { sleepAsync, usingAsync } from '@furystack/utils'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import type { TypographyProps, TypographyVariant } from './typography.js'
import { Typography } from './typography.js'

describe('Typography', () => {
  beforeEach(() => {
    document.body.innerHTML = '<div id="root"></div>'
  })

  afterEach(() => {
    document.body.innerHTML = ''
  })

  const renderTypography = async (props: TypographyProps = {}, children?: JSX.Element[]) => {
    const injector = new Injector()
    const root = document.getElementById('root')!
    initializeShadeRoot({
      injector,
      rootElement: root,
      jsxElement: <Typography {...props}>{children}</Typography>,
    })
    await sleepAsync(50)
    return {
      injector,
      element: root.querySelector('shade-typography') as HTMLElement,
      [Symbol.asyncDispose]: () => injector[Symbol.asyncDispose](),
    }
  }

  describe('rendering', () => {
    it('should render a shade-typography element', async () => {
      await usingAsync(await renderTypography(), async ({ element }) => {
        expect(element).toBeTruthy()
        expect(element.tagName.toLowerCase()).toBe('shade-typography')
      })
    })

    it('should render children text', async () => {
      await usingAsync(await renderTypography({}, ['Hello World'] as unknown as JSX.Element[]), async ({ element }) => {
        expect(element.textContent).toContain('Hello World')
      })
    })
  })

  describe('variants', () => {
    const headingVariants: TypographyVariant[] = ['h1', 'h2', 'h3', 'h4', 'h5', 'h6']
    const bodyVariants: TypographyVariant[] = ['body1', 'body2']
    const subtitleVariants: TypographyVariant[] = ['subtitle1', 'subtitle2']
    const inlineVariants: TypographyVariant[] = ['caption', 'overline']

    it('should default to body1 variant', async () => {
      await usingAsync(await renderTypography(), async ({ element }) => {
        expect(element.getAttribute('data-variant')).toBe('body1')
        const inner = element.querySelector('.typo-inner')
        expect(inner?.tagName.toLowerCase()).toBe('p')
      })
    })

    headingVariants.forEach((variant) => {
      it(`should render ${variant} tag for variant="${variant}"`, async () => {
        await usingAsync(await renderTypography({ variant }), async ({ element }) => {
          expect(element.getAttribute('data-variant')).toBe(variant)
          const inner = element.querySelector('.typo-inner')
          expect(inner?.tagName.toLowerCase()).toBe(variant)
        })
      })
    })

    bodyVariants.forEach((variant) => {
      it(`should render p tag for variant="${variant}"`, async () => {
        await usingAsync(await renderTypography({ variant }), async ({ element }) => {
          const inner = element.querySelector('.typo-inner')
          expect(inner?.tagName.toLowerCase()).toBe('p')
        })
      })
    })

    subtitleVariants.forEach((variant) => {
      it(`should render h6 tag for variant="${variant}"`, async () => {
        await usingAsync(await renderTypography({ variant }), async ({ element }) => {
          const inner = element.querySelector('.typo-inner')
          expect(inner?.tagName.toLowerCase()).toBe('h6')
        })
      })
    })

    inlineVariants.forEach((variant) => {
      it(`should render span tag for variant="${variant}"`, async () => {
        await usingAsync(await renderTypography({ variant }), async ({ element }) => {
          const inner = element.querySelector('.typo-inner')
          expect(inner?.tagName.toLowerCase()).toBe('span')
        })
      })
    })
  })

  describe('colors', () => {
    it('should use textPrimary color by default', async () => {
      await usingAsync(await renderTypography(), async ({ element }) => {
        expect(element.style.getPropertyValue('--typo-color')).toBe('var(--shades-theme-text-primary)')
      })
    })

    it('should set textSecondary color', async () => {
      await usingAsync(await renderTypography({ color: 'textSecondary' }), async ({ element }) => {
        expect(element.style.getPropertyValue('--typo-color')).toBe('var(--shades-theme-text-secondary)')
      })
    })

    it('should set textDisabled color', async () => {
      await usingAsync(await renderTypography({ color: 'textDisabled' }), async ({ element }) => {
        expect(element.style.getPropertyValue('--typo-color')).toBe('var(--shades-theme-text-disabled)')
      })
    })

    it('should set palette primary color', async () => {
      await usingAsync(await renderTypography({ color: 'primary' }), async ({ element }) => {
        expect(element.style.getPropertyValue('--typo-color')).toBe('var(--shades-theme-palette-primary-main)')
      })
    })

    it('should set palette error color', async () => {
      await usingAsync(await renderTypography({ color: 'error' }), async ({ element }) => {
        expect(element.style.getPropertyValue('--typo-color')).toBe('var(--shades-theme-palette-error-main)')
      })
    })
  })

  describe('ellipsis', () => {
    it('should set data-ellipsis="true" for boolean ellipsis', async () => {
      await usingAsync(await renderTypography({ ellipsis: true }), async ({ element }) => {
        expect(element.getAttribute('data-ellipsis')).toBe('true')
      })
    })

    it('should set data-ellipsis="multiline" for numeric ellipsis', async () => {
      await usingAsync(await renderTypography({ ellipsis: 3 }), async ({ element }) => {
        expect(element.getAttribute('data-ellipsis')).toBe('multiline')
        const inner = element.querySelector('.typo-inner') as HTMLElement
        expect(inner.style.webkitLineClamp).toBe('3')
      })
    })

    it('should not set data-ellipsis when not specified', async () => {
      await usingAsync(await renderTypography(), async ({ element }) => {
        expect(element.getAttribute('data-ellipsis')).toBeNull()
      })
    })
  })

  describe('copyable', () => {
    it('should render copy button when copyable is true', async () => {
      await usingAsync(
        await renderTypography({ copyable: true }, ['Copy me'] as unknown as JSX.Element[]),
        async ({ element }) => {
          const copyBtn = element.querySelector('.typo-copy-btn')
          expect(copyBtn).toBeTruthy()
        },
      )
    })

    it('should not render copy button when copyable is false or undefined', async () => {
      await usingAsync(await renderTypography(), async ({ element }) => {
        const copyBtn = element.querySelector('.typo-copy-btn')
        expect(copyBtn).toBeNull()
      })
    })

    it('should call clipboard API when copy button is clicked', async () => {
      const writeText = vi.fn().mockResolvedValue(undefined)
      Object.assign(navigator, { clipboard: { writeText } })

      await usingAsync(
        await renderTypography({ copyable: true }, ['Copy this text'] as unknown as JSX.Element[]),
        async ({ element }) => {
          const copyBtn = element.querySelector('.typo-copy-btn') as HTMLButtonElement
          copyBtn.click()
          expect(writeText).toHaveBeenCalledWith(expect.stringContaining('Copy this text'))
        },
      )
    })
  })

  describe('gutterBottom', () => {
    it('should set data-gutter-bottom attribute when gutterBottom is true', async () => {
      await usingAsync(await renderTypography({ gutterBottom: true }), async ({ element }) => {
        expect(element.hasAttribute('data-gutter-bottom')).toBe(true)
      })
    })

    it('should not set data-gutter-bottom attribute when gutterBottom is falsy', async () => {
      await usingAsync(await renderTypography(), async ({ element }) => {
        expect(element.hasAttribute('data-gutter-bottom')).toBe(false)
      })
    })
  })

  describe('align', () => {
    const alignments = ['left', 'center', 'right', 'justify'] as const

    alignments.forEach((align) => {
      it(`should set data-align="${align}"`, async () => {
        await usingAsync(await renderTypography({ align }), async ({ element }) => {
          expect(element.getAttribute('data-align')).toBe(align)
        })
      })
    })

    it('should not set data-align when not specified', async () => {
      await usingAsync(await renderTypography(), async ({ element }) => {
        expect(element.getAttribute('data-align')).toBeNull()
      })
    })
  })

  describe('custom styles', () => {
    it('should apply custom styles from style prop', async () => {
      await usingAsync(await renderTypography({ style: { margin: '20px', padding: '10px' } }), async ({ element }) => {
        expect(element.style.margin).toBe('20px')
        expect(element.style.padding).toBe('10px')
      })
    })
  })

  describe('overline variant', () => {
    it('should apply uppercase text transform for overline', async () => {
      await usingAsync(await renderTypography({ variant: 'overline' }), async ({ element }) => {
        expect(element.style.textTransform).toBe('uppercase')
      })
    })
  })
})
