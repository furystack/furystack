import { describe, expect, it, vi } from 'vitest'
import {
  createVNode,
  EXISTING_NODE,
  flattenVChildren,
  FRAGMENT,
  isVNode,
  isVTextNode,
  mountChild,
  patchChildren,
  patchProps,
  shallowEqual,
  toVChildArray,
  unmountChild,
  type VChild,
  type VNode,
  type VTextNode,
} from './vnode.js'

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

const vtext = (text: string): VTextNode => ({ _brand: 'vtext', text })

const vel = (tag: string, props: Record<string, unknown> | null, ...children: VChild[]): VNode => ({
  _brand: 'vnode',
  type: tag,
  props,
  children,
})

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe('vnode', () => {
  describe('createVNode', () => {
    it('should create an intrinsic element VNode', () => {
      const vnode = createVNode('div', { id: 'test' }, 'hello')
      expect(vnode._brand).toBe('vnode')
      expect(vnode.type).toBe('div')
      expect(vnode.props).toEqual({ id: 'test' })
      expect(vnode.children).toHaveLength(1)
      expect(vnode.children[0]).toEqual({ _brand: 'vtext', text: 'hello' })
    })

    it('should create a fragment VNode', () => {
      const child = createVNode('p', null, 'text')
      const vnode = createVNode(null, null, child)
      expect(vnode.type).toBe(FRAGMENT)
      expect(vnode.children).toEqual([child])
    })

    it('should flatten nested arrays', () => {
      const vnode = createVNode('ul', null, [createVNode('li', null, 'a'), createVNode('li', null, 'b')])
      expect(vnode.children).toHaveLength(2)
    })

    it('should skip null and boolean children', () => {
      const vnode = createVNode('div', null, null, false, true, undefined, 'kept')
      expect(vnode.children).toHaveLength(1)
      expect((vnode.children[0] as VTextNode).text).toBe('kept')
    })

    it('should inline fragment children', () => {
      const fragment = createVNode(null, null, 'a', 'b')
      const vnode = createVNode('div', null, fragment)
      expect(vnode.children).toHaveLength(2)
      expect((vnode.children[0] as VTextNode).text).toBe('a')
      expect((vnode.children[1] as VTextNode).text).toBe('b')
    })

    it('should convert numbers to text nodes', () => {
      const vnode = createVNode('span', null, 42)
      expect(vnode.children).toHaveLength(1)
      expect((vnode.children[0] as VTextNode).text).toBe('42')
    })
  })

  describe('flattenVChildren', () => {
    it('should wrap real DOM nodes as EXISTING_NODE VNodes', () => {
      const div = document.createElement('div')
      const result = flattenVChildren([div])
      expect(result).toHaveLength(1)
      expect(isVNode(result[0])).toBe(true)
      expect((result[0] as VNode).type).toBe(EXISTING_NODE)
      expect((result[0] as VNode)._el).toBe(div)
    })
  })

  describe('type guards', () => {
    it('isVNode should identify VNodes', () => {
      expect(isVNode(createVNode('div', null))).toBe(true)
      expect(isVNode({ _brand: 'vtext', text: 'hello' })).toBe(false)
      expect(isVNode(null)).toBe(false)
      expect(isVNode('string')).toBe(false)
    })

    it('isVTextNode should identify VTextNodes', () => {
      expect(isVTextNode({ _brand: 'vtext', text: 'hi' })).toBe(true)
      expect(isVTextNode(createVNode('div', null))).toBe(false)
    })
  })

  describe('shallowEqual', () => {
    it('should return true for identical references', () => {
      const obj = { a: 1 }
      expect(shallowEqual(obj, obj)).toBe(true)
    })

    it('should return true for equal props', () => {
      expect(shallowEqual({ a: 1, b: 'x' }, { a: 1, b: 'x' })).toBe(true)
    })

    it('should return false for different values', () => {
      expect(shallowEqual({ a: 1 }, { a: 2 })).toBe(false)
    })

    it('should return false for different key counts', () => {
      expect(shallowEqual({ a: 1 }, { a: 1, b: 2 })).toBe(false)
    })

    it('should handle null comparisons', () => {
      expect(shallowEqual(null, null)).toBe(true)
      expect(shallowEqual(null, {})).toBe(false)
      expect(shallowEqual({}, null)).toBe(false)
    })
  })

  describe('toVChildArray', () => {
    it('should return empty array for null', () => {
      expect(toVChildArray(null)).toEqual([])
    })

    it('should wrap string as VTextNode', () => {
      const result = toVChildArray('hello')
      expect(result).toHaveLength(1)
      expect(isVTextNode(result[0])).toBe(true)
    })

    it('should unwrap fragment VNode children', () => {
      const fragment = createVNode(null, null, createVNode('p', null, 'a'), createVNode('p', null, 'b'))
      const result = toVChildArray(fragment)
      expect(result).toHaveLength(2)
    })

    it('should wrap single VNode in array', () => {
      const vnode = createVNode('div', null, 'text')
      const result = toVChildArray(vnode)
      expect(result).toEqual([vnode])
    })

    it('should wrap real DOM element as EXISTING_NODE', () => {
      const el = document.createElement('div')
      const result = toVChildArray(el)
      expect(result).toHaveLength(1)
      expect((result[0] as VNode).type).toBe(EXISTING_NODE)
      expect((result[0] as VNode)._el).toBe(el)
    })
  })

  describe('mountChild', () => {
    it('should mount a text node', () => {
      const parent = document.createElement('div')
      mountChild(vtext('hello'), parent)
      expect(parent.textContent).toBe('hello')
    })

    it('should mount an intrinsic element with props', () => {
      const parent = document.createElement('div')
      const child = vel('span', { id: 'test', className: 'cls' }, vtext('content'))
      mountChild(child, parent)
      const span = parent.querySelector('span')!
      expect(span.id).toBe('test')
      expect(span.className).toBe('cls')
      expect(span.textContent).toBe('content')
      expect(child._el).toBe(span)
    })

    it('should mount nested children', () => {
      const parent = document.createElement('div')
      const child = vel('ul', null, vel('li', null, vtext('a')), vel('li', null, vtext('b')))
      mountChild(child, parent)
      expect(parent.innerHTML).toBe('<ul><li>a</li><li>b</li></ul>')
    })

    it('should mount an EXISTING_NODE by appending the real element', () => {
      const parent = document.createElement('div')
      const existing = document.createElement('span')
      existing.textContent = 'existing'
      const child: VNode = { _brand: 'vnode', type: EXISTING_NODE, props: null, children: [], _el: existing }
      mountChild(child, parent)
      expect(parent.firstChild).toBe(existing)
    })

    it('should set _el on text nodes', () => {
      const parent = document.createElement('div')
      const child = vtext('hi')
      mountChild(child, parent)
      expect(child._el).toBeInstanceOf(Text)
      expect(child._el?.textContent).toBe('hi')
    })
  })

  describe('unmountChild', () => {
    it('should remove a mounted element from the DOM', () => {
      const parent = document.createElement('div')
      const child = vel('span', null, vtext('bye'))
      mountChild(child, parent)
      expect(parent.children.length).toBe(1)
      unmountChild(child)
      expect(parent.children.length).toBe(0)
    })

    it('should remove a mounted text node from the DOM', () => {
      const parent = document.createElement('div')
      const child = vtext('bye')
      mountChild(child, parent)
      expect(parent.childNodes.length).toBe(1)
      unmountChild(child)
      expect(parent.childNodes.length).toBe(0)
    })
  })

  describe('patchProps', () => {
    it('should add new props', () => {
      const el = document.createElement('div')
      patchProps(el, null, { id: 'new' })
      expect(el.id).toBe('new')
    })

    it('should update changed props', () => {
      const el = document.createElement('div')
      el.id = 'old'
      patchProps(el, { id: 'old' }, { id: 'new' })
      expect(el.id).toBe('new')
    })

    it('should remove stale event handlers', () => {
      const el = document.createElement('div')
      const handler = vi.fn()
      el.onclick = handler
      patchProps(el, { onclick: handler }, {})
      expect(el.onclick).toBeNull()
    })

    it('should update event handlers', () => {
      const el = document.createElement('button')
      const handler1 = vi.fn()
      const handler2 = vi.fn()
      patchProps(el, { onclick: handler1 }, { onclick: handler2 })
      expect(el.onclick).toBe(handler2)
    })

    it('should patch styles', () => {
      const el = document.createElement('div')
      patchProps(el, { style: { color: 'red', fontSize: '14px' } }, { style: { color: 'blue' } })
      expect(el.style.color).toBe('blue')
      expect(el.style.fontSize).toBe('')
    })

    it('should set data attributes', () => {
      const el = document.createElement('div')
      patchProps(el, null, { 'data-testid': 'foo' })
      expect(el.getAttribute('data-testid')).toBe('foo')
    })

    it('should remove data attributes', () => {
      const el = document.createElement('div')
      el.setAttribute('data-testid', 'foo')
      patchProps(el, { 'data-testid': 'foo' }, {})
      expect(el.hasAttribute('data-testid')).toBe(false)
    })
  })

  describe('patchChildren', () => {
    it('should mount all children when old is empty', () => {
      const parent = document.createElement('div')
      const newChildren: VChild[] = [vel('span', null, vtext('a')), vel('span', null, vtext('b'))]
      patchChildren(parent, [], newChildren)
      expect(parent.children.length).toBe(2)
      expect(parent.children[0].textContent).toBe('a')
      expect(parent.children[1].textContent).toBe('b')
    })

    it('should remove all children when new is empty', () => {
      const parent = document.createElement('div')
      const oldChildren: VChild[] = [vel('span', null, vtext('a'))]
      patchChildren(parent, [], oldChildren) // mount first
      patchChildren(parent, oldChildren, [])
      expect(parent.children.length).toBe(0)
    })

    it('should patch matching text nodes', () => {
      const parent = document.createElement('div')
      const old: VChild[] = [vtext('old')]
      patchChildren(parent, [], old)
      const textNode = parent.firstChild!
      const updated: VChild[] = [vtext('new')]
      patchChildren(parent, old, updated)
      expect(parent.firstChild).toBe(textNode)
      expect(parent.textContent).toBe('new')
    })

    it('should patch matching intrinsic elements in place', () => {
      const parent = document.createElement('div')
      const old: VChild[] = [vel('span', { id: 'a' }, vtext('old'))]
      patchChildren(parent, [], old)
      const span = parent.querySelector('span')!

      const updated: VChild[] = [vel('span', { id: 'b' }, vtext('new'))]
      patchChildren(parent, old, updated)

      expect(parent.querySelector('span')).toBe(span)
      expect(span.id).toBe('b')
      expect(span.textContent).toBe('new')
    })

    it('should replace when types differ', () => {
      const parent = document.createElement('div')
      const old: VChild[] = [vel('div', null, vtext('div'))]
      patchChildren(parent, [], old)

      const updated: VChild[] = [vel('span', null, vtext('span'))]
      patchChildren(parent, old, updated)

      expect(parent.children[0].tagName).toBe('SPAN')
      expect(parent.textContent).toBe('span')
    })

    it('should add excess new children', () => {
      const parent = document.createElement('div')
      const old: VChild[] = [vel('p', null, vtext('a'))]
      patchChildren(parent, [], old)

      const updated: VChild[] = [vel('p', null, vtext('a')), vel('p', null, vtext('b'))]
      patchChildren(parent, old, updated)

      expect(parent.children.length).toBe(2)
    })

    it('should remove excess old children', () => {
      const parent = document.createElement('div')
      const old: VChild[] = [vel('p', null, vtext('a')), vel('p', null, vtext('b'))]
      patchChildren(parent, [], old)

      const updated: VChild[] = [vel('p', null, vtext('only'))]
      patchChildren(parent, old, updated)

      expect(parent.children.length).toBe(1)
      expect(parent.textContent).toBe('only')
    })

    it('should preserve element identity across patches', () => {
      const parent = document.createElement('div')
      const old: VChild[] = [vel('input', { type: 'text' })]
      patchChildren(parent, [], old)
      const input = parent.querySelector('input')!

      const updated: VChild[] = [vel('input', { type: 'text', id: 'updated' })]
      patchChildren(parent, old, updated)

      expect(parent.querySelector('input')).toBe(input)
      expect(input.id).toBe('updated')
    })

    it('should handle EXISTING_NODE patching (same reference)', () => {
      const parent = document.createElement('div')
      const real = document.createElement('span')
      real.textContent = 'real'

      const old: VChild[] = [{ _brand: 'vnode', type: EXISTING_NODE, props: null, children: [], _el: real }]
      patchChildren(parent, [], old)
      expect(parent.firstChild).toBe(real)

      const updated: VChild[] = [{ _brand: 'vnode', type: EXISTING_NODE, props: null, children: [], _el: real }]
      patchChildren(parent, old, updated)
      expect(parent.firstChild).toBe(real)
    })

    describe('Shade component boundaries', () => {
      it('should call updateComponent on child Shade when props change', () => {
        const parent = document.createElement('div')

        const fakeShadeEl = document.createElement('my-shade') as unknown as JSX.Element
        const updateFn = vi.fn()
        ;(fakeShadeEl as unknown as Record<string, unknown>).updateComponent = updateFn
        ;(fakeShadeEl as unknown as Record<string, unknown>).props = { count: 1 }
        ;(fakeShadeEl as unknown as Record<string, unknown>).shadeChildren = undefined

        const factory = vi.fn(() => fakeShadeEl as unknown as JSX.Element)

        const old: VChild[] = [{ _brand: 'vnode', type: factory, props: { count: 1 }, children: [], _el: fakeShadeEl }]
        // Simulate initial mount by manually appending
        parent.appendChild(fakeShadeEl)

        const updated: VChild[] = [{ _brand: 'vnode', type: factory, props: { count: 2 }, children: [] }]
        patchChildren(parent, old, updated)

        expect(updateFn).toHaveBeenCalledOnce()
        expect(fakeShadeEl.props).toEqual({ count: 2 })
      })

      it('should NOT call updateComponent when props are unchanged', () => {
        const parent = document.createElement('div')

        const fakeShadeEl = document.createElement('my-shade-2') as unknown as JSX.Element
        const updateFn = vi.fn()
        const props = { count: 1 }
        ;(fakeShadeEl as unknown as Record<string, unknown>).updateComponent = updateFn
        ;(fakeShadeEl as unknown as Record<string, unknown>).props = props
        ;(fakeShadeEl as unknown as Record<string, unknown>).shadeChildren = undefined

        const factory = vi.fn(() => fakeShadeEl as unknown as JSX.Element)

        const old: VChild[] = [{ _brand: 'vnode', type: factory, props: { count: 1 }, children: [], _el: fakeShadeEl }]
        parent.appendChild(fakeShadeEl)

        const updated: VChild[] = [{ _brand: 'vnode', type: factory, props: { count: 1 }, children: [] }]
        patchChildren(parent, old, updated)

        expect(updateFn).not.toHaveBeenCalled()
      })
    })
  })
})
