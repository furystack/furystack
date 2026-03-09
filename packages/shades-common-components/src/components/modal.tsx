import { Shade, createComponent, SpatialNavigationService } from '@furystack/shades'
import { cssVariableTheme } from '../services/css-variable-theme.js'

export type ModalProps = {
  backdropStyle?: Partial<CSSStyleDeclaration>
  isVisible: boolean
  onClose?: () => void
  showAnimation?: (el: Element | null) => Promise<unknown>
  hideAnimation?: (el: Element | null) => Promise<unknown>
  /**
   * When true, traps spatial navigation within the modal's bounds.
   * Requires SpatialNavigationService to be active in the injector.
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
    const [generatedSectionId] = useState('generatedSectionId', Math.random().toString(36).slice(2, 8))
    const sectionName = navSection ?? `modal-${generatedSectionId}`

    useDisposable(
      'spatial-nav-trap',
      () => {
        if (!isVisible || !trapFocus) return { [Symbol.dispose]: () => {} }

        const spatialNav = injector.cachedSingletons.get(SpatialNavigationService) as
          | SpatialNavigationService
          | undefined
        if (!spatialNav) return { [Symbol.dispose]: () => {} }

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
