import { createComponent } from '@furystack/shades'
import { describe, expect, it, vi } from 'vitest'
import { AccordionItem } from './accordion-item.js'
import { Accordion } from './accordion.js'

describe('Accordion', () => {
  it('should be defined', () => {
    expect(Accordion).toBeDefined()
    expect(typeof Accordion).toBe('function')
  })

  it('should create an accordion element', () => {
    const el = (<Accordion />) as unknown as HTMLElement
    expect(el).toBeDefined()
    expect(el.tagName?.toLowerCase()).toBe('shade-accordion')
  })

  it('should render children', () => {
    const el = (
      <div>
        <Accordion>
          <span>child content</span>
        </Accordion>
      </div>
    )
    const accordion = el.firstElementChild as JSX.Element
    accordion.callConstructed()
    expect(accordion.querySelector('span')).not.toBeNull()
  })

  it('should set data-variant attribute when variant is provided', () => {
    const el = (
      <div>
        <Accordion variant="elevation" />
      </div>
    )
    const accordion = el.firstElementChild as JSX.Element
    accordion.callConstructed()
    expect(accordion.getAttribute('data-variant')).toBe('elevation')
  })

  it('should not set data-variant attribute for outlined (default)', () => {
    const el = (
      <div>
        <Accordion />
      </div>
    )
    const accordion = el.firstElementChild as JSX.Element
    accordion.callConstructed()
    expect(accordion.hasAttribute('data-variant')).toBe(false)
  })
})

describe('AccordionItem', () => {
  it('should be defined', () => {
    expect(AccordionItem).toBeDefined()
    expect(typeof AccordionItem).toBe('function')
  })

  it('should create an accordion-item element', () => {
    const el = (<AccordionItem title="Test" />) as unknown as HTMLElement
    expect(el).toBeDefined()
    expect(el.tagName?.toLowerCase()).toBe('shade-accordion-item')
  })

  it('should render the title text in the header', () => {
    const el = (
      <div>
        <AccordionItem title="My Section">
          <p>Content</p>
        </AccordionItem>
      </div>
    )
    const item = el.firstElementChild as JSX.Element
    item.callConstructed()
    const title = item.querySelector('.accordion-title') as HTMLElement
    expect(title).not.toBeNull()
    expect(title.textContent).toBe('My Section')
  })

  it('should render children in the content area', () => {
    const el = (
      <div>
        <AccordionItem title="Section">
          <p>Inner content</p>
        </AccordionItem>
      </div>
    )
    const item = el.firstElementChild as JSX.Element
    item.callConstructed()
    const inner = item.querySelector('.accordion-content-inner') as HTMLElement
    expect(inner).not.toBeNull()
    expect(inner.querySelector('p')).not.toBeNull()
  })

  it('should not set data-expanded when defaultExpanded is not set', () => {
    const el = (
      <div>
        <AccordionItem title="Collapsed" />
      </div>
    )
    const item = el.firstElementChild as JSX.Element
    item.callConstructed()
    expect(item.hasAttribute('data-expanded')).toBe(false)
  })

  it('should set data-expanded when defaultExpanded is true', () => {
    const el = (
      <div>
        <AccordionItem title="Expanded" defaultExpanded />
      </div>
    )
    const item = el.firstElementChild as JSX.Element
    item.callConstructed()
    expect(item.hasAttribute('data-expanded')).toBe(true)
  })

  it('should set data-disabled when disabled is true', () => {
    const el = (
      <div>
        <AccordionItem title="Disabled" disabled />
      </div>
    )
    const item = el.firstElementChild as JSX.Element
    item.callConstructed()
    expect(item.hasAttribute('data-disabled')).toBe(true)
  })

  it('should not set data-disabled when disabled is false', () => {
    const el = (
      <div>
        <AccordionItem title="Enabled" />
      </div>
    )
    const item = el.firstElementChild as JSX.Element
    item.callConstructed()
    expect(item.hasAttribute('data-disabled')).toBe(false)
  })

  it('should render the icon when provided', () => {
    const el = (
      <div>
        <AccordionItem title="With Icon" icon="🔧" />
      </div>
    )
    const item = el.firstElementChild as JSX.Element
    item.callConstructed()
    const icon = item.querySelector('.accordion-icon') as HTMLElement
    expect(icon).not.toBeNull()
    expect(icon.textContent).toBe('🔧')
  })

  it('should not render the icon when not provided', () => {
    const el = (
      <div>
        <AccordionItem title="No Icon" />
      </div>
    )
    const item = el.firstElementChild as JSX.Element
    item.callConstructed()
    expect(item.querySelector('.accordion-icon')).toBeNull()
  })

  it('should render the chevron', () => {
    const el = (
      <div>
        <AccordionItem title="Has Chevron" />
      </div>
    )
    const item = el.firstElementChild as JSX.Element
    item.callConstructed()
    const chevron = item.querySelector('.accordion-chevron') as HTMLElement
    expect(chevron).not.toBeNull()
    expect(chevron.textContent).toBe('▾')
  })

  it('should set aria-expanded to false when collapsed', () => {
    const el = (
      <div>
        <AccordionItem title="Collapsed" />
      </div>
    )
    const item = el.firstElementChild as JSX.Element
    item.callConstructed()
    const header = item.querySelector('.accordion-header') as HTMLElement
    expect(header.getAttribute('aria-expanded')).toBe('false')
  })

  it('should set aria-expanded to true when expanded', () => {
    const el = (
      <div>
        <AccordionItem title="Expanded" defaultExpanded />
      </div>
    )
    const item = el.firstElementChild as JSX.Element
    item.callConstructed()
    const header = item.querySelector('.accordion-header') as HTMLElement
    expect(header.getAttribute('aria-expanded')).toBe('true')
  })

  it('should set content height to 0px when collapsed', () => {
    const el = (
      <div>
        <AccordionItem title="Collapsed" />
      </div>
    )
    const item = el.firstElementChild as JSX.Element
    item.callConstructed()
    const content = item.querySelector('.accordion-content') as HTMLElement
    expect(content.style.height).toBe('0px')
    expect(content.style.opacity).toBe('0')
  })

  it('should not set content height to 0px when expanded', () => {
    const el = (
      <div>
        <AccordionItem title="Expanded" defaultExpanded />
      </div>
    )
    const item = el.firstElementChild as JSX.Element
    item.callConstructed()
    const content = item.querySelector('.accordion-content') as HTMLElement
    expect(content.style.height).not.toBe('0px')
  })

  it('should have a role="button" on the header', () => {
    const el = (
      <div>
        <AccordionItem title="Test" />
      </div>
    )
    const item = el.firstElementChild as JSX.Element
    item.callConstructed()
    const header = item.querySelector('.accordion-header') as HTMLElement
    expect(header.getAttribute('role')).toBe('button')
  })

  it('should set tabIndex on the header when not disabled', () => {
    const el = (
      <div>
        <AccordionItem title="Test" />
      </div>
    )
    const item = el.firstElementChild as JSX.Element
    item.callConstructed()
    const header = item.querySelector('.accordion-header') as HTMLElement
    expect(header.tabIndex).toBe(0)
  })

  it('should set tabIndex to -1 on the header when disabled', () => {
    const el = (
      <div>
        <AccordionItem title="Test" disabled />
      </div>
    )
    const item = el.firstElementChild as JSX.Element
    item.callConstructed()
    const header = item.querySelector('.accordion-header') as HTMLElement
    expect(header.tabIndex).toBe(-1)
  })

  it('should toggle data-expanded on header click', () => {
    const mockAnimation = { finished: Promise.resolve() }
    Element.prototype.animate = vi.fn().mockReturnValue(mockAnimation)

    const el = (
      <div>
        <AccordionItem title="Toggleable">
          <p>Content</p>
        </AccordionItem>
      </div>
    )
    const item = el.firstElementChild as JSX.Element
    item.callConstructed()

    expect(item.hasAttribute('data-expanded')).toBe(false)

    const header = item.querySelector('.accordion-header') as HTMLElement
    header.click()

    // The attribute is set synchronously before the animation awaits
    expect(item.hasAttribute('data-expanded')).toBe(true)
  })

  it('should toggle data-expanded back on second click', () => {
    const mockAnimation = { finished: Promise.resolve() }
    Element.prototype.animate = vi.fn().mockReturnValue(mockAnimation)

    const el = (
      <div>
        <AccordionItem title="Toggleable" defaultExpanded>
          <p>Content</p>
        </AccordionItem>
      </div>
    )
    const item = el.firstElementChild as JSX.Element
    item.callConstructed()

    expect(item.hasAttribute('data-expanded')).toBe(true)

    const header = item.querySelector('.accordion-header') as HTMLElement
    header.click()

    // The attribute is removed synchronously before the animation awaits
    expect(item.hasAttribute('data-expanded')).toBe(false)
  })

  it('should not toggle when disabled', () => {
    const el = (
      <div>
        <AccordionItem title="Disabled" disabled>
          <p>Content</p>
        </AccordionItem>
      </div>
    )
    const item = el.firstElementChild as JSX.Element
    item.callConstructed()

    expect(item.hasAttribute('data-expanded')).toBe(false)

    const header = item.querySelector('.accordion-header') as HTMLElement
    header.click()

    expect(item.hasAttribute('data-expanded')).toBe(false)
  })
})
