import { Shade, createComponent } from '@furystack/shades'
import { buildTransition, cssVariableTheme } from '../../services/css-variable-theme.js'
import { collapse, expand } from '../animations.js'
import { Icon } from '../icons/icon.js'
import { chevronDown } from '../icons/icon-definitions.js'

/**
 * Props for the AccordionItem component.
 */
export type AccordionItemProps = {
  /** The header content displayed in the clickable toggle area */
  title: JSX.Element | string
  /** Whether the item starts in the expanded state. Defaults to false */
  defaultExpanded?: boolean
  /** Whether the item is disabled (non-interactive) */
  disabled?: boolean
  /** Optional icon displayed before the title */
  icon?: JSX.Element | string
}

/**
 * An individual collapsible section for use within an Accordion container.
 *
 * Supports animated expand/collapse, keyboard accessibility, and optional icon.
 *
 * @example
 * ```tsx
 * <AccordionItem title="Section 1" defaultExpanded>
 *   <p>Content goes here</p>
 * </AccordionItem>
 * ```
 */
export const AccordionItem = Shade<AccordionItemProps>({
  tagName: 'shade-accordion-item',
  css: {
    display: 'block',
    fontFamily: cssVariableTheme.typography.fontFamily,

    '&:not(:last-child)': {
      borderBottom: `1px solid color-mix(in srgb, ${cssVariableTheme.text.secondary} 20%, transparent)`,
    },

    // Header
    '& .accordion-header': {
      display: 'flex',
      alignItems: 'center',
      gap: cssVariableTheme.spacing.sm,
      padding: `${cssVariableTheme.spacing.md} ${cssVariableTheme.spacing.lg}`,
      cursor: 'pointer',
      userSelect: 'none',
      backgroundColor: 'transparent',
      border: 'none',
      width: '100%',
      textAlign: 'left',
      outline: 'none',
      color: 'inherit',
      transition: buildTransition([
        'background-color',
        cssVariableTheme.transitions.duration.fast,
        cssVariableTheme.transitions.easing.default,
      ]),
    },

    '& .accordion-header:hover:not([data-disabled])': {
      backgroundColor: `color-mix(in srgb, ${cssVariableTheme.text.secondary} 8%, transparent)`,
    },

    '& .accordion-header:focus-visible': {
      boxShadow: cssVariableTheme.action.focusRing,
    },

    // Icon
    '& .accordion-icon': {
      display: 'inline-flex',
      alignItems: 'center',
      flexShrink: '0',
      fontSize: '1.2em',
    },

    // Title
    '& .accordion-title': {
      flex: '1',
      fontSize: cssVariableTheme.typography.fontSize.md,
      fontWeight: cssVariableTheme.typography.fontWeight.medium,
      color: cssVariableTheme.text.primary,
    },

    // Chevron
    '& .accordion-chevron': {
      display: 'inline-flex',
      alignItems: 'center',
      justifyContent: 'center',
      flexShrink: '0',
      fontSize: '1.2em',
      color: cssVariableTheme.text.secondary,
      transform: 'rotate(-90deg)',
      transition: buildTransition([
        'transform',
        cssVariableTheme.transitions.duration.fast,
        cssVariableTheme.transitions.easing.default,
      ]),
    },

    '&[data-expanded] .accordion-chevron': {
      transform: 'rotate(0deg)',
    },

    // Content wrapper (animated)
    '& .accordion-content': {
      overflow: 'hidden',
    },

    // Content inner (provides padding)
    '& .accordion-content-inner': {
      padding: `0 ${cssVariableTheme.spacing.lg} ${cssVariableTheme.spacing.lg}`,
    },

    // Disabled state
    '&[data-disabled]': {
      opacity: cssVariableTheme.action.disabledOpacity,
      pointerEvents: 'none',
    },

    '&[data-disabled] .accordion-header': {
      cursor: 'not-allowed',
    },
  },

  render: ({ props, element, children }) => {
    // Initialize expanded state on first render
    if (!element.hasAttribute('data-initialized')) {
      element.setAttribute('data-initialized', '')
      if (props.defaultExpanded) {
        element.setAttribute('data-expanded', '')
      }
    }

    if (props.disabled) {
      element.setAttribute('data-disabled', '')
    } else {
      element.removeAttribute('data-disabled')
    }

    const isExpanded = element.hasAttribute('data-expanded')

    const handleToggle = async () => {
      if (props.disabled) return
      const content = element.querySelector('.accordion-content')
      if (!content) return

      if (element.hasAttribute('data-expanded')) {
        element.removeAttribute('data-expanded')
        await collapse(content, { duration: 250 })
      } else {
        element.setAttribute('data-expanded', '')
        await expand(content, { duration: 250 })
      }
    }

    const handleKeyDown = (ev: KeyboardEvent) => {
      if (ev.key === 'Enter' || ev.key === ' ') {
        ev.preventDefault()
        void handleToggle()
      }
    }

    const headerEl = (
      <div
        className="accordion-header"
        role="button"
        tabIndex={props.disabled ? -1 : 0}
        onclick={handleToggle}
        onkeydown={handleKeyDown}
      >
        {props.icon ? <span className="accordion-icon">{props.icon}</span> : null}
        <span className="accordion-title">{props.title}</span>
        <span className="accordion-chevron">
          <Icon icon={chevronDown} size={16} />
        </span>
      </div>
    ) as unknown as HTMLDivElement

    headerEl.setAttribute('aria-expanded', String(isExpanded))
    if (props.disabled) {
      headerEl.setAttribute('data-disabled', '')
    }

    return (
      <>
        {headerEl}
        <div
          className="accordion-content"
          style={{
            height: isExpanded ? undefined : '0px',
            opacity: isExpanded ? '1' : '0',
          }}
        >
          <div className="accordion-content-inner">{children}</div>
        </div>
      </>
    )
  },
})
