import { createComponent } from '@furystack/shades'
import { describe, expect, it } from 'vitest'
import type { BadgeProps } from './badge.js'
import { Badge } from './badge.js'

describe('Badge', () => {
  it('should be defined', () => {
    expect(Badge).toBeDefined()
    expect(typeof Badge).toBe('function')
  })

  it('should create a badge element with default props', () => {
    const el = (<Badge />) as unknown as HTMLElement
    expect(el).toBeDefined()
    expect(el.tagName?.toLowerCase()).toBe('shade-badge')
  })

  it('should pass children as badge content', () => {
    const el = (<Badge>Child</Badge>) as unknown as JSX.Element
    expect(el).toBeDefined()
  })

  it('should set props correctly', () => {
    const el = (<Badge count={5} color="primary" dot max={10} showZero />) as unknown as { props: BadgeProps }
    expect(el.props.count).toBe(5)
    expect(el.props.color).toBe('primary')
    expect(el.props.dot).toBe(true)
    expect(el.props.max).toBe(10)
    expect(el.props.showZero).toBe(true)
  })

  it('should render with a badge indicator', () => {
    const el = (
      <div>
        <Badge count={5}>
          <span>Content</span>
        </Badge>
      </div>
    )
    const badge = el.firstElementChild as JSX.Element
    badge.callConstructed()
    expect(badge.querySelector('.badge-indicator')).not.toBeNull()
  })

  it('should display the count value', () => {
    const el = (
      <div>
        <Badge count={42}>
          <span>Content</span>
        </Badge>
      </div>
    )
    const badge = el.firstElementChild as JSX.Element
    badge.callConstructed()
    const indicator = badge.querySelector('.badge-indicator') as HTMLElement
    expect(indicator.textContent).toBe('42')
  })

  it('should cap count at max and show overflow indicator', () => {
    const el = (
      <div>
        <Badge count={150} max={99}>
          <span>Content</span>
        </Badge>
      </div>
    )
    const badge = el.firstElementChild as JSX.Element
    badge.callConstructed()
    const indicator = badge.querySelector('.badge-indicator') as HTMLElement
    expect(indicator.textContent).toBe('99+')
  })

  it('should use custom max value', () => {
    const el = (
      <div>
        <Badge count={15} max={10}>
          <span>Content</span>
        </Badge>
      </div>
    )
    const badge = el.firstElementChild as JSX.Element
    badge.callConstructed()
    const indicator = badge.querySelector('.badge-indicator') as HTMLElement
    expect(indicator.textContent).toBe('10+')
  })

  it('should not show overflow when count is within max', () => {
    const el = (
      <div>
        <Badge count={5} max={10}>
          <span>Content</span>
        </Badge>
      </div>
    )
    const badge = el.firstElementChild as JSX.Element
    badge.callConstructed()
    const indicator = badge.querySelector('.badge-indicator') as HTMLElement
    expect(indicator.textContent).toBe('5')
  })

  it('should hide when count is 0 and showZero is not set', () => {
    const el = (
      <div>
        <Badge count={0}>
          <span>Content</span>
        </Badge>
      </div>
    )
    const badge = el.firstElementChild as JSX.Element
    badge.callConstructed()
    const indicator = badge.querySelector('.badge-indicator') as HTMLElement
    expect(indicator.hasAttribute('data-hidden')).toBe(true)
  })

  it('should show when count is 0 and showZero is true', () => {
    const el = (
      <div>
        <Badge count={0} showZero>
          <span>Content</span>
        </Badge>
      </div>
    )
    const badge = el.firstElementChild as JSX.Element
    badge.callConstructed()
    const indicator = badge.querySelector('.badge-indicator') as HTMLElement
    expect(indicator.hasAttribute('data-hidden')).toBe(false)
  })

  it('should hide when count is undefined and showZero is not set', () => {
    const el = (
      <div>
        <Badge>
          <span>Content</span>
        </Badge>
      </div>
    )
    const badge = el.firstElementChild as JSX.Element
    badge.callConstructed()
    const indicator = badge.querySelector('.badge-indicator') as HTMLElement
    expect(indicator.hasAttribute('data-hidden')).toBe(true)
  })

  it('should render a dot badge when dot prop is set', () => {
    const el = (
      <div>
        <Badge dot>
          <span>Content</span>
        </Badge>
      </div>
    )
    const badge = el.firstElementChild as JSX.Element
    badge.callConstructed()
    const indicator = badge.querySelector('.badge-indicator') as HTMLElement
    expect(indicator.hasAttribute('data-dot')).toBe(true)
    expect(indicator.textContent).toBe('')
  })

  it('should not hide dot badge even without count', () => {
    const el = (
      <div>
        <Badge dot>
          <span>Content</span>
        </Badge>
      </div>
    )
    const badge = el.firstElementChild as JSX.Element
    badge.callConstructed()
    const indicator = badge.querySelector('.badge-indicator') as HTMLElement
    expect(indicator.hasAttribute('data-hidden')).toBe(false)
  })

  it('should hide badge when visible is false', () => {
    const el = (
      <div>
        <Badge count={5} visible={false}>
          <span>Content</span>
        </Badge>
      </div>
    )
    const badge = el.firstElementChild as JSX.Element
    badge.callConstructed()
    const indicator = badge.querySelector('.badge-indicator') as HTMLElement
    expect(indicator.hasAttribute('data-hidden')).toBe(true)
  })

  it('should set CSS custom properties for palette color', () => {
    const el = (
      <div>
        <Badge count={5} color="primary">
          <span>Content</span>
        </Badge>
      </div>
    )
    const badge = el.firstElementChild as JSX.Element
    badge.callConstructed()
    expect(badge.style.getPropertyValue('--badge-color-main')).toBe('var(--shades-theme-palette-primary-main)')
    expect(badge.style.getPropertyValue('--badge-color-contrast')).toBe(
      'var(--shades-theme-palette-primary-main-contrast)',
    )
  })

  it('should set CSS custom properties for default (error) color when no color prop', () => {
    const el = (
      <div>
        <Badge count={5}>
          <span>Content</span>
        </Badge>
      </div>
    )
    const badge = el.firstElementChild as JSX.Element
    badge.callConstructed()
    expect(badge.style.getPropertyValue('--badge-color-main')).toBe('var(--shades-theme-palette-error-main)')
  })
})
