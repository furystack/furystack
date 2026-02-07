import { createComponent, Shade } from '@furystack/shades'
import { cssVariableTheme } from '../services/css-variable-theme.js'
import type { NotyModel } from '../services/noty-service.js'
import { NotyService } from '../services/noty-service.js'
import { ThemeProviderService } from '../services/theme-provider-service.js'
import { promisifyAnimation } from '../utils/promisify-animation.js'

export const getDefaultNotyTimeouts = (type: NotyModel['type']) => {
  switch (type) {
    case 'error':
      return 0
    case 'warning':
      return 0
    case 'success':
      return 5000
    case 'info':
      return 20000
    default:
      return 0
  }
}

export const NotyComponent = Shade<{ model: NotyModel; onDismiss: () => void }>({
  shadowDomName: 'shade-noty',
  constructed: ({ element }) => {
    setTimeout(() => {
      const height = element.scrollHeight || 60
      void promisifyAnimation(
        element,
        [
          { opacity: '0', height: '0px' },
          { opacity: '1', height: `${height}px` },
        ],
        {
          fill: 'forwards',
          duration: 500,
          easing: 'cubic-bezier(0.190, 1.000, 0.220, 1.000)',
        },
      )
    })
  },
  css: {
    margin: '6px',
    overflow: 'hidden',
    borderRadius: cssVariableTheme.shape.borderRadius.md,
    boxShadow: cssVariableTheme.shadows.sm,
    width: '300px',
    display: 'flex',
    flexDirection: 'column',
    height: '0px',
    '& .noty-header': {
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'center',
      padding: '8px 8px 0 12px',
    },
    '& .noty-title': {
      whiteSpace: 'nowrap',
      overflow: 'hidden',
      textOverflow: 'ellipsis',
      margin: '0',
      fontSize: '0.85em',
      fontWeight: cssVariableTheme.typography.fontWeight.semibold,
    },
    '& .dismiss-button': {
      margin: '0',
      padding: '4px',
      fontSize: cssVariableTheme.typography.fontSize.md,
      minWidth: 'auto',
      background: 'transparent',
      border: 'none',
      cursor: 'pointer',
      opacity: '0.7',
      transition: `opacity ${cssVariableTheme.transitions.duration.fast} ease`,
      lineHeight: '1',
    },
    '& .dismiss-button:hover': {
      opacity: '1',
    },
    '& .noty-body': {
      padding: '6px 12px 10px 12px',
      fontSize: '0.8em',
      lineHeight: '1.4',
    },
  },
  render: ({ props, injector, element }) => {
    const themeProvider = injector.getInstance(ThemeProviderService)
    const colors = themeProvider.theme.palette[props.model.type]
    const textColor = themeProvider.getTextColor(colors.main)

    const removeSelf = async () => {
      await promisifyAnimation(
        element,
        [
          { opacity: '1', height: `${element?.scrollHeight || 0}px`, margin: '6px 6px' },
          { opacity: '0', height: '0px', margin: '0px 6px' },
        ],
        {
          fill: 'forwards',
          duration: 500,
          easing: 'cubic-bezier(0.190, 1.000, 0.220, 1.000)',
        },
      )
      props.onDismiss()
    }

    const timeout = props.model.timeout || getDefaultNotyTimeouts(props.model.type)
    if (timeout) {
      setTimeout(() => void removeSelf(), timeout)
    }

    element.className = `noty ${props.model.type}`
    element.style.backgroundColor = colors.main
    element.style.color = textColor

    return (
      <>
        <div className="noty-header">
          <span className="noty-title" title={props.model.title}>
            {props.model.title}
          </span>
          <button className="dismiss-button" onclick={removeSelf} title="Close" style={{ color: textColor }}>
            ✕
          </button>
        </div>
        <div className="noty-body">{props.model.body}</div>
      </>
    )
  },
})

export const NotyList = Shade({
  shadowDomName: 'shade-noty-list',
  css: {
    position: 'fixed',
    bottom: cssVariableTheme.spacing.md,
    right: cssVariableTheme.spacing.md,
    display: 'flex',
    flexDirection: 'column',
  },
  render: ({ useDisposable, injector, element }) => {
    const notyService = injector.getInstance(NotyService)

    const currentNotys = notyService.getNotyList()

    useDisposable('addNoty', () =>
      notyService.subscribe('onNotyAdded', (n) =>
        element.append(<NotyComponent model={n} onDismiss={() => notyService.emit('onNotyRemoved', n)} />),
      ),
    )

    useDisposable('removeNoty', () =>
      notyService.subscribe('onNotyRemoved', (n) => {
        element.querySelectorAll('shade-noty').forEach((e) => {
          if ((e as JSX.Element<{ model?: NotyModel }>).props.model === n) {
            e.remove()
          }
        })
      }),
    )

    return (
      <>
        {currentNotys.map((n) => (
          <NotyComponent model={n} onDismiss={() => injector.getInstance(NotyService).emit('onNotyRemoved', n)} />
        ))}
      </>
    )
  },
})
