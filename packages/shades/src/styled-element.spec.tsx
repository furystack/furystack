import { describe, expect, it } from 'vitest'
import { styledElement } from './styled-element.js'

describe('styled-element', () => {
  describe('styledElement', () => {
    it('should apply additional styles to an intrinsic element', () => {
      const additionalStyles = { color: 'red', padding: '10px' }
      const StyledDiv = styledElement('div', additionalStyles)

      const result = StyledDiv({}, [])

      expect(result.style.color).toBe('red')
      expect(result.style.padding).toBe('10px')
    })

    it('should merge styles when element already has styles', () => {
      const additionalStyles = { color: 'red' }
      const existingStyles = { backgroundColor: 'blue' }

      const StyledDiv = styledElement('div', additionalStyles)
      const result = StyledDiv({ style: existingStyles }, [])

      expect(result.style.backgroundColor).toBe('blue')
      expect(result.style.color).toBe('red')
    })

    it('should override existing styles with additional styles', () => {
      const additionalStyles = { color: 'red' }
      const existingStyles = { color: 'blue' }

      const StyledDiv = styledElement('div', additionalStyles)
      const result = StyledDiv({ style: existingStyles }, [])

      expect(result.style.color).toBe('red')
    })

    it('should preserve original props', () => {
      const additionalStyles = { color: 'red' }

      const StyledDiv = styledElement('div', additionalStyles)
      const result = StyledDiv({ className: 'my-class', id: 'my-id' }, [])

      expect(result.className).toBe('my-class')
      expect(result.id).toBe('my-id')
      expect(result.style.color).toBe('red')
    })

    it('should pass children correctly', () => {
      const additionalStyles = { color: 'red' }

      const StyledDiv = styledElement('div', additionalStyles)
      const child1 = document.createElement('span')
      child1.textContent = 'child1'
      const child2 = document.createElement('span')
      child2.textContent = 'child2'

      const result = StyledDiv({}, [child1, child2])

      expect(result.children.length).toBe(2)
      expect(result.children[0]).toBe(child1)
      expect(result.children[1]).toBe(child2)
    })

    it('should handle text children', () => {
      const additionalStyles = { color: 'red' }

      const StyledDiv = styledElement('div', additionalStyles)
      const result = StyledDiv({}, ['Hello', ' ', 'World'])

      expect(result.textContent).toBe('Hello World')
    })

    it('should return an HTMLElement', () => {
      const additionalStyles = { color: 'red' }

      const StyledDiv = styledElement('div', additionalStyles)
      const result = StyledDiv({}, [])

      expect(result).toBeInstanceOf(HTMLElement)
      expect(result.tagName.toLowerCase()).toBe('div')
    })

    it('should work with different element types', () => {
      const spanStyles = { fontWeight: 'bold' }
      const buttonStyles = { cursor: 'pointer' }

      const StyledSpan = styledElement('span', spanStyles)
      const StyledButton = styledElement('button', buttonStyles)

      const spanResult = StyledSpan({}, [])
      const buttonResult = StyledButton({}, [])

      expect(spanResult.tagName.toLowerCase()).toBe('span')
      expect(spanResult.style.fontWeight).toBe('bold')
      expect(buttonResult.tagName.toLowerCase()).toBe('button')
      expect(buttonResult.style.cursor).toBe('pointer')
    })

    it('should handle props being undefined', () => {
      const additionalStyles = { color: 'red' }

      const StyledDiv = styledElement('div', additionalStyles)
      const result = StyledDiv(undefined as unknown as Record<string, unknown>, [])

      expect(result.style.color).toBe('red')
    })

    it('should handle empty children list', () => {
      const additionalStyles = { color: 'red' }

      const StyledDiv = styledElement('div', additionalStyles)
      const result = StyledDiv({}, [])

      expect(result.children.length).toBe(0)
    })
  })
})
