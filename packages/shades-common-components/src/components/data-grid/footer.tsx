import type { FindOptions } from '@furystack/core'
import { Shade, createComponent } from '@furystack/shades'
import type { ObservableValue } from '@furystack/utils'
import type { CollectionService } from '../../services/collection-service.js'
import { ThemeProviderService } from '../../services/theme-provider-service.js'

export const dataGridItemsPerPage = [10, 20, 25, 50, 100, Infinity]

export const DataGridFooter = Shade<{
  service: CollectionService<any>
  findOptions: ObservableValue<FindOptions<any, any[]>>
}>({
  shadowDomName: 'shade-data-grid-footer',
  render: ({ props, injector, useObservable }) => {
    const { theme } = injector.getInstance(ThemeProviderService)

    const { service, findOptions } = props
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

    return (
      <div
        className="pager"
        style={{
          backdropFilter: 'blur(10px)',
          color: theme.text.secondary,
          position: 'sticky',
          bottom: '0',
          display: 'flex',
          justifyContent: 'flex-end',
          padding: '1em',
          alignItems: 'center',
        }}
      >
        {currentEntriesPerPage !== Infinity && (
          <div>
            Goto page
            <select
              style={{ margin: '0 1em' }}
              onchange={(ev) => {
                const value = parseInt((ev.target as HTMLInputElement).value, 10)
                setCurrentOptions({ ...currentOptions, skip: (currentOptions.top || 0) * value })
              }}
            >
              {[...new Array(Math.ceil(currentData.count / (currentOptions.top || Infinity)))].map((_val, index) => (
                <option value={index.toString()} selected={currentPage === index}>
                  {(index + 1).toString()}
                </option>
              ))}
            </select>
          </div>
        )}
        <div>
          Show
          <select
            style={{ margin: '0 1em' }}
            onchange={(ev) => {
              const value = parseInt((ev.currentTarget as HTMLInputElement).value, 10)
              setCurrentOptions({
                ...currentOptions,
                top: value,
                skip: currentPage * value,
              })
            }}
          >
            {dataGridItemsPerPage.map((no) => (
              <option value={no.toString()} selected={no === currentEntriesPerPage}>
                {no.toString()}
              </option>
            ))}
          </select>
          items per page
        </div>
      </div>
    )
  },
})
