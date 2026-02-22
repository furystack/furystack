import type { ChildrenList } from '@furystack/shades'
import { createComponent, Shade } from '@furystack/shades'
import { ClickAwayService } from '../../../services/click-away-service.js'
import { buildTransition, cssVariableTheme } from '../../../services/css-variable-theme.js'

export type FilterDropdownProps = {
  onClose: () => void
}

export const FilterDropdown: (props: FilterDropdownProps, children: ChildrenList) => JSX.Element = Shade({
  shadowDomName: 'data-grid-filter-dropdown',
  css: {
    display: 'block',
    position: 'absolute',
    top: '100%',
    left: '0',
    zIndex: '10',
    '& .filter-dropdown-panel': {
      background: cssVariableTheme.background.paper,
      borderRadius: cssVariableTheme.shape.borderRadius.md,
      boxShadow: cssVariableTheme.shadows.lg,
      border: `1px solid ${cssVariableTheme.divider}`,
      padding: cssVariableTheme.spacing.md,
      opacity: '0',
      transform: 'scale(0.95) translateY(-4px)',
      transition: buildTransition(
        ['opacity', cssVariableTheme.transitions.duration.fast, 'ease-out'],
        ['transform', cssVariableTheme.transitions.duration.fast, 'ease-out'],
      ),
    },
    '& .filter-dropdown-panel.visible': {
      opacity: '1',
      transform: 'scale(1) translateY(0)',
    },
  },
  render: ({ props, children, useDisposable, useRef }) => {
    const panelRef = useRef<HTMLDivElement>('panel')

    useDisposable(
      'clickAway',
      () =>
        new ClickAwayService(panelRef, () => {
          props.onClose()
        }),
    )

    requestAnimationFrame(() => {
      panelRef.current?.classList.add('visible')
    })

    return (
      <div ref={panelRef} className="filter-dropdown-panel" onclick={(ev: MouseEvent) => ev.stopPropagation()}>
        {children}
      </div>
    )
  },
})
