import { createComponent } from '@furystack/shades'
import { describe, expect, it } from 'vitest'
import { Tooltip } from './tooltip.js'

describe('Tooltip', () => {
  it('should be defined', () => {
    expect(Tooltip).toBeDefined()
    expect(typeof Tooltip).toBe('function')
  })

  it('should create a tooltip element with default props', () => {
    const el = (<Tooltip title="Hello" />) as unknown as HTMLElement
    expect(el).toBeDefined()
    expect(el.tagName?.toLowerCase()).toBe('shade-tooltip')
  })

  it('should render title content inside the popup', () => {
    const el = (
      <div>
        <Tooltip title="My Tooltip">
          <span>Trigger</span>
        </Tooltip>
      </div>
    )
    const tooltip = el.firstElementChild as JSX.Element
    tooltip.callConstructed()
    const popup = tooltip.querySelector('.tooltip-popup') as HTMLElement
    expect(popup.textContent).toContain('My Tooltip')
  })

  it('should set data-placement when placement prop is provided', () => {
    const el = (
      <div>
        <Tooltip title="Tip" placement="bottom">
          <span>Trigger</span>
        </Tooltip>
      </div>
    )
    const tooltip = el.firstElementChild as JSX.Element
    tooltip.callConstructed()
    expect(tooltip.getAttribute('data-placement')).toBe('bottom')
  })

  it('should render a tooltip-popup with role="tooltip"', () => {
    const el = (
      <div>
        <Tooltip title="Tip">
          <span>Hover me</span>
        </Tooltip>
      </div>
    )
    const tooltip = el.firstElementChild as JSX.Element
    tooltip.callConstructed()
    const popup = tooltip.querySelector('.tooltip-popup') as HTMLElement
    expect(popup).toBeDefined()
    expect(popup).not.toBeNull()
    expect(popup.getAttribute('role')).toBe('tooltip')
  })

  it('should render the title content inside the popup', () => {
    const el = (
      <div>
        <Tooltip title="Hello World">
          <span>Trigger</span>
        </Tooltip>
      </div>
    )
    const tooltip = el.firstElementChild as JSX.Element
    tooltip.callConstructed()
    const popup = tooltip.querySelector('.tooltip-popup') as HTMLElement
    expect(popup.textContent).toContain('Hello World')
  })

  it('should render an arrow element', () => {
    const el = (
      <div>
        <Tooltip title="Tip">
          <span>Trigger</span>
        </Tooltip>
      </div>
    )
    const tooltip = el.firstElementChild as JSX.Element
    tooltip.callConstructed()
    const arrow = tooltip.querySelector('.tooltip-arrow')
    expect(arrow).not.toBeNull()
  })

  it('should set data-placement attribute when placement is provided', () => {
    const el = (
      <div>
        <Tooltip title="Tip" placement="bottom">
          <span>Trigger</span>
        </Tooltip>
      </div>
    )
    const tooltip = el.firstElementChild as JSX.Element
    tooltip.callConstructed()
    expect(tooltip.getAttribute('data-placement')).toBe('bottom')
  })

  it('should not set data-placement attribute when placement is not provided', () => {
    const el = (
      <div>
        <Tooltip title="Tip">
          <span>Trigger</span>
        </Tooltip>
      </div>
    )
    const tooltip = el.firstElementChild as JSX.Element
    tooltip.callConstructed()
    expect(tooltip.hasAttribute('data-placement')).toBe(false)
  })

  it('should set data-placement for each valid placement', () => {
    const placements = ['top', 'bottom', 'left', 'right'] as const
    for (const placement of placements) {
      const el = (
        <div>
          <Tooltip title="Tip" placement={placement}>
            <span>Trigger</span>
          </Tooltip>
        </div>
      )
      const tooltip = el.firstElementChild as JSX.Element
      tooltip.callConstructed()
      expect(tooltip.getAttribute('data-placement')).toBe(placement)
    }
  })

  it('should set data-disabled attribute when disabled', () => {
    const el = (
      <div>
        <Tooltip title="Tip" disabled>
          <span>Trigger</span>
        </Tooltip>
      </div>
    )
    const tooltip = el.firstElementChild as JSX.Element
    tooltip.callConstructed()
    expect(tooltip.hasAttribute('data-disabled')).toBe(true)
  })

  it('should not set data-disabled attribute when not disabled', () => {
    const el = (
      <div>
        <Tooltip title="Tip">
          <span>Trigger</span>
        </Tooltip>
      </div>
    )
    const tooltip = el.firstElementChild as JSX.Element
    tooltip.callConstructed()
    expect(tooltip.hasAttribute('data-disabled')).toBe(false)
  })

  it('should set --tooltip-delay CSS variable when delay is provided', () => {
    const el = (
      <div>
        <Tooltip title="Tip" delay={300}>
          <span>Trigger</span>
        </Tooltip>
      </div>
    )
    const tooltip = el.firstElementChild as JSX.Element
    tooltip.callConstructed()
    expect(tooltip.style.getPropertyValue('--tooltip-delay')).toBe('300ms')
  })

  it('should not set --tooltip-delay CSS variable when delay is 0', () => {
    const el = (
      <div>
        <Tooltip title="Tip" delay={0}>
          <span>Trigger</span>
        </Tooltip>
      </div>
    )
    const tooltip = el.firstElementChild as JSX.Element
    tooltip.callConstructed()
    expect(tooltip.style.getPropertyValue('--tooltip-delay')).toBe('')
  })

  it('should not set --tooltip-delay CSS variable when delay is not provided', () => {
    const el = (
      <div>
        <Tooltip title="Tip">
          <span>Trigger</span>
        </Tooltip>
      </div>
    )
    const tooltip = el.firstElementChild as JSX.Element
    tooltip.callConstructed()
    expect(tooltip.style.getPropertyValue('--tooltip-delay')).toBe('')
  })

  it('should render children as trigger content', () => {
    const el = (
      <div>
        <Tooltip title="Tip">
          <button>Click me</button>
        </Tooltip>
      </div>
    )
    const tooltip = el.firstElementChild as JSX.Element
    tooltip.callConstructed()
    const button = tooltip.querySelector('button')
    expect(button).not.toBeNull()
    expect(button?.textContent).toBe('Click me')
  })
})
