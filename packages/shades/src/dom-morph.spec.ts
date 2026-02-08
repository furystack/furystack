import { describe, expect, it, vi } from 'vitest'
import { elementPropsMap, morphChildren, morphElement, storeElementProps } from './dom-morph.js'

/**
 * Helper to create an element with props stored in the elementPropsMap,
 * mimicking what the JSX factory does.
 */
const createElement = (
  tag: string,
  props?: Record<string, unknown>,
  ...children: Array<HTMLElement | string>
): HTMLElement => {
  const el = document.createElement(tag)
  if (props) {
    const { style, ...rest } = props as Record<string, unknown> & { style?: Record<string, string> }
    if (style) {
      for (const [k, v] of Object.entries(style)) {
        ;(el.style as unknown as Record<string, unknown>)[k] = v
      }
    }
    for (const [k, v] of Object.entries(rest)) {
      if (k.startsWith('data-') || k.startsWith('aria-')) {
        el.setAttribute(k, v as string)
      } else {
        ;(el as unknown as Record<string, unknown>)[k] = v
      }
    }
    storeElementProps(el, props)
  }
  for (const child of children) {
    if (typeof child === 'string') {
      el.appendChild(document.createTextNode(child))
    } else {
      el.appendChild(child)
    }
  }
  return el
}

describe('dom-morph', () => {
  describe('storeElementProps / elementPropsMap', () => {
    it('should store props for an element', () => {
      const el = document.createElement('div')
      const props = { id: 'test', onclick: () => {} }
      storeElementProps(el, props)
      expect(elementPropsMap.get(el)).toBe(props)
    })

    it('should not store null props', () => {
      const el = document.createElement('div')
      storeElementProps(el, null)
      expect(elementPropsMap.has(el)).toBe(false)
    })

    it('should not store undefined props', () => {
      const el = document.createElement('div')
      storeElementProps(el, undefined)
      expect(elementPropsMap.has(el)).toBe(false)
    })
  })

  describe('morphElement', () => {
    describe('same-tag patching', () => {
      it('should keep the same DOM element when tags match', () => {
        const container = document.createElement('div')
        const oldEl = createElement('div')
        container.appendChild(oldEl)

        const newEl = createElement('div')

        morphElement(oldEl, newEl)
        expect(container.firstChild).toBe(oldEl)
      })

      it('should update attributes on the same element', () => {
        const container = document.createElement('div')
        const oldEl = createElement('div', { id: 'old', className: 'old-class' })
        container.appendChild(oldEl)

        const newEl = createElement('div', { id: 'new', className: 'new-class' })

        morphElement(oldEl, newEl)
        expect(oldEl.id).toBe('new')
        expect(oldEl.className).toBe('new-class')
      })

      it('should add new attributes', () => {
        const container = document.createElement('div')
        const oldEl = createElement('div')
        container.appendChild(oldEl)

        const newEl = createElement('div', { id: 'added' })

        morphElement(oldEl, newEl)
        expect(oldEl.id).toBe('added')
      })

      it('should remove stale attributes', () => {
        const container = document.createElement('div')
        const oldEl = createElement('div', { id: 'to-remove' })
        container.appendChild(oldEl)

        const newEl = createElement('div')

        morphElement(oldEl, newEl)
        expect(oldEl.hasAttribute('id')).toBe(false)
      })

      it('should update data attributes', () => {
        const container = document.createElement('div')
        const oldEl = createElement('div', { 'data-testid': 'old' })
        container.appendChild(oldEl)

        const newEl = createElement('div', { 'data-testid': 'new' })

        morphElement(oldEl, newEl)
        expect(oldEl.getAttribute('data-testid')).toBe('new')
      })

      it('should update aria attributes', () => {
        const container = document.createElement('div')
        const oldEl = createElement('div', { 'aria-label': 'old' })
        container.appendChild(oldEl)

        const newEl = createElement('div', { 'aria-label': 'new' })

        morphElement(oldEl, newEl)
        expect(oldEl.getAttribute('aria-label')).toBe('new')
      })
    })

    describe('style patching', () => {
      it('should update inline styles', () => {
        const container = document.createElement('div')
        const oldEl = createElement('div', { style: { color: 'red' } })
        container.appendChild(oldEl)

        const newEl = createElement('div', { style: { color: 'blue' } })

        morphElement(oldEl, newEl)
        expect(oldEl.style.color).toBe('blue')
      })

      it('should remove stale inline styles', () => {
        const container = document.createElement('div')
        const oldEl = createElement('div', { style: { color: 'red', fontSize: '14px' } })
        container.appendChild(oldEl)

        const newEl = createElement('div', { style: { color: 'red' } })

        morphElement(oldEl, newEl)
        expect(oldEl.style.color).toBe('red')
        expect(oldEl.style.fontSize).toBe('')
      })

      it('should add new inline styles', () => {
        const container = document.createElement('div')
        const oldEl = createElement('div')
        container.appendChild(oldEl)

        const newEl = createElement('div', { style: { color: 'green' } })

        morphElement(oldEl, newEl)
        expect(oldEl.style.color).toBe('green')
      })
    })

    describe('event handler patching', () => {
      it('should transfer onclick from new to old', () => {
        const container = document.createElement('div')
        const handler1 = vi.fn()
        const handler2 = vi.fn()
        const oldEl = createElement('div', { onclick: handler1 })
        container.appendChild(oldEl)

        const newEl = createElement('div', { onclick: handler2 })

        morphElement(oldEl, newEl)
        expect(oldEl.onclick).toBe(handler2)
      })

      it('should add new event handler', () => {
        const container = document.createElement('div')
        const oldEl = createElement('div')
        container.appendChild(oldEl)

        const handler = vi.fn()
        const newEl = createElement('div', { onclick: handler })

        morphElement(oldEl, newEl)
        expect(oldEl.onclick).toBe(handler)
      })

      it('should remove stale event handler', () => {
        const container = document.createElement('div')
        const handler = vi.fn()
        const oldEl = createElement('div', { onclick: handler })
        container.appendChild(oldEl)

        const newEl = createElement('div')

        morphElement(oldEl, newEl)
        expect(oldEl.onclick).toBeNull()
      })

      it('should transfer multiple event handlers', () => {
        const container = document.createElement('div')
        const click1 = vi.fn()
        const input1 = vi.fn()
        const oldEl = createElement('div', { onclick: click1, oninput: input1 })
        container.appendChild(oldEl)

        const click2 = vi.fn()
        const input2 = vi.fn()
        const newEl = createElement('div', { onclick: click2, oninput: input2 })

        morphElement(oldEl, newEl)
        expect(oldEl.onclick).toBe(click2)
        expect(oldEl.oninput).toBe(input2)
      })
    })

    describe('different-tag replacement', () => {
      it('should replace element when tags differ', () => {
        const container = document.createElement('div')
        const oldEl = createElement('div')
        container.appendChild(oldEl)

        const newEl = createElement('span', {}, 'new content')

        morphElement(oldEl, newEl)
        expect(container.firstElementChild).toBe(newEl)
        expect(container.firstElementChild?.tagName).toBe('SPAN')
      })

      it('should replace element and preserve surrounding siblings', () => {
        const container = document.createElement('div')
        const before = createElement('p', {}, 'before')
        const oldEl = createElement('div', {}, 'old')
        const after = createElement('p', {}, 'after')
        container.appendChild(before)
        container.appendChild(oldEl)
        container.appendChild(after)

        const newEl = createElement('span', {}, 'replacement')

        morphElement(oldEl, newEl)
        expect(container.children.length).toBe(3)
        expect(container.children[0]).toBe(before)
        expect(container.children[1]).toBe(newEl)
        expect(container.children[2]).toBe(after)
      })
    })

    describe('text node updates', () => {
      it('should update text content within an element', () => {
        const container = document.createElement('div')
        const oldEl = createElement('span', {}, 'old text')
        container.appendChild(oldEl)

        const newEl = createElement('span', {}, 'new text')

        morphElement(oldEl, newEl)
        expect(oldEl.textContent).toBe('new text')
      })

      it('should preserve the same text node reference when content changes', () => {
        const container = document.createElement('div')
        const oldEl = createElement('span', {}, 'old')
        container.appendChild(oldEl)
        const textNode = oldEl.firstChild

        const newEl = createElement('span', {}, 'new')

        morphElement(oldEl, newEl)
        expect(oldEl.firstChild).toBe(textNode)
        expect(textNode?.textContent).toBe('new')
      })

      it('should not touch text node if content is unchanged', () => {
        const container = document.createElement('div')
        const oldEl = createElement('span', {}, 'same')
        container.appendChild(oldEl)
        const textNode = oldEl.firstChild

        const newEl = createElement('span', {}, 'same')

        morphElement(oldEl, newEl)
        expect(oldEl.firstChild).toBe(textNode)
      })
    })

    describe('child morphing', () => {
      it('should morph matching children in place', () => {
        const container = document.createElement('div')
        const oldEl = createElement('div', {}, createElement('span', {}, 'a'), createElement('span', {}, 'b'))
        container.appendChild(oldEl)
        const firstSpan = oldEl.children[0]
        const secondSpan = oldEl.children[1]

        const newEl = createElement('div', {}, createElement('span', {}, 'x'), createElement('span', {}, 'y'))

        morphElement(oldEl, newEl)
        // Same elements should be reused
        expect(oldEl.children[0]).toBe(firstSpan)
        expect(oldEl.children[1]).toBe(secondSpan)
        expect(firstSpan.textContent).toBe('x')
        expect(secondSpan.textContent).toBe('y')
      })

      it('should add new children when new tree has more', () => {
        const container = document.createElement('div')
        const oldEl = createElement('div', {}, createElement('span', {}, 'a'))
        container.appendChild(oldEl)
        const firstSpan = oldEl.children[0]

        const newEl = createElement(
          'div',
          {},
          createElement('span', {}, 'a'),
          createElement('span', {}, 'b'),
          createElement('span', {}, 'c'),
        )

        morphElement(oldEl, newEl)
        expect(oldEl.children.length).toBe(3)
        expect(oldEl.children[0]).toBe(firstSpan)
        expect(oldEl.children[1].textContent).toBe('b')
        expect(oldEl.children[2].textContent).toBe('c')
      })

      it('should remove excess old children', () => {
        const container = document.createElement('div')
        const oldEl = createElement(
          'div',
          {},
          createElement('span', {}, 'a'),
          createElement('span', {}, 'b'),
          createElement('span', {}, 'c'),
        )
        container.appendChild(oldEl)
        const firstSpan = oldEl.children[0]

        const newEl = createElement('div', {}, createElement('span', {}, 'only'))

        morphElement(oldEl, newEl)
        expect(oldEl.children.length).toBe(1)
        expect(oldEl.children[0]).toBe(firstSpan)
        expect(firstSpan.textContent).toBe('only')
      })

      it('should replace child when IDs differ (identity heuristic)', () => {
        const container = document.createElement('div')
        const oldEl = createElement('div', {}, createElement('div', { id: 'item-a' }, 'A'))
        container.appendChild(oldEl)
        const oldChild = oldEl.children[0]

        const newChild = createElement('div', { id: 'item-b' }, 'B')
        const newEl = createElement('div', {}, newChild)

        morphElement(oldEl, newEl)
        // The old child should be replaced, not morphed
        expect(oldEl.children[0]).not.toBe(oldChild)
        expect(oldEl.children[0]).toBe(newChild)
        expect(oldEl.children[0].id).toBe('item-b')
        // The original old child retains its original attributes (detached from DOM)
        expect(oldChild.id).toBe('item-a')
      })

      it('should morph children when one or both lack an ID', () => {
        const container = document.createElement('div')
        const oldEl = createElement('div', {}, createElement('div', {}, 'no-id'))
        container.appendChild(oldEl)
        const oldChild = oldEl.children[0]

        const newEl = createElement('div', {}, createElement('div', { id: 'has-id' }, 'now has id'))

        morphElement(oldEl, newEl)
        // Without both having IDs, the morph should patch in place
        expect(oldEl.children[0]).toBe(oldChild)
        expect(oldChild.id).toBe('has-id')
      })

      it('should replace child when tag changes', () => {
        const container = document.createElement('div')
        const oldEl = createElement('div', {}, createElement('span', {}, 'old'))
        container.appendChild(oldEl)

        const newP = createElement('p', {}, 'new')
        const newEl = createElement('div', {}, newP)

        morphElement(oldEl, newEl)
        expect(oldEl.children.length).toBe(1)
        expect(oldEl.children[0].tagName).toBe('P')
        expect(oldEl.children[0]).toBe(newP)
      })

      it('should handle mixed text and element children', () => {
        const container = document.createElement('div')
        const oldEl = document.createElement('div')
        oldEl.appendChild(document.createTextNode('text'))
        oldEl.appendChild(createElement('span', {}, 'element'))
        container.appendChild(oldEl)
        const textNode = oldEl.childNodes[0]

        const newEl = document.createElement('div')
        newEl.appendChild(document.createTextNode('updated'))
        newEl.appendChild(createElement('span', {}, 'updated-el'))

        morphElement(oldEl, newEl)
        expect(oldEl.childNodes[0]).toBe(textNode)
        expect(textNode.textContent).toBe('updated')
        expect((oldEl.childNodes[1] as HTMLElement).textContent).toBe('updated-el')
      })

      it('should handle deeply nested structures', () => {
        const container = document.createElement('div')
        const oldEl = createElement(
          'div',
          {},
          createElement('div', {}, createElement('div', {}, createElement('span', {}, 'deep'))),
        )
        container.appendChild(oldEl)
        const deepSpan = oldEl.querySelector('span')!

        const newEl = createElement(
          'div',
          {},
          createElement('div', {}, createElement('div', {}, createElement('span', {}, 'updated-deep'))),
        )

        morphElement(oldEl, newEl)
        expect(oldEl.querySelector('span')).toBe(deepSpan)
        expect(deepSpan.textContent).toBe('updated-deep')
      })
    })

    describe('Shade component boundaries', () => {
      it('should update props on a Shade component without recursing into children', () => {
        const container = document.createElement('div')

        // Create a mock Shade element
        const oldShadeEl = document.createElement('my-shade') as unknown as JSX.Element
        const updateFn = vi.fn()
        ;(oldShadeEl as unknown as Record<string, unknown>).updateComponent = updateFn
        ;(oldShadeEl as unknown as Record<string, unknown>).props = { count: 1 }
        ;(oldShadeEl as unknown as Record<string, unknown>).shadeChildren = undefined

        // Add some internal children that should NOT be touched
        const internalChild = createElement('div', {}, 'internal')
        oldShadeEl.appendChild(internalChild)

        const oldEl = document.createElement('div')
        oldEl.appendChild(oldShadeEl as unknown as Node)
        container.appendChild(oldEl)

        // Create new tree with the same Shade element but different props
        const newShadeEl = document.createElement('my-shade') as unknown as JSX.Element
        ;(newShadeEl as unknown as Record<string, unknown>).updateComponent = vi.fn()
        ;(newShadeEl as unknown as Record<string, unknown>).props = { count: 2 }
        ;(newShadeEl as unknown as Record<string, unknown>).shadeChildren = ['child']

        const newEl = document.createElement('div')
        newEl.appendChild(newShadeEl as unknown as Node)

        morphElement(oldEl, newEl)

        // Should update props and trigger updateComponent
        expect(oldShadeEl.props).toEqual({ count: 2 })
        expect(oldShadeEl.shadeChildren).toEqual(['child'])
        expect(updateFn).toHaveBeenCalledOnce()

        // Internal children should be untouched (morph didn't recurse)
        expect(oldShadeEl.firstChild).toBe(internalChild)
      })

      it('should sync attributes on a Shade component', () => {
        const container = document.createElement('div')

        const oldShadeEl = document.createElement('my-shade-2') as unknown as JSX.Element
        ;(oldShadeEl as unknown as Record<string, unknown>).updateComponent = vi.fn()
        ;(oldShadeEl as unknown as Record<string, unknown>).props = {}
        ;(oldShadeEl as unknown as Record<string, unknown>).shadeChildren = undefined
        oldShadeEl.setAttribute('class', 'old-class')

        const oldEl = document.createElement('div')
        oldEl.appendChild(oldShadeEl as unknown as Node)
        container.appendChild(oldEl)

        const newShadeEl = document.createElement('my-shade-2') as unknown as JSX.Element
        ;(newShadeEl as unknown as Record<string, unknown>).updateComponent = vi.fn()
        ;(newShadeEl as unknown as Record<string, unknown>).props = {}
        ;(newShadeEl as unknown as Record<string, unknown>).shadeChildren = undefined
        newShadeEl.setAttribute('class', 'new-class')

        const newEl = document.createElement('div')
        newEl.appendChild(newShadeEl as unknown as Node)

        morphElement(oldEl, newEl)
        expect(oldShadeEl.getAttribute('class')).toBe('new-class')
      })
    })

    describe('focus preservation', () => {
      it('should preserve the same input element reference during morph', () => {
        const container = document.createElement('div')
        document.body.appendChild(container)

        const oldEl = createElement(
          'div',
          {},
          createElement('input', { id: 'my-input', type: 'text' } as Record<string, unknown>),
        )
        container.appendChild(oldEl)
        const inputEl = oldEl.querySelector('input')!

        const newEl = createElement(
          'div',
          {},
          createElement('input', { id: 'my-input', type: 'text' } as Record<string, unknown>),
        )

        morphElement(oldEl, newEl)

        // The same input element should still be in the DOM
        expect(oldEl.querySelector('input')).toBe(inputEl)
        document.body.removeChild(container)
      })
    })

    describe('form value preservation', () => {
      it('should preserve input value when morphing (value not in new props)', () => {
        const container = document.createElement('div')
        const oldInput = createElement('input', { type: 'text' } as Record<string, unknown>)
        ;(oldInput as HTMLInputElement).value = 'user typed this'
        const oldEl = createElement('div', {}, oldInput)
        container.appendChild(oldEl)

        const newInput = createElement('input', { type: 'text' } as Record<string, unknown>)
        const newEl = createElement('div', {}, newInput)

        morphElement(oldEl, newEl)

        // Value should be preserved since the element is kept and the new props don't include 'value'
        expect((oldEl.querySelector('input') as HTMLInputElement).value).toBe('user typed this')
      })

      it('should update input value when explicitly set in new props', () => {
        const container = document.createElement('div')
        const oldInput = createElement('input', { type: 'text', value: 'old' } as Record<string, unknown>)
        const oldEl = createElement('div', {}, oldInput)
        container.appendChild(oldEl)

        const newInput = createElement('input', { type: 'text', value: 'new' } as Record<string, unknown>)
        const newEl = createElement('div', {}, newInput)

        morphElement(oldEl, newEl)

        // Value should be updated because it's explicitly in new props
        expect((oldEl.querySelector('input') as HTMLInputElement).value).toBe('new')
      })

      it('should preserve checkbox checked state when not in new props', () => {
        const container = document.createElement('div')
        const oldCheckbox = createElement('input', { type: 'checkbox' } as Record<string, unknown>)
        ;(oldCheckbox as HTMLInputElement).checked = true
        const oldEl = createElement('div', {}, oldCheckbox)
        container.appendChild(oldEl)

        const newCheckbox = createElement('input', { type: 'checkbox' } as Record<string, unknown>)
        const newEl = createElement('div', {}, newCheckbox)

        morphElement(oldEl, newEl)

        // Checked state should be preserved
        expect((oldEl.querySelector('input') as HTMLInputElement).checked).toBe(true)
      })
    })
  })

  describe('morphChildren', () => {
    it('should append all children when parent is empty', () => {
      const parent = document.createElement('div')
      const fragment = document.createDocumentFragment()
      fragment.appendChild(createElement('span', {}, 'a'))
      fragment.appendChild(createElement('span', {}, 'b'))

      morphChildren(parent, fragment)
      expect(parent.children.length).toBe(2)
      expect(parent.children[0].textContent).toBe('a')
      expect(parent.children[1].textContent).toBe('b')
    })

    it('should morph existing children against fragment children', () => {
      const parent = document.createElement('div')
      parent.appendChild(createElement('span', {}, 'old-a'))
      parent.appendChild(createElement('span', {}, 'old-b'))
      const firstSpan = parent.children[0]

      const fragment = document.createDocumentFragment()
      fragment.appendChild(createElement('span', {}, 'new-a'))
      fragment.appendChild(createElement('span', {}, 'new-b'))

      morphChildren(parent, fragment)
      expect(parent.children.length).toBe(2)
      expect(parent.children[0]).toBe(firstSpan)
      expect(firstSpan.textContent).toBe('new-a')
    })

    it('should remove all children when fragment is empty', () => {
      const parent = document.createElement('div')
      parent.appendChild(createElement('span', {}, 'a'))
      parent.appendChild(createElement('span', {}, 'b'))

      const fragment = document.createDocumentFragment()

      morphChildren(parent, fragment)
      expect(parent.children.length).toBe(0)
    })

    it('should morph children of an element (not just fragments)', () => {
      const parent = document.createElement('div')
      parent.appendChild(createElement('p', {}, 'old'))

      const newParent = document.createElement('div')
      newParent.appendChild(createElement('p', {}, 'new'))
      newParent.appendChild(createElement('p', {}, 'extra'))

      morphChildren(parent, newParent)
      expect(parent.children.length).toBe(2)
      expect(parent.children[0].textContent).toBe('new')
      expect(parent.children[1].textContent).toBe('extra')
    })

    it('should handle transition from text to element children', () => {
      const parent = document.createElement('div')
      parent.appendChild(document.createTextNode('just text'))

      const fragment = document.createDocumentFragment()
      fragment.appendChild(createElement('span', {}, 'element now'))

      morphChildren(parent, fragment)
      expect(parent.children.length).toBe(1)
      expect(parent.children[0].tagName).toBe('SPAN')
    })

    it('should handle transition from element to text children', () => {
      const parent = document.createElement('div')
      parent.appendChild(createElement('span', {}, 'element'))

      const fragment = document.createDocumentFragment()
      fragment.appendChild(document.createTextNode('just text'))

      morphChildren(parent, fragment)
      expect(parent.childNodes.length).toBe(1)
      expect(parent.childNodes[0].nodeType).toBe(Node.TEXT_NODE)
      expect(parent.textContent).toBe('just text')
    })
  })
})
