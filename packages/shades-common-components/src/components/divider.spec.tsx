import { createComponent, flushUpdates } from '@furystack/shades'
import { describe, expect, it } from 'vitest'
import { Divider } from './divider.js'

describe('Divider', () => {
  it('should be defined', () => {
    expect(Divider).toBeDefined()
    expect(typeof Divider).toBe('function')
  })

  it('should create a divider element with default props', () => {
    const el = (<Divider />) as unknown as HTMLElement
    expect(el).toBeDefined()
    expect(el.tagName?.toLowerCase()).toBe('shade-divider')
  })

  it('should set role="separator" by default', async () => {
    const el = (
      <div>
        <Divider />
      </div>
    )
    const divider = el.firstElementChild as JSX.Element
    divider.updateComponent()
    await flushUpdates()
    expect(divider.getAttribute('role')).toBe('separator')
  })

  it('should render as horizontal by default (no data-orientation)', async () => {
    const el = (
      <div>
        <Divider />
      </div>
    )
    const divider = el.firstElementChild as JSX.Element
    divider.updateComponent()
    await flushUpdates()
    expect(divider.hasAttribute('data-orientation')).toBe(false)
  })

  it('should set data-orientation="vertical" when orientation is vertical', async () => {
    const el = (
      <div>
        <Divider orientation="vertical" />
      </div>
    )
    const divider = el.firstElementChild as JSX.Element
    divider.updateComponent()
    await flushUpdates()
    expect(divider.getAttribute('data-orientation')).toBe('vertical')
    expect(divider.getAttribute('aria-orientation')).toBe('vertical')
  })

  it('should set data-variant for inset variant', async () => {
    const el = (
      <div>
        <Divider variant="inset" />
      </div>
    )
    const divider = el.firstElementChild as JSX.Element
    divider.updateComponent()
    await flushUpdates()
    expect(divider.getAttribute('data-variant')).toBe('inset')
  })

  it('should set data-variant for middle variant', async () => {
    const el = (
      <div>
        <Divider variant="middle" />
      </div>
    )
    const divider = el.firstElementChild as JSX.Element
    divider.updateComponent()
    await flushUpdates()
    expect(divider.getAttribute('data-variant')).toBe('middle')
  })

  it('should not set data-variant for full variant', async () => {
    const el = (
      <div>
        <Divider variant="full" />
      </div>
    )
    const divider = el.firstElementChild as JSX.Element
    divider.updateComponent()
    await flushUpdates()
    expect(divider.hasAttribute('data-variant')).toBe(false)
  })

  it('should not set data-variant when no variant is specified', async () => {
    const el = (
      <div>
        <Divider />
      </div>
    )
    const divider = el.firstElementChild as JSX.Element
    divider.updateComponent()
    await flushUpdates()
    expect(divider.hasAttribute('data-variant')).toBe(false)
  })

  it('should set data-has-children when children are provided', async () => {
    const el = (
      <div>
        <Divider>Section</Divider>
      </div>
    )
    const divider = el.firstElementChild as JSX.Element
    divider.updateComponent()
    await flushUpdates()
    expect(divider.hasAttribute('data-has-children')).toBe(true)
  })

  it('should not set data-has-children when no children', async () => {
    const el = (
      <div>
        <Divider />
      </div>
    )
    const divider = el.firstElementChild as JSX.Element
    divider.updateComponent()
    await flushUpdates()
    expect(divider.hasAttribute('data-has-children')).toBe(false)
  })

  it('should render children inside a divider-text span', async () => {
    const el = (
      <div>
        <Divider>OR</Divider>
      </div>
    )
    const divider = el.firstElementChild as JSX.Element
    divider.updateComponent()
    await flushUpdates()
    const textSpan = divider.querySelector('.divider-text')
    expect(textSpan).not.toBeNull()
  })

  it('should set data-text-align for left alignment', async () => {
    const el = (
      <div>
        <Divider textAlign="left">Section</Divider>
      </div>
    )
    const divider = el.firstElementChild as JSX.Element
    divider.updateComponent()
    await flushUpdates()
    expect(divider.getAttribute('data-text-align')).toBe('left')
  })

  it('should set data-text-align for right alignment', async () => {
    const el = (
      <div>
        <Divider textAlign="right">Section</Divider>
      </div>
    )
    const divider = el.firstElementChild as JSX.Element
    divider.updateComponent()
    await flushUpdates()
    expect(divider.getAttribute('data-text-align')).toBe('right')
  })

  it('should not set data-text-align for center alignment (default)', async () => {
    const el = (
      <div>
        <Divider textAlign="center">Section</Divider>
      </div>
    )
    const divider = el.firstElementChild as JSX.Element
    divider.updateComponent()
    await flushUpdates()
    expect(divider.hasAttribute('data-text-align')).toBe(false)
  })

  it('should not set data-text-align when no textAlign is provided', async () => {
    const el = (
      <div>
        <Divider>Section</Divider>
      </div>
    )
    const divider = el.firstElementChild as JSX.Element
    divider.updateComponent()
    await flushUpdates()
    expect(divider.hasAttribute('data-text-align')).toBe(false)
  })

  it('should accept and apply custom style', () => {
    const el = (
      <div>
        <Divider style={{ borderColor: 'red' }} />
      </div>
    )
    const divider = el.firstElementChild as JSX.Element
    divider.updateComponent()
    expect(divider.style.borderColor).toBe('red')
  })
})
