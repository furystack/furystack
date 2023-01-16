import { Shade, createComponent } from '@furystack/shades'
import { ThemeProviderService } from '../../services'
import type { CollectionService, CollectionData } from '../../services/collection-service'

export const dataGridItemsPerPage = [10, 20, 25, 50, 100, Infinity]

export const DataGridFooter = Shade<{ service: CollectionService<any> }, { data: CollectionData<any> }>({
  shadowDomName: 'shade-data-grid-footer',
  getInitialState: ({ props }) => ({
    data: props.service.data.getValue(),
  }),
  resources: ({ props, useState }) => {
    const [, setData] = useState('data')

    return [props.service.data.subscribe(setData)]
  },
  render: ({ props, useState, injector }) => {
    const [data] = useState('data')
    const currentQuerySettings = props.service.querySettings.getValue()
    const currentPage = Math.ceil(currentQuerySettings.skip || 0) / (currentQuerySettings.top || 1)
    const currentEntriesPerPage = currentQuerySettings.top || Infinity
    const { theme } = injector.getInstance(ThemeProviderService)

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
              {[...new Array(Math.ceil(data.count / (props.service.querySettings.getValue().top || Infinity)))].map(
                (_val, index) => (
                  <option value={index.toString()} selected={currentPage === index}>
                    {(index + 1).toString()}
                  </option>
                ),
              )}
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
