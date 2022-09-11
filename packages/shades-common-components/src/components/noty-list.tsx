import { createComponent, Shade } from '@furystack/shades'
import { NotyModel, NotyService } from '../services/noty-service'
import { ThemeProviderService } from '../services/theme-provider-service'
import { promisifyAnimation } from '../utils'
import { Button } from './button'

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
      const container = element.querySelector('div')
      const height = container?.scrollHeight || 80
      promisifyAnimation(
        container,
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
  render: ({ props, injector, element }) => {
    const themeProvider = injector.getInstance(ThemeProviderService)
    const colors = themeProvider.theme.getValue().palette[props.model.type]
    const headerTextColor = themeProvider.getTextColor(colors.dark)
    const textColor = themeProvider.getTextColor(colors.main)

    const removeSelf = async () => {
      const container = element.querySelector('div')
      await promisifyAnimation(
        container,
        [
          { opacity: '1', height: `${container?.scrollHeight || 0}px` },
          { opacity: '0', height: '0px' },
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
      setTimeout(removeSelf, timeout)
    }

    return (
      <div
        className={`noty ${props.model.type}`}
        style={{
          width: '300px',
          display: 'flex',
          flexDirection: 'column',
          height: '0px',
          backgroundColor: colors.main,
          color: textColor,
          margin: '8px',
          overflow: 'hidden',
          borderRadius: '6px',
          boxShadow: '1px 3px 6px rgba(0,0,0,0.3)',
        }}
      >
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            padding: '0px 6px 0px 16px',
            backgroundColor: colors.dark,
            color: headerTextColor,
            fontSize: '1.3em',
          }}
        >
          <h5
            style={{
              whiteSpace: 'nowrap',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              margin: '0',
              fontSize: '.7em',
            }}
            title={props.model.title}
          >
            {props.model.title}
          </h5>
          <Button
            style={{ margin: '4px 0', padding: '0 4px', fontSize: '12px' }}
            className="dismissNoty"
            onclick={removeSelf}
            title="Close Notification"
            variant="contained"
            color={props.model.type}
          >
            ✖
          </Button>
        </div>
        <div style={{ padding: '16px 16px' }}>{props.model.body}</div>
      </div>
    )
  },
})

export const NotyList = Shade<unknown, { currentNotys: NotyModel[] }>({
  getInitialState: ({ injector }) => ({ currentNotys: injector.getInstance(NotyService).notys.getValue() }),
  constructed: ({ injector, element }) => {
    const notyService = injector.getInstance(NotyService)
    const observables = [
      notyService.onNotyAdded.subscribe((n) => {
        element.querySelector('div')?.append(<NotyComponent model={n} onDismiss={() => notyService.removeNoty(n)} />)
      }),
      notyService.onNotyRemoved.subscribe((n) => {
        element.querySelectorAll('shade-noty').forEach((e) => {
          if ((e as JSX.Element).props.model === n) {
            e.remove()
          }
        })
      }),
    ]
    return () => observables.forEach((o) => o.dispose())
  },
  shadowDomName: 'shade-noty-list',
  render: ({ getState, injector }) => {
    return (
      <div
        style={{
          position: 'fixed',
          bottom: '1em',
          right: '1em',
          display: 'flex',
          flexDirection: 'column',
        }}
      >
        {getState().currentNotys.map((n) => (
          <NotyComponent model={n} onDismiss={() => injector.getInstance(NotyService).removeNoty(n)} />
        ))}
      </div>
    )
  },
})
