import { LocationService, Shade, createComponent } from '@furystack/shades'
import { cssVariableTheme } from '../services/css-variable-theme.js'

export interface Tab {
  header: JSX.Element
  component: JSX.Element
  hash: string
}

const TabHeader = Shade<{ hash: string }>({
  shadowDomName: 'shade-tab-header',
  css: {
    padding: '1em 2.5em',
    cursor: 'pointer',
    transition: 'box-shadow 0.3s ease, background 0.3s ease, color 0.3s ease, font-weight 0.3s ease',
    fontWeight: 'inherit',
    background: cssVariableTheme.background.default,
    color: cssVariableTheme.text.secondary,
    boxShadow: 'none',
    '&.active': {
      fontWeight: 'bolder',
      background: cssVariableTheme.background.paper,
      color: cssVariableTheme.text.primary,
      boxShadow: `inset 0 -2px 0 ${cssVariableTheme.palette.primary.main}`,
    },
  },
  elementBase: HTMLAnchorElement,
  elementBaseName: 'a',
  render: ({ children, element, injector, props, useObservable }) => {
    const locationService = injector.getInstance(LocationService)

    const [hash] = useObservable('updateLocation', locationService.onLocationHashChanged)
    const isActive = hash === props.hash

    element.classList.toggle('active', isActive)
    element.setAttribute('href', `#${props.hash}`)

    return <>{children}</>
  },
})

export const Tabs = Shade<{
  tabs: Tab[]
  containerStyle?: Partial<CSSStyleDeclaration>
  style?: Partial<CSSStyleDeclaration>
  onChange?: (page: number) => void
}>({
  shadowDomName: 'shade-tabs',
  css: {
    width: '100%',
    height: '100%',
    display: 'flex',
    flexDirection: 'column',
    '& .shade-tabs-header-container': {
      display: 'inline-flex',
      borderRadius: '5px 5px 0 0',
      overflow: 'hidden',
      flexShrink: '0',
    },
  },
  render: ({ props, element, useObservable, injector }) => {
    if (props.containerStyle) {
      Object.assign(element.style, props.containerStyle)
    }

    const [hash] = useObservable('updateLocation', injector.getInstance(LocationService).onLocationHashChanged)
    const activeTab = props.tabs.find((t) => t.hash === hash.replace('#', ''))

    return (
      <>
        <div className="shade-tabs-header-container">
          {props.tabs.map((tab) => (
            <TabHeader hash={tab.hash}>{tab.header}</TabHeader>
          ))}
        </div>
        {activeTab?.component}
      </>
    )
  },
})
