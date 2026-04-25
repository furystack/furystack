import { Shade, createComponent, SpatialNavigationService } from '@furystack/shades'
import { cssVariableTheme } from '../services/css-variable-theme.js'

let nextModalId = 0

export type ModalProps = {
  backdropStyle?: Partial<CSSStyleDeclaration>
  isVisible: boolean
  onClose?: () => void
  showAnimation?: (el: Element | null) => Promise<unknown>
  hideAnimation?: (el: Element | null) => Promise<unknown>
  /**
   * When true, traps spatial navigation within the modal's bounds.
   * If SpatialNavigationService is not yet instantiated, it will be created with defaults.
   */
  trapFocus?: boolean
  /**
   * Section name for spatial navigation scoping.
   * @default 'modal'
   */
  navSection?: string
}

export const Modal = Shade<ModalProps>({
  customElementName: 'shade-modal',
  css: {
    fontFamily: cssVariableTheme.typography.fontFamily,
    '& .shade-backdrop': {
      width: '100%',
      height: '100%',
      display: 'block',
      position: 'fixed',
      top: '0',
      left: '0',
    },
  },
  render: ({ props, children, injector, useRef, useDisposable, useState }) => {
    const { isVisible, trapFocus, navSection } = props
    const backdropRef = useRef<HTMLDivElement>('backdrop')
    const [generatedSectionId] = useState('generatedSectionId', String(nextModalId++))
    const sectionName = navSection ?? `modal-${generatedSectionId}`

    useDisposable(
      'spatial-nav-trap',
      () => {
        if (!isVisible || !trapFocus) return { [Symbol.dispose]: () => {} }

        const spatialNav = injector.get(SpatialNavigationService)

        const previousSection = spatialNav.activeSection.getValue()
        spatialNav.pushFocusTrap(sectionName)

        return {
          [Symbol.dispose]: () => {
            try {
              spatialNav.popFocusTrap(sectionName, previousSection)
            } catch {
              // Service may already be disposed during injector teardown
            }
          },
        }
      },
      [isVisible, trapFocus],
    )

    if (isVisible) {
      queueMicrotask(() => {
        void props.showAnimation?.(backdropRef.current)
      })
    }

    return isVisible ? (
      <div
        ref={backdropRef}
        className="shade-backdrop"
        data-nav-section={sectionName}
        onclick={async () => {
          await props.hideAnimation?.(backdropRef.current)
          props.onClose?.()
        }}
        style={props.backdropStyle}
      >
        {children}
      </div>
    ) : null
  },
})
