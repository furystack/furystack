import { Shade, createComponent, LocationService, attachProps } from '@furystack/shades'
import { ThemeProviderService } from '../services'

export interface Tab {
  header: JSX.Element
  component: JSX.Element
}

const TabHeader = Shade<{ isActive?: boolean; onActivate: () => void }>({
  shadowDomName: 'shade-tab-header',
  render: ({ children, element, injector, props }) => {
    const { theme } = injector.getInstance(ThemeProviderService)
    const { isActive } = props

    attachProps(element, {
      style: {
        padding: '1em 2.5em',
        cursor: 'pointer',
        transition: 'box-shadow 1s linear',
        fontWeight: isActive ? 'bolder' : 'inherit',
        background: isActive ? theme.background.paper : theme.background.default,
        color: isActive ? theme.text.primary : theme.text.secondary,
        boxShadow: isActive ? `inset 0 -2px 0 ${theme.palette.primary.main}` : 'none',
      },
      onclick: props.onActivate,
    })
    return <>{children}</>
  },
})

export const Tabs = Shade<
  {
    tabs: Tab[]
    containerStyle?: Partial<CSSStyleDeclaration>
    style?: Partial<CSSStyleDeclaration>
    activeTab?: number
    onChange?: (page: number) => void
  },
  { activeIndex: number }
>({
  shadowDomName: 'shade-tabs',
  getInitialState: ({ props }) => ({ activeIndex: props.activeTab || 0 }),

  resources: ({ injector, useState }) => {
    const [, setActivePage] = useState('activeIndex')
    return [
      injector.getInstance(LocationService).onLocationPathChanged.subscribe(() => {
        const { hash } = location
        if (hash && hash.startsWith('#tab-')) {
          const page = parseInt(hash.replace('#tab-', ''), 10)
          !isNaN(page) && setActivePage(page)
        }
      }, true),
    ]
  },
  render: ({ props, useState, element }) => {
    attachProps(element, {
      style: { width: '100%', height: '100%', display: 'flex', flexDirection: 'column', ...props.containerStyle },
    })
    const [activePage, setActivePage] = useState('activeIndex')
    return (
      <>
        <div
          className="shade-tabs-header-container"
          style={{ display: 'inline-flex', borderRadius: '5px 5px 0 0', overflow: 'hidden', flexShrink: '0' }}
        >
          {props.tabs.map((tab, index) => {
            const isActive = index === activePage

            return (
              <TabHeader
                isActive={isActive}
                onActivate={() => {
                  window.history.pushState({}, '', `#tab-${index}`)
                  setActivePage(index)
                }}
              >
                {tab.header}
              </TabHeader>
            )
          })}
        </div>
        {props.tabs[activePage].component}
      </>
    )
  },
})
