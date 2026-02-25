import type { FindOptions } from '@furystack/core'
import { Shade, createComponent } from '@furystack/shades'
import type { ObservableValue } from '@furystack/utils'
import type { CollectionService } from '../../services/collection-service.js'
import { cssVariableTheme } from '../../services/css-variable-theme.js'
import { Pagination } from '../pagination.js'

export const dataGridItemsPerPage = [10, 20, 25, 50, 100, Infinity]

export const DataGridFooter: <T>(props: {
  service: CollectionService<T>
  findOptions: ObservableValue<FindOptions<T, Array<keyof T>>>
  paginationOptions?: number[]
}) => JSX.Element = Shade({
  shadowDomName: 'shade-data-grid-footer',
  css: {
    display: 'block',
    fontFamily: cssVariableTheme.typography.fontFamily,
    '& .pager': {
      backdropFilter: 'blur(10px)',
      color: cssVariableTheme.text.secondary,
      position: 'sticky',
      bottom: '0',
      display: 'flex',
      justifyContent: 'flex-end',
      padding: '8px 12px',
      alignItems: 'center',
      gap: '16px',
      fontSize: cssVariableTheme.typography.fontSize.xs,
    },
    '& .pager-section': {
      display: 'flex',
      alignItems: 'center',
      gap: '6px',
    },
    '& select': {
      padding: '4px 8px',
      borderRadius: cssVariableTheme.shape.borderRadius.sm,
      border: `1px solid ${cssVariableTheme.divider}`,
      background: cssVariableTheme.background.default,
      color: cssVariableTheme.text.primary,
      fontSize: cssVariableTheme.typography.fontSize.xs,
      cursor: 'pointer',
    },
  },
  render: ({ props, useObservable }) => {
    const { service, findOptions, paginationOptions = dataGridItemsPerPage } = props
    const [currentData] = useObservable('dataUpdater', service.data)
    const [currentOptions, setCurrentOptions] = useObservable('optionsUpdater', findOptions, {
      filter: (newValue, oldValue) => {
        return newValue.top !== oldValue.top || newValue.skip !== oldValue.skip
      },
    })

    const top = currentOptions.top || Infinity
    const skip = currentOptions.skip || 0
    const currentPage = Math.ceil(skip) / (top || 1)
    const currentEntriesPerPage = top

    const pageCount = Math.ceil(currentData.count / (currentOptions.top || Infinity))

    return (
      <div className="pager">
        {currentEntriesPerPage !== Infinity && pageCount > 1 && (
          <Pagination
            count={pageCount}
            page={currentPage + 1}
            size="small"
            onPageChange={(newPage) => {
              setCurrentOptions({ ...currentOptions, skip: (currentOptions.top || 0) * (newPage - 1) })
            }}
          />
        )}
        {paginationOptions.length > 1 && (
          <div className="pager-section">
            <span>Rows per page</span>
            <select
              onchange={(ev) => {
                const value = parseInt((ev.currentTarget as HTMLInputElement).value, 10)
                setCurrentOptions({
                  ...currentOptions,
                  top: value,
                  skip: currentPage * value,
                })
              }}
            >
              {paginationOptions.map((no) => (
                <option value={no.toString()} selected={no === currentEntriesPerPage}>
                  {no === Infinity ? 'All' : no.toString()}
                </option>
              ))}
            </select>
          </div>
        )}
      </div>
    )
  },
})
