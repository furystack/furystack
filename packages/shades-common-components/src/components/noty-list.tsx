import { createComponent, Shade } from '@furystack/shades'
import type { NotyModel } from '../services/noty-service.js'
import { NotyService } from '../services/noty-service.js'
import { ThemeProviderService } from '../services/theme-provider-service.js'
import { promisifyAnimation } from '../utils/promisify-animation.js'
import { Button } from './button.js'

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
      const height = element.scrollHeight || 80
      void promisifyAnimation(
        element,
        [
          { opacity: '0', height: '0px' },
          { opacity: '1', height: `${height}px` },
        ],
        {
          fill: 'forwards',
          duration: 700,
          easing: 'cubic-bezier(0.190, 1.000, 0.220, 1.000)',
        },
      )
    })
  },
  style: {
    margin: '8px',
    overflow: 'hidden',
    borderRadius: '12px',
    boxShadow: '0 4px 12px rgba(0, 0, 0, 0.15), 0 1px 3px rgba(0, 0, 0, 0.08)',
    width: '340px',
    display: 'flex',
    flexDirection: 'column',
    height: '0px',
    border: '1px solid rgba(0, 0, 0, 0.1)',
    backdropFilter: 'blur(10px)',
  },
  render: ({ props, injector, element }) => {
    const themeProvider = injector.getInstance(ThemeProviderService)
    const colors = themeProvider.theme.palette[props.model.type]
    const headerTextColor = themeProvider.getTextColor(colors.dark)
    const textColor = themeProvider.getTextColor(colors.main)

    const removeSelf = async () => {
      await promisifyAnimation(
        element,
        [
          { opacity: '1', height: `${element?.scrollHeight || 0}px`, margin: '8px 8px' },
          { opacity: '0', height: '0px', margin: '0px 8px' },
        ],
        {
          fill: 'forwards',
          duration: 700,
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
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            padding: '12px 12px 12px 20px',
            backgroundColor: colors.dark,
            color: headerTextColor,
            borderBottom: '1px solid rgba(0, 0, 0, 0.1)',
          }}
        >
          <h5
            style={{
              whiteSpace: 'nowrap',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              margin: '0',
              fontSize: '0.95em',
              fontWeight: '600',
              letterSpacing: '0.01em',
            }}
            title={props.model.title}
          >
            {props.model.title}
          </h5>
          <Button
            style={{
              margin: '0',
              padding: '4px 8px',
              fontSize: '16px',
              minWidth: '28px',
              opacity: '0.8',
              transition: 'opacity 0.2s ease',
            }}
            className="dismissNoty"
            onmouseenter={(e: MouseEvent) => {
              ;(e.currentTarget as HTMLElement).style.opacity = '1'
            }}
            onmouseleave={(e: MouseEvent) => {
              ;(e.currentTarget as HTMLElement).style.opacity = '0.8'
            }}
            onclick={removeSelf}
            title="Close Notification"
            variant="contained"
            color={props.model.type}
          >
            ✖
          </Button>
        </div>
        <div
          style={{
            padding: '16px 20px 18px 20px',
            fontSize: '0.9em',
            lineHeight: '1.5',
            fontWeight: '400',
          }}
        >
          {props.model.body}
        </div>
      </>
    )
  },
})

export const NotyList = Shade({
  shadowDomName: 'shade-noty-list',
  style: {
    position: 'fixed',
    bottom: '1em',
    right: '1em',
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
