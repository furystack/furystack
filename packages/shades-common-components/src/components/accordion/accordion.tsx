import { Shade, createComponent } from '@furystack/shades'
import { cssVariableTheme } from '../../services/css-variable-theme.js'

let nextAccordionId = 0

/**
 * Props for the Accordion container component.
 */
export type AccordionProps = {
  /** Visual variant of the accordion container */
  variant?: 'outlined' | 'elevation'
  /**
   * Section name for spatial navigation scoping.
   * Sets `data-nav-section` on the accordion so that SpatialNavigationService
   * constrains arrow-key navigation within the accordion group.
   * Auto-generated per instance when not provided.
   */
  navSection?: string
}

/**
 * A container component that groups AccordionItem children with consistent styling.
 *
 * Provides a bordered or elevated surface with rounded corners. Use it to wrap
 * multiple AccordionItem components into a visually cohesive group.
 *
 * @example
 * ```tsx
 * <Accordion>
 *   <AccordionItem title="Section 1">Content 1</AccordionItem>
 *   <AccordionItem title="Section 2">Content 2</AccordionItem>
 * </Accordion>
 * ```
 */
export const Accordion = Shade<AccordionProps>({
  customElementName: 'shade-accordion',
  css: {
    display: 'flex',
    fontFamily: cssVariableTheme.typography.fontFamily,
    flexDirection: 'column',
    borderRadius: cssVariableTheme.shape.borderRadius.md,
    overflow: 'hidden',

    '&[data-variant="outlined"], &:not([data-variant])': {
      border: `1px solid color-mix(in srgb, ${cssVariableTheme.text.secondary} 20%, transparent)`,
    },

    '&[data-variant="elevation"]': {
      boxShadow: cssVariableTheme.shadows.md,
      background: cssVariableTheme.background.paper,
    },
  },
  render: ({ props, useHostProps, children, useState }) => {
    const [navSectionId] = useState('navSectionId', String(nextAccordionId++))

    useHostProps({
      'data-variant': props.variant || undefined,
      'data-nav-section': props.navSection ?? `accordion-${navSectionId}`,
    })

    return <>{children}</>
  },
})
