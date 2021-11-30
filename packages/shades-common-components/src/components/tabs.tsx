import { Shade, createComponent, LocationService } from '@furystack/shades'
import { ThemeProviderService } from '../services'
import { promisifyAnimation } from '../utils/promisify-animation'

export interface Tab {
  header: JSX.Element
  component: JSX.Element
}

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
  constructed: ({ injector, updateState, element }) => {
    const subscriptions = [
      injector.getInstance(LocationService).onLocationChanged.subscribe((loc) => {
        if (loc.hash && loc.hash.startsWith('#tab-')) {
          const page = parseInt(loc.hash.replace('#tab-', ''), 10)
          page && updateState({ activeIndex: page })
        }
      }, true),
      injector.getInstance(ThemeProviderService).theme.subscribe((t) => {
        const headers = element.querySelectorAll('.shade-tabs-headers') as unknown as HTMLDivElement[]
        headers.forEach((header) => {
          const isActive = header.classList.contains('active')
          header.style.backgroundColor = isActive ? t.background.paper : t.background.default
          header.style.color = isActive ? t.text.primary : t.text.secondary
        })
      }),
    ]
    return () => subscriptions.forEach((s) => s.dispose())
  },
  render: ({ props, getState, updateState, injector }) => {
    const themeProvider = injector.getInstance(ThemeProviderService)
    const theme = themeProvider.theme.getValue()
    return (
      <div style={{ width: '100%', height: '100%', display: 'flex', flexDirection: 'column', ...props.containerStyle }}>
        <div
          className="shade-tabs-header-container"
          style={{ display: 'inline-flex', borderRadius: '5px 5px 0 0', overflow: 'hidden', flexShrink: '0' }}
        >
          {props.tabs.map((tab, index) => {
            const isActive = index === getState().activeIndex
            const jsxElement = (
              <div
                className={`shade-tabs-headers${isActive ? 'active' : ''}`}
                style={{
                  padding: '1em 2.5em',
                  cursor: 'pointer',
                  transition: 'box-shadow 1s linear',
                  fontWeight: isActive ? 'bolder' : 'inherit',
                  background: isActive ? theme.background.paper : theme.background.default,
                  color: isActive ? theme.text.primary : theme.text.secondary,
                }}
                onclick={() => {
                  props.onChange && props.onChange(index)
                  window.history.pushState({}, '', `#tab-${index}`)
                  updateState({ activeIndex: index })
                }}
              >
                {tab.header}
              </div>
            )

            if (isActive) {
              setTimeout(() =>
                promisifyAnimation(
                  jsxElement,
                  [{ boxShadow: 'none' }, { boxShadow: 'inset 0 -2px 0 rgba(128,128,192,0.9)' }],
                  { duration: 500, fill: 'forwards', easing: 'cubic-bezier(0.215, 0.610, 0.355, 1.000)' },
                ),
              )
            }

            return jsxElement
          })}
        </div>
        <div className="shade-tabs-header-content" style={props.style}>
          {props.tabs[getState().activeIndex].component}
        </div>
      </div>
    )
  },
})
