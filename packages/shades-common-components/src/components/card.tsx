import type { PartialElement } from '@furystack/shades'
import { Shade, createComponent } from '@furystack/shades'
import { buildTransition, cssVariableTheme } from '../services/css-variable-theme.js'

/**
 * Props for the Card component.
 */
export type CardProps = PartialElement<HTMLElement> & {
  /** Shadow elevation level. Ignored when variant is 'outlined'. */
  elevation?: 0 | 1 | 2 | 3
  /** Visual variant of the card */
  variant?: 'elevation' | 'outlined'
  /** Whether the card is interactive (shows hover effects) */
  clickable?: boolean
}

/**
 * A versatile surface component for grouping related content and actions.
 * Supports elevation and outlined variants with optional hover interactions.
 *
 * Compose with CardHeader, CardContent, CardMedia, and CardActions for structured layouts.
 */
export const Card = Shade<CardProps>({
  shadowDomName: 'shade-card',
  css: {
    display: 'flex',
    flexDirection: 'column',
    borderRadius: cssVariableTheme.shape.borderRadius.md,
    backgroundColor: cssVariableTheme.background.paper,
    color: cssVariableTheme.text.primary,
    overflow: 'hidden',
    transition: buildTransition(
      ['box-shadow', cssVariableTheme.transitions.duration.normal, cssVariableTheme.transitions.easing.default],
      ['transform', cssVariableTheme.transitions.duration.normal, cssVariableTheme.transitions.easing.default],
    ),

    // Elevation variant shadows
    '&[data-variant="elevation"][data-elevation="0"]': {
      boxShadow: cssVariableTheme.shadows.none,
    },
    '&[data-variant="elevation"][data-elevation="1"]': {
      boxShadow: cssVariableTheme.shadows.sm,
    },
    '&[data-variant="elevation"][data-elevation="2"]': {
      boxShadow: cssVariableTheme.shadows.md,
    },
    '&[data-variant="elevation"][data-elevation="3"]': {
      boxShadow: cssVariableTheme.shadows.lg,
    },

    // Outlined variant
    '&[data-variant="outlined"]': {
      boxShadow: cssVariableTheme.shadows.none,
      border: `1px solid ${cssVariableTheme.action.subtleBorder}`,
    },

    // Clickable state
    '&[data-clickable]': {
      cursor: 'pointer',
    },
    '&[data-clickable]:hover': {
      transform: 'translateY(-2px)',
    },
    '&[data-clickable][data-variant="elevation"]:hover': {
      boxShadow: cssVariableTheme.shadows.lg,
    },
    '&[data-clickable][data-variant="outlined"]:hover': {
      borderColor: cssVariableTheme.text.secondary,
    },
  },
  render: ({ props, children, element }) => {
    const { elevation = 1, variant = 'elevation', clickable, style, ...rest } = props

    element.setAttribute('data-variant', variant)
    element.setAttribute('data-elevation', elevation.toString())

    if (clickable || rest.onclick) {
      element.setAttribute('data-clickable', '')
    } else {
      element.removeAttribute('data-clickable')
    }

    if (style) {
      Object.assign(element.style, style)
    }

    return <>{children}</>
  },
})

/**
 * Props for the CardHeader component.
 */
export type CardHeaderProps = PartialElement<HTMLElement> & {
  /** Title text displayed in the header */
  title: string
  /** Optional secondary text below the title */
  subheader?: string
  /** Optional element rendered on the left (e.g. Avatar) */
  avatar?: JSX.Element
  /** Optional element rendered on the right (e.g. icon button) */
  action?: JSX.Element
}

/**
 * Displays a title, optional subheader, avatar, and action area at the top of a Card.
 */
export const CardHeader = Shade<CardHeaderProps>({
  shadowDomName: 'shade-card-header',
  css: {
    display: 'flex',
    alignItems: 'center',
    padding: cssVariableTheme.spacing.md,
    gap: cssVariableTheme.spacing.md,

    '& .card-header-avatar': {
      flexShrink: '0',
    },

    '& .card-header-content': {
      flex: '1',
      minWidth: '0',
    },

    '& .card-header-title': {
      margin: '0',
      fontFamily: cssVariableTheme.typography.fontFamily,
      fontSize: cssVariableTheme.typography.fontSize.lg,
      fontWeight: cssVariableTheme.typography.fontWeight.semibold,
      lineHeight: cssVariableTheme.typography.lineHeight.tight,
      color: cssVariableTheme.text.primary,
      overflow: 'hidden',
      textOverflow: 'ellipsis',
      whiteSpace: 'nowrap',
    },

    '& .card-header-subheader': {
      margin: '0',
      marginTop: cssVariableTheme.spacing.xs,
      fontFamily: cssVariableTheme.typography.fontFamily,
      fontSize: cssVariableTheme.typography.fontSize.sm,
      fontWeight: cssVariableTheme.typography.fontWeight.normal,
      lineHeight: cssVariableTheme.typography.lineHeight.normal,
      color: cssVariableTheme.text.secondary,
      overflow: 'hidden',
      textOverflow: 'ellipsis',
      whiteSpace: 'nowrap',
    },

    '& .card-header-action': {
      flexShrink: '0',
      marginLeft: 'auto',
      alignSelf: 'flex-start',
    },
  },
  render: ({ props }) => {
    const { title, subheader, avatar, action } = props

    return (
      <>
        {avatar ? <div className="card-header-avatar">{avatar}</div> : null}
        <div className="card-header-content">
          <div className="card-header-title">{title}</div>
          {subheader ? <div className="card-header-subheader">{subheader}</div> : null}
        </div>
        {action ? <div className="card-header-action">{action}</div> : null}
      </>
    )
  },
})

/**
 * Props for the CardContent component.
 */
export type CardContentProps = PartialElement<HTMLElement>

/**
 * Provides padded content area within a Card.
 */
export const CardContent = Shade<CardContentProps>({
  shadowDomName: 'shade-card-content',
  css: {
    display: 'block',
    padding: `0 ${cssVariableTheme.spacing.md} ${cssVariableTheme.spacing.md}`,
    fontFamily: cssVariableTheme.typography.fontFamily,
    fontSize: cssVariableTheme.typography.fontSize.md,
    lineHeight: cssVariableTheme.typography.lineHeight.normal,
    color: cssVariableTheme.text.secondary,

    '&:first-child': {
      paddingTop: cssVariableTheme.spacing.md,
    },
  },
  render: ({ children }) => {
    return <>{children}</>
  },
})

/**
 * Props for the CardMedia component.
 */
export type CardMediaProps = PartialElement<HTMLElement> & {
  /** URL of the image to display */
  image: string
  /** Accessible alt text for the image */
  alt?: string
  /** Fixed height for the media area */
  height?: string
}

/**
 * Displays an image or media element within a Card.
 */
export const CardMedia = Shade<CardMediaProps>({
  shadowDomName: 'shade-card-media',
  css: {
    display: 'block',
    overflow: 'hidden',

    '& img': {
      display: 'block',
      width: '100%',
      height: '100%',
      objectFit: 'cover',
      objectPosition: 'center',
    },
  },
  render: ({ props, element }) => {
    const { image, alt = '', height = '200px' } = props

    element.style.height = height

    return <img src={image} alt={alt} />
  },
})

/**
 * Props for the CardActions component.
 */
export type CardActionsProps = PartialElement<HTMLElement> & {
  /** Align actions at the end instead of the start */
  disableSpacing?: boolean
}

/**
 * Provides a row of actions (buttons, links) at the bottom of a Card.
 */
export const CardActions = Shade<CardActionsProps>({
  shadowDomName: 'shade-card-actions',
  css: {
    display: 'flex',
    alignItems: 'center',
    padding: cssVariableTheme.spacing.sm,
    gap: cssVariableTheme.spacing.sm,

    '&[data-disable-spacing]': {
      justifyContent: 'flex-end',
    },
  },
  render: ({ props, children, element }) => {
    const { disableSpacing } = props

    if (disableSpacing) {
      element.setAttribute('data-disable-spacing', '')
    } else {
      element.removeAttribute('data-disable-spacing')
    }

    return <>{children}</>
  },
})
