import { describe, expect, it, vi } from 'vitest'
import { styledShade } from './styled-shade.js'

describe('styled-shade', () => {
  describe('styledShade', () => {
    it('should apply additional styles to a component', () => {
      const mockElement = vi.fn().mockReturnValue({} as JSX.Element)
      const additionalStyles = { color: 'red', padding: '10px' }

      const StyledComponent = styledShade(mockElement, additionalStyles)
      StyledComponent({})

      expect(mockElement).toHaveBeenCalledTimes(1)
      const [props] = mockElement.mock.calls[0] as [{ style: Record<string, string> }]
      expect(props.style.color).toBe('red')
      expect(props.style.padding).toBe('10px')
    })

    it('should merge styles when component already has styles', () => {
      const mockElement = vi.fn().mockReturnValue({} as JSX.Element)
      const additionalStyles = { color: 'red' }
      const existingStyles = { backgroundColor: 'blue' }

      const StyledComponent = styledShade(mockElement, additionalStyles)
      StyledComponent({ style: existingStyles })

      expect(mockElement).toHaveBeenCalledTimes(1)
      const [props] = mockElement.mock.calls[0] as [{ style: Record<string, string> }]
      expect(props.style.backgroundColor).toBe('blue')
      expect(props.style.color).toBe('red')
    })

    it('should override existing styles with additional styles', () => {
      const mockElement = vi.fn().mockReturnValue({} as JSX.Element)
      const additionalStyles = { color: 'red' }
      const existingStyles = { color: 'blue' }

      const StyledComponent = styledShade(mockElement, additionalStyles)
      StyledComponent({ style: existingStyles })

      expect(mockElement).toHaveBeenCalledTimes(1)
      const [props] = mockElement.mock.calls[0] as [{ style: Record<string, string> }]
      expect(props.style.color).toBe('red')
    })

    it('should preserve original props', () => {
      const mockElement = vi.fn().mockReturnValue({} as JSX.Element)
      const additionalStyles = { color: 'red' }

      const StyledComponent = styledShade<{ className?: string; style?: Partial<CSSStyleDeclaration> }>(
        mockElement,
        additionalStyles,
      )
      StyledComponent({ className: 'my-class' })

      expect(mockElement).toHaveBeenCalledTimes(1)
      const [props] = mockElement.mock.calls[0] as [{ className: string; style: Record<string, string> }]
      expect(props.className).toBe('my-class')
      expect(props.style.color).toBe('red')
    })

    it('should pass children correctly', () => {
      const mockElement = vi.fn().mockReturnValue({} as JSX.Element)
      const additionalStyles = { color: 'red' }
      const children = ['child1', 'child2'] as unknown as JSX.Element[]

      const StyledComponent = styledShade(mockElement, additionalStyles)
      StyledComponent({}, children)

      expect(mockElement).toHaveBeenCalledTimes(1)
      const [, passedChildren] = mockElement.mock.calls[0] as [unknown, JSX.Element[]]
      expect(passedChildren).toBe(children)
    })

    it('should return a function that returns JSX.Element', () => {
      const expectedElement = { tagName: 'div' } as unknown as JSX.Element
      const mockElement = vi.fn().mockReturnValue(expectedElement)
      const additionalStyles = { color: 'red' }

      const StyledComponent = styledShade(mockElement, additionalStyles)
      const result = StyledComponent({})

      expect(result).toBe(expectedElement)
    })
  })
})
