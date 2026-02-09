import { Shade, createComponent } from '@furystack/shades'
import { cssVariableTheme } from '../../services/css-variable-theme.js'

/**
 * Props for the Accordion container component.
 */
export type AccordionProps = {
  /** Visual variant of the accordion container */
  variant?: 'outlined' | 'elevation'
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
  shadowDomName: 'shade-accordion',
  css: {
    display: 'flex',
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
  render: ({ props, useHostProps, children }) => {
    useHostProps({
      'data-variant': props.variant || undefined,
    })

    return <>{children}</>
  },
})
