import type { PartialElement } from '@furystack/shades'
import { Shade, createComponent } from '@furystack/shades'
import { cssVariableTheme } from '../services/css-variable-theme.js'
import { paletteMainColors } from '../services/palette-css-vars.js'
import type { Palette } from '../services/theme-provider-service.js'

/**
 * Props for a single timeline item.
 */
export type TimelineItemProps = PartialElement<HTMLElement> & {
  /** Palette color for the dot. Defaults to 'primary'. */
  color?: keyof Palette
  /** Custom dot content (e.g. an icon). Replaces the default filled circle. */
  dot?: JSX.Element
  /** Label displayed on the opposite side from the content (used in alternate or right mode). */
  label?: string
}

/**
 * A single item in a Timeline.
 * Renders a dot, a connector tail, and the item's content (children).
 */
export const TimelineItem = Shade<TimelineItemProps>({
  shadowDomName: 'shade-timeline-item',
  css: {
    display: 'flex',
    position: 'relative',
    minHeight: '64px',

    '& .timeline-label': {
      flex: '1',
      textAlign: 'right',
      paddingRight: cssVariableTheme.spacing.md,
      paddingTop: cssVariableTheme.spacing.xs,
      fontFamily: cssVariableTheme.typography.fontFamily,
      fontSize: cssVariableTheme.typography.fontSize.sm,
      lineHeight: cssVariableTheme.typography.lineHeight.normal,
      color: cssVariableTheme.text.secondary,
      boxSizing: 'border-box',
    },

    '& .timeline-dot-column': {
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      flexShrink: '0',
      width: '24px',
      paddingTop: cssVariableTheme.spacing.xs,
    },

    '& .timeline-dot-line': {
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      flexShrink: '0',
    },

    '& .timeline-dot-line::before': {
      content: '"\\200b"',
      fontSize: cssVariableTheme.typography.fontSize.sm,
      lineHeight: cssVariableTheme.typography.lineHeight.normal,
      fontFamily: cssVariableTheme.typography.fontFamily,
    },

    '& .timeline-dot': {
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      width: '12px',
      height: '12px',
      borderRadius: cssVariableTheme.shape.borderRadius.full,
      backgroundColor: 'var(--timeline-dot-color)',
      flexShrink: '0',
      zIndex: '1',
    },

    '& .timeline-dot[data-custom]': {
      width: 'auto',
      height: 'auto',
      backgroundColor: 'transparent',
      color: 'var(--timeline-dot-color)',
      fontSize: '20px',
      lineHeight: '1',
    },

    '& .timeline-tail': {
      flex: '1',
      width: '2px',
      backgroundColor: cssVariableTheme.divider,
      marginTop: cssVariableTheme.spacing.xs,
    },

    '& .timeline-tail[data-pending]': {
      borderLeft: `2px dashed ${cssVariableTheme.divider}`,
      backgroundColor: 'transparent',
      width: '0',
    },

    '& .timeline-content': {
      flex: '1',
      paddingTop: cssVariableTheme.spacing.xs,
      paddingLeft: cssVariableTheme.spacing.md,
      paddingBottom: cssVariableTheme.spacing.lg,
      fontFamily: cssVariableTheme.typography.fontFamily,
      fontSize: cssVariableTheme.typography.fontSize.sm,
      lineHeight: cssVariableTheme.typography.lineHeight.normal,
      color: cssVariableTheme.text.primary,
      boxSizing: 'border-box',
    },

    '&:last-of-type .timeline-tail': {
      display: 'none',
    },
  },
  render: ({ props, children, useHostProps }) => {
    const { color = 'primary', dot, label, style } = props

    const colors = paletteMainColors[color]
    useHostProps({
      style: {
        '--timeline-dot-color': colors.main,
        ...(style as Record<string, string>),
      },
    })

    const isPending = (props as Record<string, unknown>)['data-pending'] !== undefined

    return (
      <>
        <div className="timeline-label">{label}</div>
        <div className="timeline-dot-column">
          <div className="timeline-dot-line">
            <div className="timeline-dot" {...(dot ? { 'data-custom': '' } : {})}>
              {dot ?? null}
            </div>
          </div>
          <div className="timeline-tail" {...(isPending ? { 'data-pending': '' } : {})} />
        </div>
        <div className="timeline-content">{children}</div>
      </>
    )
  },
})

/**
 * Props for the Timeline container.
 */
export type TimelineProps = PartialElement<HTMLElement> & {
  /** Layout mode. 'left' places content on the right, 'right' on the left, 'alternate' switches sides. Defaults to 'left'. */
  mode?: 'left' | 'right' | 'alternate'
  /** Show a pending indicator on the last item. `true` shows a default "Loading..." text, a string/JSX shows custom content. */
  pending?: boolean | string | JSX.Element
}

/**
 * Timeline displays a list of events in chronological order.
 * Supports left, right, and alternate layout modes with optional pending state.
 */
export const Timeline = Shade<TimelineProps>({
  shadowDomName: 'shade-timeline',
  css: {
    display: 'flex',
    flexDirection: 'column',
    padding: `${cssVariableTheme.spacing.md} 0`,
    margin: '0',
    listStyle: 'none',
    fontFamily: cssVariableTheme.typography.fontFamily,

    '&[data-mode="right"] > shade-timeline-item .timeline-label': {
      display: 'block',
      textAlign: 'left',
      paddingRight: '0',
      paddingLeft: cssVariableTheme.spacing.md,
      order: '3',
    },
    '&[data-mode="right"] > shade-timeline-item .timeline-content': {
      textAlign: 'right',
      paddingLeft: '0',
      paddingRight: cssVariableTheme.spacing.md,
      order: '1',
    },
    '&[data-mode="right"] > shade-timeline-item .timeline-dot-column': {
      order: '2',
    },

    '&[data-mode="alternate"] > shade-timeline-item .timeline-label': {
      display: 'block',
    },
    '&[data-mode="alternate"] > shade-timeline-item:nth-of-type(even) .timeline-label': {
      textAlign: 'left',
      paddingRight: '0',
      paddingLeft: cssVariableTheme.spacing.md,
      order: '3',
    },
    '&[data-mode="alternate"] > shade-timeline-item:nth-of-type(even) .timeline-content': {
      textAlign: 'right',
      paddingLeft: '0',
      paddingRight: cssVariableTheme.spacing.md,
      order: '1',
    },
    '&[data-mode="alternate"] > shade-timeline-item:nth-of-type(even) .timeline-dot-column': {
      order: '2',
    },
  },
  render: ({ props, children, useHostProps }) => {
    const { mode = 'left', pending, style } = props

    useHostProps({
      'data-mode': mode,
      ...(style ? { style: style as Record<string, string> } : {}),
    })

    const pendingItem = pending ? (
      <TimelineItem
        color="info"
        dot={<span style={{ fontSize: cssVariableTheme.typography.fontSize.md }}>⏳</span>}
        data-pending=""
      >
        {pending === true ? 'Loading...' : pending}
      </TimelineItem>
    ) : null

    return (
      <>
        {children}
        {pendingItem}
      </>
    )
  },
})
