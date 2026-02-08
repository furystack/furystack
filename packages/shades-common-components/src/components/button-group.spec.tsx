import { Injector } from '@furystack/inject'
import { createComponent, initializeShadeRoot } from '@furystack/shades'
import { sleepAsync, usingAsync } from '@furystack/utils'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import {
  ButtonGroup,
  SegmentedControl,
  ToggleButton,
  ToggleButtonGroup,
  type SegmentedControlOption,
} from './button-group.js'
import { Button } from './button.js'

describe('ButtonGroup', () => {
  beforeEach(() => {
    document.body.innerHTML = '<div id="root"></div>'
  })

  afterEach(() => {
    document.body.innerHTML = ''
  })

  const renderButtonGroup = async (props: Parameters<typeof ButtonGroup>[0] = {}, children?: JSX.Element[]) => {
    const injector = new Injector()
    const root = document.getElementById('root')!
    initializeShadeRoot({
      injector,
      rootElement: root,
      jsxElement: <ButtonGroup {...props}>{children}</ButtonGroup>,
    })
    await sleepAsync(50)
    return {
      injector,
      group: root.querySelector('shade-button-group') as HTMLElement,
      [Symbol.asyncDispose]: () => injector[Symbol.asyncDispose](),
    }
  }

  describe('rendering', () => {
    it('should render a button group element', async () => {
      await usingAsync(await renderButtonGroup(), async ({ group }) => {
        expect(group).toBeTruthy()
        expect(group.tagName.toLowerCase()).toBe('shade-button-group')
      })
    })

    it('should have role="group"', async () => {
      await usingAsync(await renderButtonGroup(), async ({ group }) => {
        expect(group.getAttribute('role')).toBe('group')
      })
    })

    it('should render children', async () => {
      await usingAsync(
        await renderButtonGroup({}, [<Button>First</Button>, <Button>Second</Button>] as unknown as JSX.Element[]),
        async ({ group }) => {
          const buttons = group.querySelectorAll('button[is="shade-button"]')
          expect(buttons.length).toBe(2)
        },
      )
    })
  })

  describe('orientation', () => {
    it('should default to horizontal orientation', async () => {
      await usingAsync(await renderButtonGroup(), async ({ group }) => {
        expect(group.getAttribute('data-orientation')).toBe('horizontal')
      })
    })

    it('should support vertical orientation', async () => {
      await usingAsync(await renderButtonGroup({ orientation: 'vertical' }), async ({ group }) => {
        expect(group.getAttribute('data-orientation')).toBe('vertical')
      })
    })
  })

  describe('variant', () => {
    it('should not set data-variant when variant is not specified', async () => {
      await usingAsync(await renderButtonGroup(), async ({ group }) => {
        expect(group.getAttribute('data-variant')).toBeNull()
      })
    })

    it('should set data-variant for contained', async () => {
      await usingAsync(await renderButtonGroup({ variant: 'contained' }), async ({ group }) => {
        expect(group.getAttribute('data-variant')).toBe('contained')
      })
    })

    it('should set data-variant for outlined', async () => {
      await usingAsync(await renderButtonGroup({ variant: 'outlined' }), async ({ group }) => {
        expect(group.getAttribute('data-variant')).toBe('outlined')
      })
    })
  })

  describe('color', () => {
    it('should not set data-color when color is not specified', async () => {
      await usingAsync(await renderButtonGroup(), async ({ group }) => {
        expect(group.getAttribute('data-color')).toBeNull()
      })
    })

    it('should set data-color for primary', async () => {
      await usingAsync(await renderButtonGroup({ color: 'primary' }), async ({ group }) => {
        expect(group.getAttribute('data-color')).toBe('primary')
      })
    })
  })

  describe('disabled', () => {
    it('should not set data-disabled when not disabled', async () => {
      await usingAsync(await renderButtonGroup(), async ({ group }) => {
        expect(group.hasAttribute('data-disabled')).toBe(false)
      })
    })

    it('should set data-disabled when disabled', async () => {
      await usingAsync(await renderButtonGroup({ disabled: true }), async ({ group }) => {
        expect(group.hasAttribute('data-disabled')).toBe(true)
      })
    })
  })

  describe('custom styles', () => {
    it('should apply custom styles', async () => {
      await usingAsync(await renderButtonGroup({ style: { gap: '4px' } }), async ({ group }) => {
        expect(group.style.gap).toBe('4px')
      })
    })
  })
})

describe('ToggleButtonGroup', () => {
  beforeEach(() => {
    document.body.innerHTML = '<div id="root"></div>'
  })

  afterEach(() => {
    document.body.innerHTML = ''
  })

  const renderToggleGroup = async (props: Parameters<typeof ToggleButtonGroup>[0] = {}, children?: JSX.Element[]) => {
    const injector = new Injector()
    const root = document.getElementById('root')!
    initializeShadeRoot({
      injector,
      rootElement: root,
      jsxElement: <ToggleButtonGroup {...props}>{children}</ToggleButtonGroup>,
    })
    await sleepAsync(100)
    return {
      injector,
      group: root.querySelector('shade-toggle-button-group') as HTMLElement,
      [Symbol.asyncDispose]: () => injector[Symbol.asyncDispose](),
    }
  }

  describe('rendering', () => {
    it('should render a toggle button group', async () => {
      await usingAsync(await renderToggleGroup(), async ({ group }) => {
        expect(group).toBeTruthy()
        expect(group.getAttribute('role')).toBe('group')
      })
    })

    it('should render toggle button children', async () => {
      await usingAsync(
        await renderToggleGroup({}, [
          <ToggleButton value="a">A</ToggleButton>,
          <ToggleButton value="b">B</ToggleButton>,
          <ToggleButton value="c">C</ToggleButton>,
        ] as unknown as JSX.Element[]),
        async ({ group }) => {
          const buttons = group.querySelectorAll('button[data-value]')
          expect(buttons.length).toBe(3)
        },
      )
    })
  })

  describe('exclusive mode', () => {
    it('should call onValueChange with clicked value in exclusive mode', async () => {
      const handleChange = vi.fn()
      await usingAsync(
        await renderToggleGroup({ exclusive: true, value: '', onValueChange: handleChange }, [
          <ToggleButton value="left">Left</ToggleButton>,
          <ToggleButton value="center">Center</ToggleButton>,
          <ToggleButton value="right">Right</ToggleButton>,
        ] as unknown as JSX.Element[]),
        async ({ group }) => {
          const centerBtn = group.querySelector('button[data-value="center"]') as HTMLButtonElement
          centerBtn.click()
          expect(handleChange).toHaveBeenCalledWith('center')
        },
      )
    })

    it('should deselect in exclusive mode when clicking the already selected value', async () => {
      const handleChange = vi.fn()
      await usingAsync(
        await renderToggleGroup({ exclusive: true, value: 'center', onValueChange: handleChange }, [
          <ToggleButton value="left">Left</ToggleButton>,
          <ToggleButton value="center">Center</ToggleButton>,
          <ToggleButton value="right">Right</ToggleButton>,
        ] as unknown as JSX.Element[]),
        async ({ group }) => {
          const centerBtn = group.querySelector('button[data-value="center"]') as HTMLButtonElement
          centerBtn.click()
          expect(handleChange).toHaveBeenCalledWith('')
        },
      )
    })
  })

  describe('multi-select mode', () => {
    it('should add value to selection in multi-select mode', async () => {
      const handleChange = vi.fn()
      await usingAsync(
        await renderToggleGroup({ value: ['bold'], onValueChange: handleChange }, [
          <ToggleButton value="bold">B</ToggleButton>,
          <ToggleButton value="italic">I</ToggleButton>,
          <ToggleButton value="underline">U</ToggleButton>,
        ] as unknown as JSX.Element[]),
        async ({ group }) => {
          const italicBtn = group.querySelector('button[data-value="italic"]') as HTMLButtonElement
          italicBtn.click()
          expect(handleChange).toHaveBeenCalledWith(['bold', 'italic'])
        },
      )
    })

    it('should remove value from selection in multi-select mode', async () => {
      const handleChange = vi.fn()
      await usingAsync(
        await renderToggleGroup({ value: ['bold', 'italic'], onValueChange: handleChange }, [
          <ToggleButton value="bold">B</ToggleButton>,
          <ToggleButton value="italic">I</ToggleButton>,
          <ToggleButton value="underline">U</ToggleButton>,
        ] as unknown as JSX.Element[]),
        async ({ group }) => {
          const boldBtn = group.querySelector('button[data-value="bold"]') as HTMLButtonElement
          boldBtn.click()
          expect(handleChange).toHaveBeenCalledWith(['italic'])
        },
      )
    })
  })

  describe('selected state', () => {
    it('should mark the selected button with data-selected in exclusive mode', async () => {
      await usingAsync(
        await renderToggleGroup({ exclusive: true, value: 'center' }, [
          <ToggleButton value="left">Left</ToggleButton>,
          <ToggleButton value="center">Center</ToggleButton>,
          <ToggleButton value="right">Right</ToggleButton>,
        ] as unknown as JSX.Element[]),
        async ({ group }) => {
          // Wait for requestAnimationFrame
          await sleepAsync(50)
          const centerBtn = group.querySelector('button[data-value="center"]') as HTMLButtonElement
          const leftBtn = group.querySelector('button[data-value="left"]') as HTMLButtonElement
          expect(centerBtn.hasAttribute('data-selected')).toBe(true)
          expect(leftBtn.hasAttribute('data-selected')).toBe(false)
        },
      )
    })

    it('should mark multiple selected buttons in multi-select mode', async () => {
      await usingAsync(
        await renderToggleGroup({ value: ['bold', 'underline'] }, [
          <ToggleButton value="bold">B</ToggleButton>,
          <ToggleButton value="italic">I</ToggleButton>,
          <ToggleButton value="underline">U</ToggleButton>,
        ] as unknown as JSX.Element[]),
        async ({ group }) => {
          await sleepAsync(50)
          const boldBtn = group.querySelector('button[data-value="bold"]') as HTMLButtonElement
          const italicBtn = group.querySelector('button[data-value="italic"]') as HTMLButtonElement
          const underlineBtn = group.querySelector('button[data-value="underline"]') as HTMLButtonElement
          expect(boldBtn.hasAttribute('data-selected')).toBe(true)
          expect(italicBtn.hasAttribute('data-selected')).toBe(false)
          expect(underlineBtn.hasAttribute('data-selected')).toBe(true)
        },
      )
    })
  })

  describe('orientation', () => {
    it('should default to horizontal', async () => {
      await usingAsync(await renderToggleGroup(), async ({ group }) => {
        expect(group.getAttribute('data-orientation')).toBe('horizontal')
      })
    })

    it('should support vertical', async () => {
      await usingAsync(await renderToggleGroup({ orientation: 'vertical' }), async ({ group }) => {
        expect(group.getAttribute('data-orientation')).toBe('vertical')
      })
    })
  })

  describe('color', () => {
    it('should set default color CSS variable when no color specified', async () => {
      await usingAsync(await renderToggleGroup(), async ({ group }) => {
        expect(group.style.getPropertyValue('--toggle-color-main')).toBe('var(--shades-theme-text-secondary)')
      })
    })

    it('should set color CSS variable for a palette color', async () => {
      await usingAsync(await renderToggleGroup({ color: 'primary' }), async ({ group }) => {
        expect(group.style.getPropertyValue('--toggle-color-main')).toBe('var(--shades-theme-palette-primary-main)')
      })
    })
  })
})

describe('SegmentedControl', () => {
  beforeEach(() => {
    document.body.innerHTML = '<div id="root"></div>'
  })

  afterEach(() => {
    document.body.innerHTML = ''
  })

  const defaultOptions: SegmentedControlOption[] = [
    { value: 'daily', label: 'Daily' },
    { value: 'weekly', label: 'Weekly' },
    { value: 'monthly', label: 'Monthly' },
  ]

  const renderSegmented = async (props: Partial<Parameters<typeof SegmentedControl>[0]> = {}) => {
    const injector = new Injector()
    const root = document.getElementById('root')!
    initializeShadeRoot({
      injector,
      rootElement: root,
      jsxElement: <SegmentedControl options={defaultOptions} {...props} />,
    })
    await sleepAsync(50)
    return {
      injector,
      control: root.querySelector('shade-segmented-control') as HTMLElement,
      [Symbol.asyncDispose]: () => injector[Symbol.asyncDispose](),
    }
  }

  describe('rendering', () => {
    it('should render a segmented control', async () => {
      await usingAsync(await renderSegmented(), async ({ control }) => {
        expect(control).toBeTruthy()
        expect(control.getAttribute('role')).toBe('radiogroup')
      })
    })

    it('should render all options as buttons', async () => {
      await usingAsync(await renderSegmented(), async ({ control }) => {
        const buttons = control.querySelectorAll('.segmented-option')
        expect(buttons.length).toBe(3)
      })
    })

    it('should render option labels', async () => {
      await usingAsync(await renderSegmented(), async ({ control }) => {
        const buttons = control.querySelectorAll('.segmented-option')
        expect(buttons[0].textContent).toContain('Daily')
        expect(buttons[1].textContent).toContain('Weekly')
        expect(buttons[2].textContent).toContain('Monthly')
      })
    })
  })

  describe('selection', () => {
    it('should mark the selected option with data-selected', async () => {
      await usingAsync(await renderSegmented({ value: 'weekly' }), async ({ control }) => {
        const buttons = control.querySelectorAll('.segmented-option')
        expect(buttons[0].hasAttribute('data-selected')).toBe(false)
        expect(buttons[1].hasAttribute('data-selected')).toBe(true)
        expect(buttons[2].hasAttribute('data-selected')).toBe(false)
      })
    })

    it('should set aria-checked on the selected option', async () => {
      await usingAsync(await renderSegmented({ value: 'daily' }), async ({ control }) => {
        const buttons = control.querySelectorAll('.segmented-option')
        expect(buttons[0].getAttribute('aria-checked')).toBe('true')
        expect(buttons[1].getAttribute('aria-checked')).toBe('false')
      })
    })

    it('should call onValueChange when an option is clicked', async () => {
      const handleChange = vi.fn()
      await usingAsync(await renderSegmented({ value: 'daily', onValueChange: handleChange }), async ({ control }) => {
        const monthlyBtn = control.querySelectorAll('.segmented-option')[2] as HTMLButtonElement
        monthlyBtn.click()
        expect(handleChange).toHaveBeenCalledWith('monthly')
      })
    })

    it('should not call onValueChange when clicking the already selected option', async () => {
      const handleChange = vi.fn()
      await usingAsync(await renderSegmented({ value: 'daily', onValueChange: handleChange }), async ({ control }) => {
        const dailyBtn = control.querySelectorAll('.segmented-option')[0] as HTMLButtonElement
        dailyBtn.click()
        expect(handleChange).not.toHaveBeenCalled()
      })
    })
  })

  describe('disabled', () => {
    it('should disable all options when disabled', async () => {
      await usingAsync(await renderSegmented({ disabled: true }), async ({ control }) => {
        const buttons = control.querySelectorAll('.segmented-option')
        buttons.forEach((btn) => {
          expect((btn as HTMLButtonElement).disabled).toBe(true)
        })
      })
    })

    it('should disable individual options', async () => {
      const options: SegmentedControlOption[] = [
        { value: 'a', label: 'A' },
        { value: 'b', label: 'B', disabled: true },
        { value: 'c', label: 'C' },
      ]
      await usingAsync(await renderSegmented({ options }), async ({ control }) => {
        const buttons = control.querySelectorAll('.segmented-option')
        expect((buttons[0] as HTMLButtonElement).disabled).toBe(false)
        expect((buttons[1] as HTMLButtonElement).disabled).toBe(true)
        expect((buttons[2] as HTMLButtonElement).disabled).toBe(false)
      })
    })

    it('should not call onValueChange when a disabled option is clicked', async () => {
      const handleChange = vi.fn()
      const options: SegmentedControlOption[] = [
        { value: 'a', label: 'A' },
        { value: 'b', label: 'B', disabled: true },
      ]
      await usingAsync(await renderSegmented({ options, onValueChange: handleChange }), async ({ control }) => {
        const disabledBtn = control.querySelectorAll('.segmented-option')[1] as HTMLButtonElement
        disabledBtn.click()
        expect(handleChange).not.toHaveBeenCalled()
      })
    })
  })

  describe('size', () => {
    it('should not set data-size by default', async () => {
      await usingAsync(await renderSegmented(), async ({ control }) => {
        expect(control.hasAttribute('data-size')).toBe(false)
      })
    })

    it('should set data-size="small" for small size', async () => {
      await usingAsync(await renderSegmented({ size: 'small' }), async ({ control }) => {
        expect(control.getAttribute('data-size')).toBe('small')
      })
    })
  })

  describe('color', () => {
    it('should set default primary color CSS variable', async () => {
      await usingAsync(await renderSegmented(), async ({ control }) => {
        expect(control.style.getPropertyValue('--seg-color-main')).toBe('var(--shades-theme-palette-primary-main)')
      })
    })

    it('should set color CSS variable for a palette color', async () => {
      await usingAsync(await renderSegmented({ color: 'secondary' }), async ({ control }) => {
        expect(control.style.getPropertyValue('--seg-color-main')).toBe('var(--shades-theme-palette-secondary-main)')
      })
    })
  })

  describe('custom styles', () => {
    it('should apply custom styles', async () => {
      await usingAsync(await renderSegmented({ style: { margin: '10px' } }), async ({ control }) => {
        expect(control.style.margin).toBe('10px')
      })
    })
  })
})
