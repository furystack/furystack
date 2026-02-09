import { createComponent, Shade } from '@furystack/shades'
import { cssVariableTheme } from '../services/css-variable-theme.js'
import type { NotyModel } from '../services/noty-service.js'
import { NotyService } from '../services/noty-service.js'
import { ThemeProviderService } from '../services/theme-provider-service.js'
import { promisifyAnimation } from '../utils/promisify-animation.js'
import { Icon } from './icons/icon.js'
import { close } from './icons/icon-definitions.js'

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
  css: {
    margin: cssVariableTheme.spacing.xs,
    overflow: 'hidden',
    borderRadius: cssVariableTheme.shape.borderRadius.md,
    boxShadow: cssVariableTheme.shadows.sm,
    width: '300px',
    display: 'flex',
    flexDirection: 'column',
    height: '0px',
    backgroundColor: 'var(--noty-bg)',
    color: 'var(--noty-text)',
    '& .noty-header': {
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'center',
      padding: `${cssVariableTheme.spacing.sm} ${cssVariableTheme.spacing.sm} 0 ${cssVariableTheme.spacing.sm}`,
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
      padding: cssVariableTheme.spacing.xs,
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
      padding: `${cssVariableTheme.spacing.xs} ${cssVariableTheme.spacing.sm} ${cssVariableTheme.spacing.sm} ${cssVariableTheme.spacing.sm}`,
      fontSize: '0.8em',
      lineHeight: '1.4',
    },
  },
  render: ({ props, injector, useDisposable, useHostProps, useRef }) => {
    const wrapperRef = useRef<HTMLDivElement>('wrapper')

    useDisposable('enter-animation', () => {
      setTimeout(() => {
        const hostEl = wrapperRef.current?.closest('shade-noty') as HTMLElement | null
        if (!hostEl) return
        const height = hostEl.scrollHeight || 60
        void promisifyAnimation(
          hostEl,
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
      return { [Symbol.dispose]: () => {} }
    })

    const themeProvider = injector.getInstance(ThemeProviderService)
    const colors = themeProvider.theme.palette[props.model.type]
    const textColor = themeProvider.getTextColor(colors.main)

    const removeSelf = async () => {
      const hostEl = wrapperRef.current?.closest('shade-noty') as HTMLElement | null
      await promisifyAnimation(
        hostEl,
        [
          { opacity: '1', height: `${hostEl?.scrollHeight || 0}px`, margin: '6px 6px' },
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

    useHostProps({
      'data-noty-type': props.model.type,
      style: { '--noty-bg': colors.main, '--noty-text': textColor },
    })

    return (
      <div ref={wrapperRef} style={{ display: 'contents' }}>
        <div className="noty-header">
          <span className="noty-title" title={props.model.title}>
            {props.model.title}
          </span>
          <button className="dismiss-button" onclick={removeSelf} title="Close" style={{ color: 'inherit' }}>
            <Icon icon={close} size={14} />
          </button>
        </div>
        <div className="noty-body">{props.model.body}</div>
      </div>
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
  render: ({ useDisposable, injector, useRef }) => {
    const notyService = injector.getInstance(NotyService)
    const containerRef = useRef<HTMLDivElement>('container')

    const currentNotys = notyService.getNotyList()

    useDisposable('addNoty', () =>
      notyService.subscribe('onNotyAdded', (n) =>
        containerRef.current?.append(
          <NotyComponent model={n} onDismiss={() => notyService.emit('onNotyRemoved', n)} />,
        ),
      ),
    )

    useDisposable('removeNoty', () =>
      notyService.subscribe('onNotyRemoved', (n) => {
        const notys = containerRef.current?.querySelectorAll('shade-noty') || []
        notys.forEach((e) => {
          if ((e as JSX.Element<{ model?: NotyModel }>).props.model === n) {
            e.remove()
          }
        })
      }),
    )

    return (
      <div ref={containerRef} style={{ display: 'contents' }}>
        {currentNotys.map((n) => (
          <NotyComponent model={n} onDismiss={() => injector.getInstance(NotyService).emit('onNotyRemoved', n)} />
        ))}
      </div>
    )
  },
})
