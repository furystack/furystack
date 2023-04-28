import { Shade, createComponent } from '@furystack/shades'
import { ThemeProviderService } from '../../services/theme-provider-service.js'
import type { CollectionService } from '../../services/collection-service.js'

export const dataGridItemsPerPage = [10, 20, 25, 50, 100, Infinity]

export const DataGridFooter = Shade<{ service: CollectionService<any> }>({
  shadowDomName: 'shade-data-grid-footer',
  render: ({ props, injector, useObservable }) => {
    const { theme } = injector.getInstance(ThemeProviderService)

    const [currentData] = useObservable('dataUpdater', props.service.data)

    const [currentQuerySettings] = useObservable('querySettings', props.service.querySettings)

    const top = currentQuerySettings.top || Infinity
    const skip = currentQuerySettings.skip || 0
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
                const value = parseInt((ev.target as any).value, 10)
                const currentQuery = props.service.querySettings.getValue()
                props.service.querySettings.setValue({ ...currentQuery, skip: (currentQuery.top || 0) * value })
              }}
            >
              {[
                ...new Array(Math.ceil(currentData.count / (props.service.querySettings.getValue().top || Infinity))),
              ].map((_val, index) => (
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
              const value = parseInt((ev.currentTarget as any).value as string, 10)
              props.service.querySettings.setValue({
                ...currentQuerySettings,
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
