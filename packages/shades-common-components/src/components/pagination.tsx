import type { PartialElement } from '@furystack/shades'
import { Shade, createComponent } from '@furystack/shades'
import { buildTransition, cssVariableTheme } from '../services/css-variable-theme.js'
import type { Palette } from '../services/theme-provider-service.js'

export type PaginationProps = PartialElement<HTMLElement> & {
  /** Total number of pages */
  count: number
  /** Current page (1-indexed) */
  page: number
  /** Callback fired when the page is changed */
  onPageChange: (page: number) => void
  /** Number of sibling pages shown around the current page. Defaults to 1 */
  siblingCount?: number
  /** Number of pages shown at the start and end. Defaults to 1 */
  boundaryCount?: number
  /** If true, the pagination is disabled */
  disabled?: boolean
  /** Size variant */
  size?: 'small' | 'medium' | 'large'
  /** Palette color */
  color?: keyof Palette
}

type PaginationItem = { type: 'page'; page: number } | { type: 'ellipsis'; key: string }

/**
 * Generates the list of pagination items (page numbers and ellipsis markers).
 */
const getPaginationRange = (
  count: number,
  page: number,
  siblingCount: number,
  boundaryCount: number,
): PaginationItem[] => {
  const totalPageNumbers = boundaryCount * 2 + siblingCount * 2 + 3 // boundaries + siblings + current + 2 ellipses

  if (totalPageNumbers >= count) {
    return Array.from({ length: count }, (_, i) => ({ type: 'page' as const, page: i + 1 }))
  }

  const leftSiblingIndex = Math.max(page - siblingCount, boundaryCount + 1)
  const rightSiblingIndex = Math.min(page + siblingCount, count - boundaryCount)

  const showLeftEllipsis = leftSiblingIndex > boundaryCount + 2
  const showRightEllipsis = rightSiblingIndex < count - boundaryCount - 1

  const items: PaginationItem[] = []

  // Left boundary pages
  for (let i = 1; i <= boundaryCount; i++) {
    items.push({ type: 'page', page: i })
  }

  if (showLeftEllipsis) {
    items.push({ type: 'ellipsis', key: 'start-ellipsis' })
  } else {
    // Fill in pages between boundary and sibling range
    for (let i = boundaryCount + 1; i < leftSiblingIndex; i++) {
      items.push({ type: 'page', page: i })
    }
  }

  // Sibling pages + current page
  for (let i = leftSiblingIndex; i <= rightSiblingIndex; i++) {
    items.push({ type: 'page', page: i })
  }

  if (showRightEllipsis) {
    items.push({ type: 'ellipsis', key: 'end-ellipsis' })
  } else {
    // Fill in pages between sibling range and right boundary
    for (let i = rightSiblingIndex + 1; i <= count - boundaryCount; i++) {
      items.push({ type: 'page', page: i })
    }
  }

  // Right boundary pages
  for (let i = count - boundaryCount + 1; i <= count; i++) {
    items.push({ type: 'page', page: i })
  }

  return items
}

const colorMap: Record<keyof Palette, { main: string; mainContrast: string }> = {
  primary: {
    main: cssVariableTheme.palette.primary.main,
    mainContrast: cssVariableTheme.palette.primary.mainContrast,
  },
  secondary: {
    main: cssVariableTheme.palette.secondary.main,
    mainContrast: cssVariableTheme.palette.secondary.mainContrast,
  },
  error: {
    main: cssVariableTheme.palette.error.main,
    mainContrast: cssVariableTheme.palette.error.mainContrast,
  },
  warning: {
    main: cssVariableTheme.palette.warning.main,
    mainContrast: cssVariableTheme.palette.warning.mainContrast,
  },
  success: {
    main: cssVariableTheme.palette.success.main,
    mainContrast: cssVariableTheme.palette.success.mainContrast,
  },
  info: {
    main: cssVariableTheme.palette.info.main,
    mainContrast: cssVariableTheme.palette.info.mainContrast,
  },
}

const defaultColors = {
  main: cssVariableTheme.text.primary,
  mainContrast: cssVariableTheme.background.default,
}

export const Pagination = Shade<PaginationProps>({
  shadowDomName: 'shade-pagination',
  css: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: cssVariableTheme.spacing.xs,
    fontFamily: cssVariableTheme.typography.fontFamily,
    userSelect: 'none',

    '& .pagination-item': {
      display: 'inline-flex',
      alignItems: 'center',
      justifyContent: 'center',
      border: 'none',
      borderRadius: cssVariableTheme.shape.borderRadius.md,
      background: 'transparent',
      color: cssVariableTheme.text.primary,
      cursor: 'pointer',
      fontFamily: 'inherit',
      fontWeight: cssVariableTheme.typography.fontWeight.medium,
      lineHeight: '1',
      padding: '0',
      transition: buildTransition(
        ['background', cssVariableTheme.transitions.duration.fast, cssVariableTheme.transitions.easing.default],
        ['color', cssVariableTheme.transitions.duration.fast, cssVariableTheme.transitions.easing.default],
      ),
    },

    '& .pagination-item:hover:not([data-disabled]):not([data-selected])': {
      background: 'color-mix(in srgb, var(--pagination-color-main) 12%, transparent)',
    },

    '& .pagination-item[data-selected]': {
      background: 'var(--pagination-color-main)',
      color: 'var(--pagination-color-contrast)',
    },

    '& .pagination-item[data-disabled]': {
      opacity: '0.4',
      cursor: 'not-allowed',
      pointerEvents: 'none',
    },

    '& .pagination-ellipsis': {
      display: 'inline-flex',
      alignItems: 'center',
      justifyContent: 'center',
      color: cssVariableTheme.text.secondary,
      pointerEvents: 'none',
      letterSpacing: '2px',
    },

    // Size: medium (default)
    '&:not([data-size]) .pagination-item, &[data-size="medium"] .pagination-item': {
      minWidth: '32px',
      height: '32px',
      fontSize: cssVariableTheme.typography.fontSize.sm,
    },
    '&:not([data-size]) .pagination-ellipsis, &[data-size="medium"] .pagination-ellipsis': {
      minWidth: '32px',
      height: '32px',
      fontSize: cssVariableTheme.typography.fontSize.sm,
    },

    // Size: small
    '&[data-size="small"] .pagination-item': {
      minWidth: '26px',
      height: '26px',
      fontSize: cssVariableTheme.typography.fontSize.xs,
    },
    '&[data-size="small"] .pagination-ellipsis': {
      minWidth: '26px',
      height: '26px',
      fontSize: cssVariableTheme.typography.fontSize.xs,
    },

    // Size: large
    '&[data-size="large"] .pagination-item': {
      minWidth: '40px',
      height: '40px',
      fontSize: cssVariableTheme.typography.fontSize.md,
    },
    '&[data-size="large"] .pagination-ellipsis': {
      minWidth: '40px',
      height: '40px',
      fontSize: cssVariableTheme.typography.fontSize.md,
    },

    // Disabled state on the host
    '&[data-disabled]': {
      opacity: '0.6',
      pointerEvents: 'none',
    },
  },
  render: ({ props, element }) => {
    const { count, page, onPageChange, siblingCount = 1, boundaryCount = 1, disabled, size, color, style } = props

    if (size) {
      element.setAttribute('data-size', size)
    } else {
      element.removeAttribute('data-size')
    }

    if (disabled) {
      element.setAttribute('data-disabled', '')
    } else {
      element.removeAttribute('data-disabled')
    }

    const colors = color ? colorMap[color] : defaultColors
    element.style.setProperty('--pagination-color-main', colors.main)
    element.style.setProperty('--pagination-color-contrast', colors.mainContrast)

    if (style) {
      Object.assign(element.style, style)
    }

    const items = getPaginationRange(count, page, siblingCount, boundaryCount)

    const isPrevDisabled = disabled || page <= 1
    const isNextDisabled = disabled || page >= count

    return (
      <>
        <button
          className="pagination-item"
          aria-label="Go to previous page"
          {...(isPrevDisabled ? { 'data-disabled': '' } : {})}
          onclick={() => {
            if (!isPrevDisabled) onPageChange(page - 1)
          }}
        >
          ‹
        </button>
        {items.map((item) =>
          item.type === 'page' ? (
            <button
              className="pagination-item"
              aria-label={`Go to page ${item.page}`}
              {...(item.page === page ? { 'data-selected': '' } : {})}
              {...(disabled ? { 'data-disabled': '' } : {})}
              onclick={() => {
                if (!disabled && item.page !== page) onPageChange(item.page)
              }}
            >
              {item.page.toString()}
            </button>
          ) : (
            <span className="pagination-ellipsis" aria-hidden="true">
              …
            </span>
          ),
        )}
        <button
          className="pagination-item"
          aria-label="Go to next page"
          {...(isNextDisabled ? { 'data-disabled': '' } : {})}
          onclick={() => {
            if (!isNextDisabled) onPageChange(page + 1)
          }}
        >
          ›
        </button>
      </>
    )
  },
})
