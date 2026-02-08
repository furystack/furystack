import { LocationService, Shade, createComponent } from '@furystack/shades'
import { buildTransition, cssVariableTheme } from '../services/css-variable-theme.js'
import { Icon } from './icons/icon.js'
import { close } from './icons/icon-definitions.js'

export type Tab = {
  header: JSX.Element
  component: JSX.Element
  hash: string
  /** Whether this tab shows a close button. Only effective when onClose is provided on Tabs */
  closable?: boolean
}

const TabHeader = Shade<{ hash: string }>({
  shadowDomName: 'shade-tab-header',
  css: {
    padding: `${cssVariableTheme.spacing.md} 40px`,
    cursor: 'pointer',
    transition: buildTransition(
      ['box-shadow', cssVariableTheme.transitions.duration.slow, 'ease'],
      ['background', cssVariableTheme.transitions.duration.slow, 'ease'],
      ['color', cssVariableTheme.transitions.duration.slow, 'ease'],
      ['font-weight', cssVariableTheme.transitions.duration.slow, 'ease'],
    ),
    fontWeight: 'inherit',
    background: cssVariableTheme.background.default,
    color: cssVariableTheme.text.secondary,
    boxShadow: 'none',
    display: 'inline-flex',
    alignItems: 'center',
    gap: cssVariableTheme.spacing.sm,
    textDecoration: 'none',
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
  /** When provided, tabs operate in controlled mode (URL hash is ignored) */
  activeKey?: string
  /** Called when the active tab changes (receives the tab's hash) */
  onTabChange?: (key: string) => void
  /** Visual style of the tab headers. Defaults to 'line' */
  type?: 'line' | 'card'
  /** Layout orientation. Defaults to 'horizontal' */
  orientation?: 'horizontal' | 'vertical'
  /** Called when a closable tab's close button is clicked */
  onClose?: (key: string) => void
  /** Called when the add button is clicked (only shown when this callback is provided) */
  onAdd?: () => void
}>({
  shadowDomName: 'shade-tabs',
  css: {
    width: '100%',
    height: '100%',
    display: 'flex',
    flexDirection: 'column',

    '& .shade-tabs-header-container': {
      display: 'inline-flex',
      borderRadius: `${cssVariableTheme.shape.borderRadius.md} ${cssVariableTheme.shape.borderRadius.md} 0 0`,
      overflow: 'hidden',
      flexShrink: '0',
    },

    // Controlled mode tab button
    '& .shade-tab-btn': {
      padding: `${cssVariableTheme.spacing.md} 40px`,
      cursor: 'pointer',
      transition: buildTransition(
        ['box-shadow', cssVariableTheme.transitions.duration.slow, 'ease'],
        ['background', cssVariableTheme.transitions.duration.slow, 'ease'],
        ['color', cssVariableTheme.transitions.duration.slow, 'ease'],
        ['font-weight', cssVariableTheme.transitions.duration.slow, 'ease'],
      ),
      fontWeight: 'inherit',
      background: cssVariableTheme.background.default,
      color: cssVariableTheme.text.secondary,
      boxShadow: 'none',
      display: 'inline-flex',
      alignItems: 'center',
      gap: cssVariableTheme.spacing.sm,
      border: 'none',
      font: 'inherit',
    },
    '& .shade-tab-btn.active': {
      fontWeight: 'bolder',
      background: cssVariableTheme.background.paper,
      color: cssVariableTheme.text.primary,
      boxShadow: `inset 0 -2px 0 ${cssVariableTheme.palette.primary.main}`,
    },

    // Close button (span with role="button" via event delegation)
    '& .shade-tab-close': {
      display: 'inline-flex',
      alignItems: 'center',
      justifyContent: 'center',
      width: '16px',
      height: '16px',
      borderRadius: cssVariableTheme.shape.borderRadius.xs,
      opacity: '0.5',
      fontSize: '12px',
      lineHeight: '1',
      transition: buildTransition(
        ['opacity', cssVariableTheme.transitions.duration.fast, cssVariableTheme.transitions.easing.default],
        ['background', cssVariableTheme.transitions.duration.fast, cssVariableTheme.transitions.easing.default],
      ),
    },
    '& .shade-tab-close:hover': {
      opacity: '1',
      background: cssVariableTheme.action.hoverBackground,
    },

    // Add tab button
    '& .shade-tab-add': {
      display: 'inline-flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: `${cssVariableTheme.spacing.sm} ${cssVariableTheme.spacing.md}`,
      border: 'none',
      background: 'transparent',
      color: cssVariableTheme.text.secondary,
      cursor: 'pointer',
      fontSize: '18px',
      lineHeight: '1',
      transition: buildTransition(
        ['color', cssVariableTheme.transitions.duration.fast, cssVariableTheme.transitions.easing.default],
        ['background', cssVariableTheme.transitions.duration.fast, cssVariableTheme.transitions.easing.default],
      ),
    },
    '& .shade-tab-add:hover': {
      color: cssVariableTheme.text.primary,
      background: cssVariableTheme.action.hoverBackground,
    },

    // --- Vertical orientation ---
    '&[data-orientation="vertical"]': {
      flexDirection: 'row',
    },
    '&[data-orientation="vertical"] .shade-tabs-header-container': {
      flexDirection: 'column',
      borderRadius: `${cssVariableTheme.shape.borderRadius.md} 0 0 ${cssVariableTheme.shape.borderRadius.md}`,
    },
    '&[data-orientation="vertical"] a[is="shade-tab-header"].active, &[data-orientation="vertical"] .shade-tab-btn.active':
      {
        boxShadow: `inset -2px 0 0 ${cssVariableTheme.palette.primary.main}`,
      },

    // --- Card type ---
    '&[data-type="card"] .shade-tabs-header-container': {
      gap: '2px',
      borderRadius: '0',
      overflow: 'visible',
      borderBottom: `1px solid ${cssVariableTheme.action.subtleBorder}`,
    },
    '&[data-type="card"] a[is="shade-tab-header"], &[data-type="card"] .shade-tab-btn': {
      borderRadius: `${cssVariableTheme.shape.borderRadius.md} ${cssVariableTheme.shape.borderRadius.md} 0 0`,
      border: '1px solid transparent',
      borderBottom: 'none',
      marginBottom: '-1px',
      background: 'transparent',
    },
    '&[data-type="card"] a[is="shade-tab-header"].active, &[data-type="card"] .shade-tab-btn.active': {
      boxShadow: 'none',
      background: cssVariableTheme.background.paper,
      border: `1px solid ${cssVariableTheme.action.subtleBorder}`,
      borderBottom: `1px solid ${cssVariableTheme.background.paper}`,
    },

    // --- Card type + vertical ---
    '&[data-type="card"][data-orientation="vertical"] .shade-tabs-header-container': {
      borderBottom: 'none',
      borderRight: `1px solid ${cssVariableTheme.action.subtleBorder}`,
    },
    '&[data-type="card"][data-orientation="vertical"] a[is="shade-tab-header"], &[data-type="card"][data-orientation="vertical"] .shade-tab-btn':
      {
        borderRadius: `${cssVariableTheme.shape.borderRadius.md} 0 0 ${cssVariableTheme.shape.borderRadius.md}`,
        border: '1px solid transparent',
        borderRight: 'none',
        marginRight: '-1px',
        marginBottom: '0',
      },
    '&[data-type="card"][data-orientation="vertical"] a[is="shade-tab-header"].active, &[data-type="card"][data-orientation="vertical"] .shade-tab-btn.active':
      {
        boxShadow: 'none',
        background: cssVariableTheme.background.paper,
        border: `1px solid ${cssVariableTheme.action.subtleBorder}`,
        borderRight: `1px solid ${cssVariableTheme.background.paper}`,
      },
  },
  render: ({ props, element, useObservable, injector }) => {
    if (props.containerStyle) {
      Object.assign(element.style, props.containerStyle)
    }

    if (props.orientation === 'vertical') {
      element.setAttribute('data-orientation', 'vertical')
    } else {
      element.removeAttribute('data-orientation')
    }

    if (props.type === 'card') {
      element.setAttribute('data-type', 'card')
    } else {
      element.removeAttribute('data-type')
    }

    const isControlled = props.activeKey !== undefined

    const [hash] = useObservable('updateLocation', injector.getInstance(LocationService).onLocationHashChanged)

    const activeKey = isControlled ? props.activeKey! : hash.replace('#', '')
    const activeTab = props.tabs.find((t) => t.hash === activeKey)

    const handleTabClick = (e: MouseEvent, tab: Tab, index: number) => {
      const target = e.target as HTMLElement
      if (target.closest('.shade-tab-close')) {
        e.stopPropagation()
        e.preventDefault()
        props.onClose?.(tab.hash)
        return
      }
      props.onTabChange?.(tab.hash)
      props.onChange?.(index)
    }

    return (
      <>
        <div className="shade-tabs-header-container" role="tablist">
          {props.tabs.map((tab, index) => {
            const isActive = tab.hash === activeKey
            const hasCloseButton = tab.closable && props.onClose

            return isControlled ? (
              <button
                className={`shade-tab-btn${isActive ? ' active' : ''}`}
                role="tab"
                aria-selected={String(isActive)}
                tabIndex={isActive ? 0 : -1}
                onclick={(e: MouseEvent) => handleTabClick(e, tab, index)}
              >
                {tab.header}
                {hasCloseButton ? (
                  <span className="shade-tab-close">
                    <Icon icon={close} size={12} />
                  </span>
                ) : null}
              </button>
            ) : (
              <TabHeader hash={tab.hash} onclick={(e: MouseEvent) => handleTabClick(e, tab, index)}>
                {tab.header}
                {hasCloseButton ? (
                  <span className="shade-tab-close">
                    <Icon icon={close} size={12} />
                  </span>
                ) : null}
              </TabHeader>
            )
          })}
          {props.onAdd ? (
            <button className="shade-tab-add" aria-label="Add tab" onclick={() => props.onAdd!()}>
              +
            </button>
          ) : null}
        </div>
        {activeTab?.component}
      </>
    )
  },
})
