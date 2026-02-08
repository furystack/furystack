import { describe, expect, it, vi } from 'vitest'
import { reconcile, setElementProps } from './reconcile.js'

/**
 * Helper to create a DocumentFragment from child nodes for testing.
 */
const frag = (...children: Node[]): DocumentFragment => {
  const f = document.createDocumentFragment()
  children.forEach((c) => f.appendChild(c))
  return f
}

const text = (content: string) => document.createTextNode(content)

const el = (tag: string, attrs?: Record<string, string>, ...children: Node[]): HTMLElement => {
  const e = document.createElement(tag)
  if (attrs) {
    for (const [k, v] of Object.entries(attrs)) {
      e.setAttribute(k, v)
    }
  }
  children.forEach((c) => e.appendChild(c))
  return e
}

describe('reconcile', () => {
  describe('text node patching', () => {
    it('should update text content and preserve the same node reference', () => {
      const parent = document.createElement('div')
      parent.appendChild(text('hello'))
      const originalNode = parent.childNodes[0]

      reconcile(parent, frag(text('world')))
      expect(parent.childNodes[0]).toBe(originalNode)
      expect(parent.textContent).toBe('world')
    })

    it('should not modify text node if content is the same', () => {
      const parent = document.createElement('div')
      parent.appendChild(text('same'))
      const originalNode = parent.childNodes[0]

      reconcile(parent, frag(text('same')))
      expect(parent.childNodes[0]).toBe(originalNode)
      expect(parent.textContent).toBe('same')
    })
  })

  describe('attribute patching', () => {
    it('should add new attributes', () => {
      const parent = document.createElement('div')
      parent.appendChild(el('span'))

      reconcile(parent, frag(el('span', { class: 'active', 'data-id': '123' })))
      const child = parent.firstChild as HTMLElement
      expect(child.getAttribute('class')).toBe('active')
      expect(child.getAttribute('data-id')).toBe('123')
    })

    it('should remove old attributes not in new element', () => {
      const parent = document.createElement('div')
      parent.appendChild(el('span', { class: 'old', 'data-remove': 'yes' }))

      reconcile(parent, frag(el('span', { class: 'new' })))
      const child = parent.firstChild as HTMLElement
      expect(child.getAttribute('class')).toBe('new')
      expect(child.hasAttribute('data-remove')).toBe(false)
    })

    it('should update changed attribute values', () => {
      const parent = document.createElement('div')
      parent.appendChild(el('span', { class: 'old' }))

      reconcile(parent, frag(el('span', { class: 'new' })))
      expect((parent.firstChild as HTMLElement).getAttribute('class')).toBe('new')
    })
  })

  describe('style patching', () => {
    it('should add new style properties', () => {
      const parent = document.createElement('div')
      parent.appendChild(el('span'))

      const incoming = el('span')
      incoming.style.color = 'red'
      incoming.style.fontSize = '16px'
      reconcile(parent, frag(incoming))

      const child = parent.firstChild as HTMLElement
      expect(child.style.color).toBe('red')
      expect(child.style.fontSize).toBe('16px')
    })

    it('should remove old style properties', () => {
      const parent = document.createElement('div')
      const existing = el('span')
      existing.style.color = 'red'
      existing.style.fontSize = '16px'
      parent.appendChild(existing)

      const incoming = el('span')
      incoming.style.color = 'blue'
      reconcile(parent, frag(incoming))

      expect(existing.style.color).toBe('blue')
      expect(existing.style.fontSize).toBe('')
    })
  })

  describe('element addition and removal', () => {
    it('should append new elements', () => {
      const parent = document.createElement('div')
      parent.appendChild(el('p'))

      reconcile(parent, frag(el('p'), el('span')))
      expect(parent.childNodes.length).toBe(2)
      expect((parent.childNodes[1] as HTMLElement).tagName).toBe('SPAN')
    })

    it('should remove excess elements', () => {
      const parent = document.createElement('div')
      parent.appendChild(el('p'))
      parent.appendChild(el('span'))
      parent.appendChild(el('div'))

      reconcile(parent, frag(el('p')))
      expect(parent.childNodes.length).toBe(1)
      expect((parent.childNodes[0] as HTMLElement).tagName).toBe('P')
    })

    it('should replace elements with different tag names', () => {
      const parent = document.createElement('div')
      const original = el('p')
      original.textContent = 'old'
      parent.appendChild(original)

      const replacement = el('span')
      replacement.textContent = 'new'
      reconcile(parent, frag(replacement))

      expect(parent.childNodes.length).toBe(1)
      expect((parent.firstChild as HTMLElement).tagName).toBe('SPAN')
      expect(parent.firstChild?.textContent).toBe('new')
      expect(parent.firstChild).not.toBe(original)
    })
  })

  describe('element preservation', () => {
    it('should preserve existing elements with the same tag', () => {
      const parent = document.createElement('div')
      const existing = el('span')
      existing.textContent = 'old'
      parent.appendChild(existing)

      const incoming = el('span')
      incoming.textContent = 'new'
      reconcile(parent, frag(incoming))

      expect(parent.firstChild).toBe(existing)
      expect(parent.firstChild?.textContent).toBe('new')
    })
  })

  describe('event handler reassignment', () => {
    it('should update event handlers on preserved elements', () => {
      const parent = document.createElement('div')
      const existing = el('button')
      const oldHandler = vi.fn()
      existing.onclick = oldHandler
      setElementProps(existing, { onclick: oldHandler })
      parent.appendChild(existing)

      const incoming = el('button')
      const newHandler = vi.fn()
      incoming.onclick = newHandler
      setElementProps(incoming, { onclick: newHandler })
      reconcile(parent, frag(incoming))

      const btn = parent.firstChild as HTMLButtonElement
      expect(btn).toBe(existing)
      expect(btn.onclick).toBe(newHandler)
    })
  })

  describe('DocumentFragment reconciliation', () => {
    it('should reconcile DocumentFragment children against parent', () => {
      const parent = document.createElement('div')
      const p = el('p')
      p.textContent = 'old p'
      const span = el('span')
      span.textContent = 'old span'
      parent.appendChild(p)
      parent.appendChild(span)

      const fragment = frag()
      const newP = el('p')
      newP.textContent = 'new p'
      const newSpan = el('span')
      newSpan.textContent = 'new span'
      fragment.appendChild(newP)
      fragment.appendChild(newSpan)

      reconcile(parent, fragment)
      expect(parent.childNodes.length).toBe(2)
      expect(parent.childNodes[0]).toBe(p)
      expect(parent.childNodes[0].textContent).toBe('new p')
      expect(parent.childNodes[1]).toBe(span)
      expect(parent.childNodes[1].textContent).toBe('new span')
    })
  })

  describe('nested reconciliation', () => {
    it('should recursively reconcile nested children', () => {
      const parent = document.createElement('div')
      const list = el('ul')
      const li1 = el('li')
      li1.textContent = 'item 1'
      const li2 = el('li')
      li2.textContent = 'item 2'
      list.appendChild(li1)
      list.appendChild(li2)
      parent.appendChild(list)

      const newList = el('ul')
      const newLi1 = el('li')
      newLi1.textContent = 'item 1 updated'
      const newLi2 = el('li')
      newLi2.textContent = 'item 2 updated'
      const newLi3 = el('li')
      newLi3.textContent = 'item 3'
      newList.appendChild(newLi1)
      newList.appendChild(newLi2)
      newList.appendChild(newLi3)

      reconcile(parent, frag(newList))
      expect(parent.firstChild).toBe(list)
      expect(list.childNodes.length).toBe(3)
      expect(list.childNodes[0]).toBe(li1)
      expect(list.childNodes[0].textContent).toBe('item 1 updated')
      expect(list.childNodes[1]).toBe(li2)
      expect(list.childNodes[1].textContent).toBe('item 2 updated')
      expect(list.childNodes[2].textContent).toBe('item 3')
    })
  })

  describe('key-based reconciliation', () => {
    it('should match keyed elements and reorder them', () => {
      const parent = document.createElement('div')
      const a = el('div', { 'data-sh-key': 'a' })
      a.textContent = 'A'
      const b = el('div', { 'data-sh-key': 'b' })
      b.textContent = 'B'
      const c = el('div', { 'data-sh-key': 'c' })
      c.textContent = 'C'
      parent.appendChild(a)
      parent.appendChild(b)
      parent.appendChild(c)

      // Reorder: C, A, B
      reconcile(
        parent,
        frag(el('div', { 'data-sh-key': 'c' }), el('div', { 'data-sh-key': 'a' }), el('div', { 'data-sh-key': 'b' })),
      )

      expect(parent.childNodes.length).toBe(3)
      expect(parent.childNodes[0]).toBe(c)
      expect(parent.childNodes[1]).toBe(a)
      expect(parent.childNodes[2]).toBe(b)
    })

    it('should remove keyed elements not in the new list', () => {
      const parent = document.createElement('div')
      const a = el('div', { 'data-sh-key': 'a' })
      const b = el('div', { 'data-sh-key': 'b' })
      const c = el('div', { 'data-sh-key': 'c' })
      parent.appendChild(a)
      parent.appendChild(b)
      parent.appendChild(c)

      reconcile(parent, frag(el('div', { 'data-sh-key': 'a' }), el('div', { 'data-sh-key': 'c' })))
      expect(parent.childNodes.length).toBe(2)
      expect(parent.childNodes[0]).toBe(a)
      expect(parent.childNodes[1]).toBe(c)
    })

    it('should add new keyed elements', () => {
      const parent = document.createElement('div')
      const a = el('div', { 'data-sh-key': 'a' })
      parent.appendChild(a)

      const newB = el('div', { 'data-sh-key': 'b' })
      reconcile(parent, frag(el('div', { 'data-sh-key': 'a' }), newB))
      expect(parent.childNodes.length).toBe(2)
      expect(parent.childNodes[0]).toBe(a)
      expect(parent.childNodes[1]).toBe(newB)
    })
  })
})
