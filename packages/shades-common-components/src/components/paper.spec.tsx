import { Injector } from '@furystack/inject'
import { createComponent, initializeShadeRoot } from '@furystack/shades'
import { sleepAsync } from '@furystack/utils'
import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import { Paper } from './paper.js'

describe('Paper', () => {
  beforeEach(() => {
    document.body.innerHTML = '<div id="root"></div>'
  })

  afterEach(() => {
    document.body.innerHTML = ''
  })

  const renderPaper = async (props: Parameters<typeof Paper>[0] = {}, children?: JSX.Element[]) => {
    const injector = new Injector()
    const root = document.getElementById('root')!
    initializeShadeRoot({
      injector,
      rootElement: root,
      jsxElement: <Paper {...props}>{children}</Paper>,
    })
    await sleepAsync(50)
    return {
      injector,
      paper: root.querySelector('div[is="shade-paper"]') as HTMLDivElement,
    }
  }

  describe('rendering', () => {
    it('should render a div element', async () => {
      const { paper } = await renderPaper()
      expect(paper).toBeTruthy()
      expect(paper.tagName.toLowerCase()).toBe('div')
      expect(paper.getAttribute('is')).toBe('shade-paper')
    })

    it('should render children', async () => {
      const { paper } = await renderPaper({}, [<span>Child content</span>])
      expect(paper.textContent).toContain('Child content')
    })

    it('should render multiple children', async () => {
      const { paper } = await renderPaper({}, [<span>First</span>, <span>Second</span>])
      expect(paper.textContent).toContain('First')
      expect(paper.textContent).toContain('Second')
    })
  })

  describe('elevation', () => {
    it('should have data-elevation="1" by default', async () => {
      const { paper } = await renderPaper()
      expect(paper.getAttribute('data-elevation')).toBe('1')
    })

    it('should set data-elevation="1" for elevation 1', async () => {
      const { paper } = await renderPaper({ elevation: 1 })
      expect(paper.getAttribute('data-elevation')).toBe('1')
    })

    it('should set data-elevation="2" for elevation 2', async () => {
      const { paper } = await renderPaper({ elevation: 2 })
      expect(paper.getAttribute('data-elevation')).toBe('2')
    })

    it('should set data-elevation="3" for elevation 3', async () => {
      const { paper } = await renderPaper({ elevation: 3 })
      expect(paper.getAttribute('data-elevation')).toBe('3')
    })
  })
})
