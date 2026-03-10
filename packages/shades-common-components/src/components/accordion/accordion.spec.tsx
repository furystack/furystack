import { createComponent, flushUpdates } from '@furystack/shades'
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

  it('should render children', async () => {
    const el = (
      <div>
        <Accordion>
          <span>child content</span>
        </Accordion>
      </div>
    )
    const accordion = el.firstElementChild as JSX.Element
    accordion.updateComponent()
    await flushUpdates()
    expect(accordion.querySelector('span')).not.toBeNull()
  })

  it('should set data-variant attribute when variant is provided', async () => {
    const el = (
      <div>
        <Accordion variant="elevation" />
      </div>
    )
    const accordion = el.firstElementChild as JSX.Element
    accordion.updateComponent()
    await flushUpdates()
    expect(accordion.getAttribute('data-variant')).toBe('elevation')
  })

  it('should not set data-variant attribute for outlined (default)', async () => {
    const el = (
      <div>
        <Accordion />
      </div>
    )
    const accordion = el.firstElementChild as JSX.Element
    accordion.updateComponent()
    await flushUpdates()
    expect(accordion.hasAttribute('data-variant')).toBe(false)
  })

  describe('spatial navigation', () => {
    it('should set data-nav-section with auto-generated id', async () => {
      const el = (
        <div>
          <Accordion />
        </div>
      )
      const accordion = el.firstElementChild as JSX.Element
      accordion.updateComponent()
      await flushUpdates()
      const navSection = accordion.getAttribute('data-nav-section')
      expect(navSection).toBeTruthy()
      expect(navSection).toMatch(/^accordion-\d+$/)
    })

    it('should use custom navSection when provided', async () => {
      const el = (
        <div>
          <Accordion navSection="my-accordion" />
        </div>
      )
      const accordion = el.firstElementChild as JSX.Element
      accordion.updateComponent()
      await flushUpdates()
      expect(accordion.getAttribute('data-nav-section')).toBe('my-accordion')
    })
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

  it('should render the title text in the header', async () => {
    const el = (
      <div>
        <AccordionItem title="My Section">
          <p>Content</p>
        </AccordionItem>
      </div>
    )
    const item = el.firstElementChild as JSX.Element
    item.updateComponent()
    await flushUpdates()
    const title = item.querySelector('.accordion-title') as HTMLElement
    expect(title).not.toBeNull()
    expect(title.textContent).toBe('My Section')
  })

  it('should render children in the content area', async () => {
    const el = (
      <div>
        <AccordionItem title="Section">
          <p>Inner content</p>
        </AccordionItem>
      </div>
    )
    const item = el.firstElementChild as JSX.Element
    item.updateComponent()
    await flushUpdates()
    const inner = item.querySelector('.accordion-content-inner') as HTMLElement
    expect(inner).not.toBeNull()
    expect(inner.querySelector('p')).not.toBeNull()
  })

  it('should not set data-expanded when defaultExpanded is not set', async () => {
    const el = (
      <div>
        <AccordionItem title="Collapsed" />
      </div>
    )
    const item = el.firstElementChild as JSX.Element
    item.updateComponent()
    await flushUpdates()
    expect(item.hasAttribute('data-expanded')).toBe(false)
  })

  it('should set data-expanded when defaultExpanded is true', async () => {
    const el = (
      <div>
        <AccordionItem title="Expanded" defaultExpanded />
      </div>
    )
    const item = el.firstElementChild as JSX.Element
    item.updateComponent()
    await flushUpdates()
    expect(item.hasAttribute('data-expanded')).toBe(true)
  })

  it('should set data-disabled when disabled is true', async () => {
    const el = (
      <div>
        <AccordionItem title="Disabled" disabled />
      </div>
    )
    const item = el.firstElementChild as JSX.Element
    item.updateComponent()
    await flushUpdates()
    expect(item.hasAttribute('data-disabled')).toBe(true)
  })

  it('should not set data-disabled when disabled is false', async () => {
    const el = (
      <div>
        <AccordionItem title="Enabled" />
      </div>
    )
    const item = el.firstElementChild as JSX.Element
    item.updateComponent()
    await flushUpdates()
    expect(item.hasAttribute('data-disabled')).toBe(false)
  })

  it('should render the icon when provided', async () => {
    const el = (
      <div>
        <AccordionItem title="With Icon" icon="🔧" />
      </div>
    )
    const item = el.firstElementChild as JSX.Element
    item.updateComponent()
    await flushUpdates()
    const icon = item.querySelector('.accordion-icon') as HTMLElement
    expect(icon).not.toBeNull()
    expect(icon.textContent).toBe('🔧')
  })

  it('should not render the icon when not provided', async () => {
    const el = (
      <div>
        <AccordionItem title="No Icon" />
      </div>
    )
    const item = el.firstElementChild as JSX.Element
    item.updateComponent()
    await flushUpdates()
    expect(item.querySelector('.accordion-icon')).toBeNull()
  })

  it('should render the chevron', async () => {
    const el = (
      <div>
        <AccordionItem title="Has Chevron" />
      </div>
    )
    const item = el.firstElementChild as JSX.Element
    item.updateComponent()
    await flushUpdates()
    const chevron = item.querySelector('.accordion-chevron') as HTMLElement
    expect(chevron).not.toBeNull()
    expect(chevron.querySelector('shade-icon')).not.toBeNull()
  })

  it('should set aria-expanded to false when collapsed', async () => {
    const el = (
      <div>
        <AccordionItem title="Collapsed" />
      </div>
    )
    const item = el.firstElementChild as JSX.Element
    item.updateComponent()
    await flushUpdates()
    const header = item.querySelector('.accordion-header') as HTMLElement
    expect(header.getAttribute('aria-expanded')).toBe('false')
  })

  it('should set aria-expanded to true when expanded', async () => {
    const el = (
      <div>
        <AccordionItem title="Expanded" defaultExpanded />
      </div>
    )
    const item = el.firstElementChild as JSX.Element
    item.updateComponent()
    await flushUpdates()
    const header = item.querySelector('.accordion-header') as HTMLElement
    expect(header.getAttribute('aria-expanded')).toBe('true')
  })

  it('should set content height to 0px when collapsed', async () => {
    const el = (
      <div>
        <AccordionItem title="Collapsed" />
      </div>
    )
    const item = el.firstElementChild as JSX.Element
    item.updateComponent()
    await flushUpdates()
    const content = item.querySelector('.accordion-content') as HTMLElement
    expect(content.style.height).toBe('0px')
    expect(content.style.opacity).toBe('0')
  })

  it('should not set content height to 0px when expanded', async () => {
    const el = (
      <div>
        <AccordionItem title="Expanded" defaultExpanded />
      </div>
    )
    const item = el.firstElementChild as JSX.Element
    item.updateComponent()
    await flushUpdates()
    const content = item.querySelector('.accordion-content') as HTMLElement
    expect(content.style.height).not.toBe('0px')
  })

  it('should render the header as a <button> element', async () => {
    const el = (
      <div>
        <AccordionItem title="Test" />
      </div>
    )
    const item = el.firstElementChild as JSX.Element
    item.updateComponent()
    await flushUpdates()
    const header = item.querySelector('.accordion-header') as HTMLButtonElement
    expect(header.tagName).toBe('BUTTON')
    expect(header.type).toBe('button')
  })

  it('should not disable the header button when not disabled', async () => {
    const el = (
      <div>
        <AccordionItem title="Test" />
      </div>
    )
    const item = el.firstElementChild as JSX.Element
    item.updateComponent()
    await flushUpdates()
    const header = item.querySelector('.accordion-header') as HTMLButtonElement
    expect(header.disabled).toBe(false)
  })

  it('should disable the header button when disabled', async () => {
    const el = (
      <div>
        <AccordionItem title="Test" disabled />
      </div>
    )
    const item = el.firstElementChild as JSX.Element
    item.updateComponent()
    await flushUpdates()
    const header = item.querySelector('.accordion-header') as HTMLButtonElement
    expect(header.disabled).toBe(true)
  })

  it('should toggle data-expanded on header click', async () => {
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
    item.updateComponent()
    await flushUpdates()

    expect(item.hasAttribute('data-expanded')).toBe(false)

    const header = item.querySelector('.accordion-header') as HTMLElement
    header.click()
    await flushUpdates()

    expect(item.hasAttribute('data-expanded')).toBe(true)
  })

  it('should toggle data-expanded back on second click', async () => {
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
    item.updateComponent()
    await flushUpdates()

    expect(item.hasAttribute('data-expanded')).toBe(true)

    const header = item.querySelector('.accordion-header') as HTMLElement
    header.click()
    await flushUpdates()

    expect(item.hasAttribute('data-expanded')).toBe(false)
  })

  it('should not toggle when disabled', async () => {
    const el = (
      <div>
        <AccordionItem title="Disabled" disabled>
          <p>Content</p>
        </AccordionItem>
      </div>
    )
    const item = el.firstElementChild as JSX.Element
    item.updateComponent()
    await flushUpdates()

    expect(item.hasAttribute('data-expanded')).toBe(false)

    const header = item.querySelector('.accordion-header') as HTMLElement
    header.click()

    expect(item.hasAttribute('data-expanded')).toBe(false)
  })

  describe('spatial navigation integration', () => {
    it('should set inert on content when collapsed', async () => {
      const el = (
        <div>
          <AccordionItem title="Collapsed">
            <p>Content</p>
          </AccordionItem>
        </div>
      )
      const item = el.firstElementChild as JSX.Element
      item.updateComponent()
      await flushUpdates()
      const content = item.querySelector('.accordion-content') as HTMLElement
      expect(content.inert).toBe(true)
    })

    it('should not set inert on content when expanded', async () => {
      const el = (
        <div>
          <AccordionItem title="Expanded" defaultExpanded>
            <p>Content</p>
          </AccordionItem>
        </div>
      )
      const item = el.firstElementChild as JSX.Element
      item.updateComponent()
      await flushUpdates()
      const content = item.querySelector('.accordion-content') as HTMLElement
      expect(content.inert).toBe(false)
    })

    it('should set inert on content after collapsing', async () => {
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
      item.updateComponent()
      await flushUpdates()

      const content = item.querySelector('.accordion-content') as HTMLElement
      expect(content.inert).toBe(false)

      const header = item.querySelector('.accordion-header') as HTMLElement
      header.click()
      await flushUpdates()

      expect(content.inert).toBe(true)
    })

    it('should remove inert on content after expanding', async () => {
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
      item.updateComponent()
      await flushUpdates()

      const content = item.querySelector('.accordion-content') as HTMLElement
      expect(content.inert).toBe(true)

      const header = item.querySelector('.accordion-header') as HTMLElement
      header.click()
      await flushUpdates()

      expect(content.inert).toBe(false)
    })

    it('should exclude disabled header from spatial navigation via native disabled attribute', async () => {
      const el = (
        <div>
          <AccordionItem title="Disabled" disabled />
        </div>
      )
      const item = el.firstElementChild as JSX.Element
      item.updateComponent()
      await flushUpdates()
      const header = item.querySelector('.accordion-header') as HTMLButtonElement
      expect(header.disabled).toBe(true)
      expect(header.matches('button:not([disabled])')).toBe(false)
    })
  })
})
