import type { ExtractRouteParams, ExtractRoutePaths, NestedRoute, PartialElement } from '@furystack/shades'
import { compileRoute, createComponent, LocationService, NestedRouteLink, Shade } from '@furystack/shades'
import { cssVariableTheme } from '../services/css-variable-theme.js'

/**
 * Individual breadcrumb item configuration.
 * When the path contains parameters (e.g. `:id`), the `params` prop becomes required.
 * @typeParam TPath - A specific route path string
 */
export type BreadcrumbItem<TPath extends string = string> = {
  path: TPath
  label: string | JSX.Element
  render?: (item: BreadcrumbItem<TPath>, isActive: boolean) => JSX.Element
} & (string extends keyof ExtractRouteParams<TPath>
  ? { params?: Record<string, string> }
  : { params: ExtractRouteParams<TPath> })

/**
 * Props for the Breadcrumb component.
 */
export type BreadcrumbProps = {
  items: BreadcrumbItem[]
  separator?: string | JSX.Element
  homeItem?: BreadcrumbItem
  lastItemClickable?: boolean
} & PartialElement<HTMLElement>

/**
 * Type-safe props constrained to a specific route tree.
 * @typeParam TRoutes - The route tree type (use `typeof yourRoutes`)
 */
export type TypedBreadcrumbProps<TRoutes extends Record<string, NestedRoute<unknown>>> = {
  items: Array<BreadcrumbItem<ExtractRoutePaths<TRoutes>>>
  separator?: string | JSX.Element
  homeItem?: BreadcrumbItem<ExtractRoutePaths<TRoutes>>
  lastItemClickable?: boolean
} & PartialElement<HTMLElement>

/**
 * A breadcrumb navigation component that works with NestedRouter to provide
 * navigation through route hierarchies.
 *
 * Supports:
 * - Dynamic route parameters (e.g. `/users/:id`)
 * - Custom labels and rendering
 * - Configurable separators
 * - Active item detection
 * - Optional home/root link
 *
 * Route parameters are automatically inferred from the path pattern:
 * - `path="/buttons"` — `params` is optional
 * - `path="/users/:id"` — `params: { id: string }` is required
 *
 * For additional URL validation against a route tree, use {@link createBreadcrumb}.
 *
 * @example
 * ```typescript
 * <Breadcrumb
 *   homeItem={{ path: '/', label: 'Home' }}
 *   items={[
 *     { path: '/users', label: 'Users' },
 *     { path: '/users/:id', label: 'User Details', params: { id: '123' } },
 *   ]}
 *   separator=" > "
 * />
 * ```
 */
export const Breadcrumb = Shade<BreadcrumbProps>({
  shadowDomName: 'shade-breadcrumb',
  elementBase: HTMLElement,
  elementBaseName: 'nav',
  css: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    padding: '8px 0',
    fontSize: '0.9em',
    color: cssVariableTheme.text.secondary,

    '& a': {
      color: 'inherit',
      textDecoration: 'none',
      transition: 'opacity 0.2s ease-in-out',
      opacity: '0.8',
    },

    '& a:hover': {
      opacity: '1',
    },

    '& [data-active="true"]': {
      opacity: '0.6',
      cursor: 'default',
    },

    '& [data-separator="true"]': {
      opacity: '0.5',
    },

    '& [data-non-clickable="true"]': {
      cursor: 'default',
    },
  },
  render: ({ props, injector, useObservable }) => {
    const { items, separator = '/', homeItem, lastItemClickable = false } = props

    const locationService = injector.getInstance(LocationService)
    const [currentPath] = useObservable('currentPath', locationService.onLocationPathChanged)

    const allItems = homeItem ? [homeItem, ...items] : items

    const renderItem = (item: BreadcrumbItem, _index: number, isLast: boolean) => {
      const compiledPath = (item as BreadcrumbItem & { params?: Record<string, string> }).params
        ? compileRoute(item.path, (item as BreadcrumbItem & { params: Record<string, string> }).params)
        : item.path

      const isActive = currentPath === compiledPath

      if (item.render) {
        return item.render(item, isActive)
      }

      if (isLast && !lastItemClickable) {
        return (
          <span data-active={isActive} data-non-clickable="true">
            {item.label}
          </span>
        )
      }

      return (
        <NestedRouteLink href={compiledPath} data-active={isActive}>
          {item.label}
        </NestedRouteLink>
      )
    }

    const renderSeparator = () => {
      if (typeof separator === 'string') {
        return <span data-separator="true">{separator}</span>
      }
      return separator
    }

    return (
      <>
        {allItems.map((item, index) => (
          <>
            {renderItem(item, index, index === allItems.length - 1)}
            {index < allItems.length - 1 && renderSeparator()}
          </>
        ))}
      </>
    )
  },
})

/**
 * Creates a type-safe wrapper around Breadcrumb constrained to a specific route tree.
 * The returned component has the same runtime behavior but narrows paths to only accept
 * valid route paths, and requires `params` when the route has parameters.
 *
 * @typeParam TRoutes - The route tree type (use `typeof yourRoutes`)
 * @returns A narrowed Breadcrumb component
 *
 * @example
 * ```typescript
 * const AppBreadcrumb = createBreadcrumb<typeof appRoutes>()
 *
 * // Type-safe: only valid paths accepted
 * <AppBreadcrumb
 *   items={[{ path: '/buttons', label: 'Buttons' }]}
 * />
 *
 * // TypeScript error: invalid path
 * <AppBreadcrumb items={[{ path: '/nonexistent', label: 'Error' }]} />
 *
 * // Params required for parameterized routes
 * <AppBreadcrumb
 *   items={[{ path: '/users/:id', label: 'User', params: { id: '123' } }]}
 * />
 * ```
 */
export const createBreadcrumb = <TRoutes extends Record<string, NestedRoute<unknown>>>() => {
  return Breadcrumb as typeof Breadcrumb & {
    (props: TypedBreadcrumbProps<TRoutes>): JSX.Element
  }
}
