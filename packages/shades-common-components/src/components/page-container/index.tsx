import { Shade, createComponent } from '@furystack/shades'
import { cssVariableTheme } from '../../services/css-variable-theme.js'

/**
 * Props for the PageContainer component.
 */
export type PageContainerProps = {
  /** Maximum width of the container (CSS value). Default: '100%' */
  maxWidth?: string
  /** Center the container horizontally. Default: false */
  centered?: boolean
  /** Padding around the content (CSS value). Default: '24px' */
  padding?: string
  /** Gap between child elements (CSS value). Default: '16px' */
  gap?: string
  /** Fill the available height. Default: true */
  fullHeight?: boolean
}

/**
 * PageContainer component for common page-level patterns.
 *
 * Provides a consistent container for page content with:
 * - Optional max-width constraint
 * - Horizontal centering option
 * - Configurable padding and gap
 * - Flex column layout with gap between children
 *
 * @example
 * ```tsx
 * <PageContainer maxWidth="800px" centered padding="48px" gap="24px">
 *   <PageHeader
 *     icon={<Icon icon={icons.users} />}
 *     title="Users"
 *     description="Manage user accounts and their roles."
 *   />
 *   <Paper>
 *     Content here...
 *   </Paper>
 * </PageContainer>
 * ```
 *
 * @example
 * ```tsx
 * // Full width container
 * <PageContainer gap="16px">
 *   <h2>Dashboard</h2>
 *   <GridOfCards />
 * </PageContainer>
 * ```
 */
export const PageContainer = Shade<PageContainerProps>({
  shadowDomName: 'shade-page-container',
  elementBase: HTMLDivElement,
  elementBaseName: 'div',
  css: {
    display: 'flex',
    flexDirection: 'column',
    boxSizing: 'border-box',
    color: cssVariableTheme.text.primary,
    position: 'relative',
  },
  render: ({ props, children, useHostProps }) => {
    const { maxWidth = '100%', centered = false, padding = '24px', gap = '16px', fullHeight = true } = props

    const hostStyle: Record<string, string> = {
      maxWidth,
      padding,
      gap,
      height: fullHeight ? '100%' : 'auto',
    }
    if (centered) {
      hostStyle.marginLeft = 'auto'
      hostStyle.marginRight = 'auto'
    }
    useHostProps({ style: hostStyle })

    return <>{children}</>
  },
})

export * from './page-header.js'
