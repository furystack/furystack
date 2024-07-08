import { LocationService, Shade, attachProps, createComponent } from '@furystack/shades'
import { ThemeProviderService } from '../services/theme-provider-service.js'

export interface Tab {
  header: JSX.Element
  component: JSX.Element
  hash: string
}

const TabHeader = Shade<{ hash: string }>({
  shadowDomName: 'shade-tab-header',
  style: {
    padding: '1em 2.5em',
    cursor: 'pointer',
    transition: 'box-shadow 1s linear',
  },
  elementBase: HTMLAnchorElement,
  elementBaseName: 'a',
  render: ({ children, element, injector, props, useObservable }) => {
    const { theme } = injector.getInstance(ThemeProviderService)
    const locationService = injector.getInstance(LocationService)

    const [hash] = useObservable('updateLocation', locationService.onLocationHashChanged)
    const isActive = hash === props.hash

    attachProps(element, {
      style: {
        fontWeight: isActive ? 'bolder' : 'inherit',
        background: isActive ? theme.background.paper : theme.background.default,
        color: isActive ? theme.text.primary : theme.text.secondary,
        boxShadow: isActive ? `inset 0 -2px 0 ${theme.palette.primary.main}` : 'none',
      },
      href: `#${props.hash}`,
    })
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
  render: ({ props, element, useObservable, injector }) => {
    attachProps(element, {
      style: { width: '100%', height: '100%', display: 'flex', flexDirection: 'column', ...props.containerStyle },
    })

    const [hash] = useObservable('updateLocation', injector.getInstance(LocationService).onLocationHashChanged)
    const activeTab = props.tabs.find((t) => t.hash === hash.replace('#', ''))

    return (
      <>
        <div
          className="shade-tabs-header-container"
          style={{ display: 'inline-flex', borderRadius: '5px 5px 0 0', overflow: 'hidden', flexShrink: '0' }}
        >
          {props.tabs.map((tab) => (
            <TabHeader hash={tab.hash}>{tab.header}</TabHeader>
          ))}
        </div>
        {activeTab?.component}
      </>
    )
  },
})
